import { createHash, createHmac, timingSafeEqual } from "crypto";

export const ATTENDANCE_TARGET = 0.75;
export const QR_WINDOW_MS = 30_000;
export const ACCESS_TTL_SEC = 15 * 60;
export const REFRESH_TTL_SEC = 7 * 24 * 60 * 60;
export const RESULT_CACHE_TTL_SEC = 5 * 60;
export const RATE_LIMIT_PER_MIN = 60;

export type Grade = "O" | "A+" | "A" | "B+" | "B" | "C" | "P" | "F" | "AB";

const POINTS: Record<Grade, number> = {
  O: 10,
  "A+": 9,
  A: 8,
  "B+": 7,
  B: 6,
  C: 5,
  P: 4,
  F: 0,
  AB: 0,
};

export function gradePoints(grade: string | null): number | null {
  if (!grade) return null;
  return POINTS[grade as Grade] ?? null;
}

export function computeCgpa(rows: { credits: number; grade: string | null; status: string }[]) {
  let points = 0;
  let credits = 0;
  let earned = 0;
  for (const row of rows) {
    if (row.status !== "COMPLETED" || !row.grade) continue;
    const gp = gradePoints(row.grade);
    if (gp === null) continue;
    points += gp * row.credits;
    credits += row.credits;
    if (gp > 0) earned += row.credits;
  }
  return {
    cgpa: credits === 0 ? 0 : Math.round((points / credits) * 100) / 100,
    earnedCredits: earned,
  };
}

export function bunkForecast(attended: number, total: number) {
  if (total <= 0) {
    return { percent: 100, status: "SAFE" as const, canMiss: 0, mustAttend: 0 };
  }

  const percent = Math.round((attended / total) * 100);

  if (percent >= 75) {
    const canMiss = Math.max(0, Math.floor((attended - 0.75 * total) / 0.75));
    return { percent, status: "SAFE" as const, canMiss, mustAttend: 0 };
  }

  const mustAttend = Math.max(0, Math.ceil((0.75 * total - attended) / 0.25));
  return { percent, status: "SHORT" as const, canMiss: 0, mustAttend };
}

export function qrWindow(now = Date.now()) {
  return Math.floor(now / QR_WINDOW_MS);
}

export function rotatingPass(studentId: string, secret: string, now = Date.now()) {
  const window = qrWindow(now);
  const payload = `${studentId}.${window}`;
  const mac = createHmac("sha256", secret).update(payload).digest("base64url").slice(0, 16);
  const token = `${payload}.${mac}`;
  const expiresIn = QR_WINDOW_MS - (now % QR_WINDOW_MS);
  return { token, window, expiresInMs: expiresIn };
}

export function verifyRotatingPass(token: string, secret: string, now = Date.now()) {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [studentId, windowRaw, mac] = parts;
  const window = Number(windowRaw);
  if (!Number.isInteger(window)) return false;
  if (Math.abs(qrWindow(now) - window) > 1) return false;
  const expected = createHmac("sha256", secret)
    .update(`${studentId}.${window}`)
    .digest("base64url")
    .slice(0, 16);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function requestHash(body: unknown) {
  return createHash("sha256").update(JSON.stringify(body)).digest("hex");
}

export function receiptHash(input: {
  txnId: string;
  invoiceId: string;
  amountPaise: number;
  gatewayRef: string;
}) {
  return createHash("sha256")
    .update(`${input.txnId}|${input.invoiceId}|${input.amountPaise}|${input.gatewayRef}`)
    .digest("hex");
}

export type Bucket = { tokens: number; updatedAt: number };

export function takeToken(bucket: Bucket, now: number, capacity = RATE_LIMIT_PER_MIN, perMs = 60_000) {
  const elapsed = Math.max(0, now - bucket.updatedAt);
  const refilled = Math.min(capacity, bucket.tokens + (elapsed / perMs) * capacity);
  if (refilled < 1) {
    return { ok: false as const, bucket: { tokens: refilled, updatedAt: now }, retryAfterMs: Math.ceil(((1 - refilled) / capacity) * perMs) };
  }
  return { ok: true as const, bucket: { tokens: refilled - 1, updatedAt: now }, retryAfterMs: 0 };
}

export function inr(paise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);
}
