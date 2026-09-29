import { RATE_LIMIT_PER_MIN, takeToken, type Bucket } from "./pure";

const buckets = new Map<string, Bucket>();

/**
 * Token bucket, 60 requests/minute per IP or access token.
 * Production stores the bucket in Redis so every API instance shares the limit.
 * INCR + PEXPIRE is the wrong primitive here; a Lua token bucket keeps the refill honest.
 */
export function limit(key: string, now = Date.now()) {
  const current = buckets.get(key) ?? { tokens: RATE_LIMIT_PER_MIN, updatedAt: now };
  const next = takeToken(current, now);
  buckets.set(key, next.bucket);
  return next;
}

export function clientKey(request: Request, userId?: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || "local";
  return userId ? `user:${userId}` : `ip:${ip}`;
}
