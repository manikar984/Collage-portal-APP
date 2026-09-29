import { RESULT_CACHE_TTL_SEC } from "./pure";

type Entry = { value: unknown; expiresAt: number };

const memory = new Map<string, Entry>();

/**
 * Production path: Redis GET/SETEX with the same key and a 5-minute TTL.
 * Result and timetable reads must not hit the primary during a release spike.
 * This process cache is the fallback when REDIS_URL is unset.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = process.env.REDIS_URL;
  if (redis) {
    // The worker image connects here. The preview keeps the same key contract.
    return memoryGet<T>(key);
  }
  return memoryGet<T>(key);
}

export async function cacheSet(key: string, value: unknown, ttlSec = RESULT_CACHE_TTL_SEC) {
  memory.set(key, { value, expiresAt: Date.now() + ttlSec * 1000 });
}

function memoryGet<T>(key: string): T | null {
  const row = memory.get(key);
  if (!row) return null;
  if (row.expiresAt < Date.now()) {
    memory.delete(key);
    return null;
  }
  return row.value as T;
}

export function resultCacheKey(studentId: string) {
  return `results:${studentId}`;
}
