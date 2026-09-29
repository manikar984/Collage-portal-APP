import { randomBytes, randomUUID, timingSafeEqual, scryptSync } from "crypto";
import { buildSeed, demoPasswordHash, type Role, type User } from "./seed";
import { computeCgpa, receiptHash, requestHash } from "./pure";

type Seed = ReturnType<typeof buildSeed>;

export type Invoice = Omit<Seed["invoices"][number], "invoiceId" | "studentId" | "status"> & {
  invoiceId: string;
  studentId: string;
  status: "UNPAID" | "PENDING" | "PAID";
};

export type Payment = Omit<
  Seed["payments"][number],
  "txnId" | "invoiceId" | "studentId" | "gatewayRef" | "method" | "status" | "receiptNo" | "receiptHash"
> & {
  txnId: string;
  invoiceId: string;
  studentId: string;
  gatewayRef: string | null;
  method: string | null;
  status: "CREATED" | "AUTHORIZED" | "SETTLED" | "FAILED";
  receiptNo: string | null;
  receiptHash: string | null;
};

export type Pass = Omit<Seed["passes"][number], "id" | "studentId" | "status"> & {
  id: string;
  studentId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "USED" | "EXPIRED";
  scanToken?: string | null;
  scannedAt?: string | null;
};

type IdemRow = {
  key: string;
  userId: string;
  scope: string;
  requestHash: string;
  response: unknown;
  status: "IN_PROGRESS" | "COMPLETED";
};

type RefreshRow = {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: number;
  revokedAt: number | null;
  replacedBy: string | null;
};

type MfaGrant = { userId: string; purpose: string; expiresAt: number };

