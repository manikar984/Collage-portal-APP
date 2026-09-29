import { NextResponse } from "next/server";
import { cacheGet, cacheSet, resultCacheKey } from "@/lib/cache";
import { fail, guardSpike, requireUser } from "@/lib/http";
import { RESULT_CACHE_TTL_SEC } from "@/lib/pure";
import { getStore } from "@/lib/store";

export async function GET(request: Request) {
  const { session, error } = await requireUser();
  if (!session) return error;
  const limited = guardSpike(request, session.id);
  if (limited) return limited;
  const requested = new URL(request.url).searchParams.get("studentId") || session.id;
  const store = getStore();
  try {
    store.assertCanReadStudent(session, requested);
    const key = resultCacheKey(requested);
    const cached = await cacheGet<unknown>(key);
    if (cached) return NextResponse.json({ ...cached as object, cache: "HIT", ttlSec: RESULT_CACHE_TTL_SEC });
    const payload = { ...store.academics(requested), cache: "MISS", ttlSec: RESULT_CACHE_TTL_SEC };
    await cacheSet(key, payload);
    return NextResponse.json(payload);
  } catch (err) {
    return fail(err);
  }
}
