import { createHash, randomBytes } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { ACCESS_TTL_SEC, REFRESH_TTL_SEC } from "./pure";
import type { Role } from "./seed";
import { getStore } from "./store";

const ACCESS = "hit_access";
const REFRESH = "hit_refresh";

function secret() {
  const value = process.env.CAMPUS_TOKEN_SECRET || "dev-only-replace-before-production";
  return new TextEncoder().encode(value);
}

export type Session = { id: string; role: Role; name: string; identifier: string };

export async function signAccess(session: Session) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.id)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SEC}s`)
    .sign(secret());
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function readSession(): Promise<Session | null> {
  const token = cookies().get(ACCESS)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      id: String(payload.sub),
      role: payload.role as Role,
      name: String(payload.name),
      identifier: String(payload.identifier),
    };
  } catch {
    return null;
  }
}

export function cookieBase() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export async function establishSession(user: { id: string; role: Role; fullName: string; rollNo: string | null; facultyId: string | null }) {
  const store = getStore();
  const identifier = user.rollNo || user.facultyId || user.id;
  const session: Session = { id: user.id, role: user.role, name: user.fullName, identifier };
  const access = await signAccess(session);
  const refresh = randomBytes(32).toString("base64url");
  store.saveRefresh({
    id: randomBytes(8).toString("hex"),
    userId: user.id,
    tokenHash: hashToken(refresh),
    familyId: randomBytes(8).toString("hex"),
    expiresAt: Date.now() + REFRESH_TTL_SEC * 1000,
    revokedAt: null,
    replacedBy: null,
  });
  cookies().set(ACCESS, access, { ...cookieBase(), maxAge: ACCESS_TTL_SEC });
  cookies().set(REFRESH, refresh, { ...cookieBase(), maxAge: REFRESH_TTL_SEC });
  return session;
}

export async function refreshSession() {
  const store = getStore();
  const current = cookies().get(REFRESH)?.value;
  if (!current) return null;
  const next = randomBytes(32).toString("base64url");
  const rotated = store.rotateRefresh(hashToken(current), hashToken(next), REFRESH_TTL_SEC * 1000);
  if (!rotated || rotated.reuse) {
    cookies().delete(ACCESS);
    cookies().delete(REFRESH);
    return null;
  }
  const user = store.users.find((row) => row.id === rotated.userId);
  if (!user) return null;
  const session: Session = {
    id: user.id,
    role: user.role,
    name: user.fullName,
    identifier: user.rollNo || user.facultyId || user.id,
  };
  cookies().set(ACCESS, await signAccess(session), { ...cookieBase(), maxAge: ACCESS_TTL_SEC });
  cookies().set(REFRESH, next, { ...cookieBase(), maxAge: REFRESH_TTL_SEC });
  return session;
}

export function clearSession() {
  cookies().delete(ACCESS);
  cookies().delete(REFRESH);
}