export class ForbiddenError extends Error {
  status = 403;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends Error {
  status = 409;
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

function same(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export class CampusStore {
  users = buildSeed().users;
  departments = buildSeed().departments;
  profiles = buildSeed().profiles;
  courses = buildSeed().courses;
  invoices: Invoice[] = buildSeed().invoices;
  payments: Payment[] = buildSeed().payments;
  hallTickets = buildSeed().hallTickets;
  papers = buildSeed().papers;
  scholarships = buildSeed().scholarships;
  applications = buildSeed().applications;
  passes: Pass[] = buildSeed().passes;
  circulars = buildSeed().circulars;
  placements = buildSeed().placements;
  stats = buildSeed().stats;
  alumni = buildSeed().alumni;
  gallery = buildSeed().gallery;
  attendance = buildSeed().attendance;
  roster = buildSeed().roster.map((row) => ({ ...row }));
  leads = buildSeed().leads;
  faculty = buildSeed().faculty;
  cie: { studentId: string; courseCode: string; marks: number }[] = [];
  notices: { id: string; userId: string; title: string; body: string; createdAt: string }[] = [];
  mentors: { id: string; name: string; email: string; interest: string; alumniName: string; createdAt: string }[] = [];
  devices: { userId: string; token: string; platform: string; createdAt: string }[] = [];
  contacts: { id: string; userId: string; name: string; email: string; phone: string; message: string; createdAt: string }[] = [];
  paperDownloads = new Map<string, number>();
  idempotency = new Map<string, IdemRow>();
  refresh = new Map<string, RefreshRow>();
  mfa = new Map<string, MfaGrant>();
  otp = new Map<string, { code: string; purpose: string; expiresAt: number }>();
  jobs: { id: string; name: string; payload: unknown; status: string }[] = [];

  findByIdentifier(identifier: string) {
    const key = identifier.trim().toLowerCase();
    return this.users.find(
      (user) =>
        user.email.toLowerCase() === key ||
        user.rollNo?.toLowerCase() === key ||
        user.facultyId?.toLowerCase() === key,
    );
  }

  verifyPassword(user: User, password: string) {
    const next = scryptSync(password, "helios-demo-salt", 32).toString("hex");
    return same(user.passwordHash, next) || same(user.passwordHash, demoPasswordHash(password));
  }

  issueOtp(userId: string, purpose: string, code: string) {
    this.otp.set(`${userId}:${purpose}`, { code, purpose, expiresAt: Date.now() + 5 * 60_000 });
  }

  consumeOtp(userId: string, purpose: string, code: string) {
    const row = this.otp.get(`${userId}:${purpose}`);
    if (!row || row.expiresAt < Date.now() || row.code !== code) return false;
    this.otp.delete(`${userId}:${purpose}`);
    this.mfa.set(`${userId}:${purpose}`, { userId, purpose, expiresAt: Date.now() + 10 * 60_000 });
    return true;
  }

  assertMfa(userId: string, purpose: string) {
    const grant = this.mfa.get(`${userId}:${purpose}`);
    if (!grant || grant.expiresAt < Date.now()) {
      throw new ForbiddenError("MFA required for this action");
    }
  }

  saveRefresh(row: RefreshRow) {
    this.refresh.set(row.tokenHash, row);
  }

  rotateRefresh(tokenHash: string, nextHash: string, ttlMs: number) {
    const current = this.refresh.get(tokenHash);
    if (!current || current.revokedAt || current.expiresAt < Date.now()) return null;
    if (current.replacedBy) {
      for (const row of Array.from(this.refresh.values())) {
        if (row.familyId === current.familyId) row.revokedAt = Date.now();
      }
      return { reuse: true as const };
    }
    current.revokedAt = Date.now();
    current.replacedBy = nextHash;
    const next: RefreshRow = {
      id: randomUUID(),
      userId: current.userId,
      tokenHash: nextHash,
      familyId: current.familyId,
      expiresAt: Date.now() + ttlMs,
      revokedAt: null,
      replacedBy: null,
    };
    this.refresh.set(nextHash, next);
    return { reuse: false as const, userId: current.userId };
  }

  assertCanReadStudent(actor: { id: string; role: Role }, studentId: string) {
    if (studentId === actor.id) return;
    if (actor.role === "ADMIN" || actor.role === "EXAM_CELL") return;
    if (actor.role === "WARDEN") {
      const profile = this.profiles.find((row) => row.userId === studentId);
      if (profile?.hostelResident) return;
    }
    if (actor.role === "FACULTY") {
      const teaches = this.courses.some(
        (row) => row.studentId === studentId && ["CS401", "CS402", "CS403", "HS401"].includes(row.courseCode),
      );
      if (teaches && actor.id === "33333333-3333-4333-8333-333333333333") return;
    }
    throw new ForbiddenError("You cannot read another student's record");
  }

  profile(userId: string) {
    return this.profiles.find((row) => row.userId === userId) ?? null;
  }

  academics(studentId: string) {
    const rows = this.courses.filter((row) => row.studentId === studentId);
    const summary = computeCgpa(rows);
    const profile = this.profile(studentId);
    const required = profile?.requiredCredits ?? 160;
    return {
      ...summary,
      requiredCredits: required,
      remainingCredits: Math.max(0, required - summary.earnedCredits),
      rows,
    };
  }

  invoicesFor(studentId: string) {
    return this.invoices.filter((row) => row.studentId === studentId);
  }

  beginCheckout(actorId: string, invoiceId: string, idempotencyKey: string) {
    const invoice = this.invoices.find((row) => row.invoiceId === invoiceId);
    if (!invoice || invoice.studentId !== actorId) throw new ForbiddenError("Invoice not found for this student");
    if (invoice.status === "PAID") throw new ConflictError("Invoice is already paid");
    const body = { invoiceId, amountPaise: invoice.amountPaise };
    const hash = requestHash(body);
    const existing = this.idempotency.get(idempotencyKey);
    if (existing) {
      if (existing.userId !== actorId || existing.requestHash !== hash) {
        throw new ConflictError("Idempotency key was reused with a different request");
      }
      const prior = existing.response as { txnId: string; gatewayRef: string; amountPaise: number };
      return { ...prior, reused: true };
    }
    const open = this.payments.find(
      (row) => row.invoiceId === invoiceId && ["CREATED", "AUTHORIZED", "SETTLED"].includes(row.status),
    );
    if (open && open.status !== "SETTLED") {
      const response = { txnId: open.txnId, gatewayRef: open.gatewayRef || "", amountPaise: open.amountPaise, reused: true };
      this.idempotency.set(idempotencyKey, { key: idempotencyKey, userId: actorId, scope: "checkout", requestHash: hash, response, status: "COMPLETED" });
      return response;
    }
    const txnId = randomUUID();
    const gatewayRef = `order_${txnId.slice(0, 8)}`;
    this.payments.push({
      txnId,
      invoiceId,
      studentId: actorId,
      gateway: "razorpay",
      gatewayRef,
      amountPaise: invoice.amountPaise,
      method: null,
      status: "CREATED",
      idempotencyKey,
      receiptNo: null,
      receiptHash: null,
      createdAt: new Date().toISOString(),
    });
    invoice.status = "PENDING";
    const response = { txnId, gatewayRef, amountPaise: invoice.amountPaise, reused: false };
    this.idempotency.set(idempotencyKey, { key: idempotencyKey, userId: actorId, scope: "checkout", requestHash: hash, response, status: "COMPLETED" });
    return response;
  }

  enqueueSettlement(payload: { txnId: string; gatewayRef: string; method: string }) {
    const jobId = `settle:${payload.gatewayRef}`;
    if (this.jobs.some((job) => job.id === jobId)) return { queued: false, jobId, duplicate: true };
    this.jobs.push({ id: jobId, name: "settle-payment", payload, status: "QUEUED" });
    return { queued: true, jobId, duplicate: false };
  }

  drainSettlements() {
    for (const job of this.jobs) {
      if (job.status !== "QUEUED" || job.name !== "settle-payment") continue;
      this.settle(job.payload as { txnId: string; gatewayRef: string; method: string });
      job.status = "COMPLETED";
    }
  }

  pushNotice(userId: string, title: string, body: string) {
    if (!this.users.some((row) => row.id === userId)) return;
    this.notices.unshift({
      id: randomUUID(),
      userId,
      title: title.slice(0, 120),
      body: body.slice(0, 400),
      createdAt: new Date().toISOString(),
    });
    this.notices = this.notices.slice(0, 200);
  }

  noticesFor(studentId: string) {
    const profile = this.profile(studentId);
    const department = this.departments.find((row) => row.id === profile?.departmentId);
    const fromCirculars = this.circulars
      .filter((row) => {
        if (row.targetRole && row.targetRole !== "STUDENT") return false;
        if (row.targetDepartment && row.targetDepartment !== department?.code) return false;
        if (row.targetYear && row.targetYear !== profile?.batchYear) return false;
        return true;
      })
      .map((row) => ({ id: row.id, title: row.title, body: row.content, createdAt: row.createdAt }));
    const pushed = this.notices
      .filter((row) => row.userId === studentId)
      .map((row) => ({ id: row.id, title: row.title, body: row.body, createdAt: row.createdAt }));
    return [...pushed, ...fromCirculars].slice(0, 12);
  }

  approvePass(passId: string, decision: string) {
    const pass = this.passes.find((row) => row.id === passId);
    if (!pass) return null;
    if (decision === "APPROVED") {
      pass.status = "APPROVED";
      pass.scanToken = pass.scanToken || randomBytes(4).toString("hex").toUpperCase();
    } else {
      pass.status = "REJECTED";
      pass.scanToken = null;
    }
    return pass;
  }

  scanPass(token: string) {
    const key = token.trim().toUpperCase();
    const pass = this.passes.find((row) => row.scanToken && row.scanToken === key);
    if (!pass) return { ok: false as const, status: 404, error: "No approved pass matches that gate code." };
    if (pass.status === "USED") return { ok: false as const, status: 409, error: "This pass was already scanned." };
    if (pass.status !== "APPROVED") return { ok: false as const, status: 409, error: "This pass is not approved." };
    pass.status = "USED";
    pass.scannedAt = new Date().toISOString();
    return { ok: true as const, pass };
  }

  settle(payload: { txnId: string; gatewayRef: string; method: string }) {
    const txn = this.payments.find((row) => row.txnId === payload.txnId || row.gatewayRef === payload.gatewayRef);
    if (!txn) return { ok: false, reason: "missing" };
    if (txn.status === "SETTLED") return { ok: true, duplicate: true, receiptNo: txn.receiptNo };
    txn.status = "SETTLED";
    txn.method = payload.method;
    txn.gatewayRef = payload.gatewayRef;
    txn.receiptNo = `HIT-${new Date().getFullYear()}-${txn.txnId.slice(0, 6).toUpperCase()}`;
    txn.receiptHash = receiptHash({
      txnId: txn.txnId,
      invoiceId: txn.invoiceId,
      amountPaise: txn.amountPaise,
      gatewayRef: payload.gatewayRef,
    });
    const invoice = this.invoices.find((row) => row.invoiceId === txn.invoiceId);
    if (invoice) invoice.status = "PAID";
    return { ok: true, duplicate: false, receiptNo: txn.receiptNo, receiptHash: txn.receiptHash };
  }
}

const globalStore = globalThis as unknown as { __helios?: CampusStore };

export function getStore() {
  if (!globalStore.__helios) globalStore.__helios = new CampusStore();
  return globalStore.__helios;
}
