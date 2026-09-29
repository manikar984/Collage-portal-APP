import { NextResponse } from "next/server";
import { readSession } from "./auth";
import { clientKey, limit } from "./ratelimit";

export async function requireUser() {
  const session = await readSession();
  if (!session) return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { session, error: null };
}

export function guardSpike(request: Request, userId?: string) {
  const result = limit(clientKey(request, userId));
  if (!result.ok) {
    return NextResponse.json(
      { error: "Too many requests. Results and downloads are limited to 60 per minute." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)) } },
    );
  }
  return null;
}

export function fail(error: unknown) {
  if (error instanceof Error) {
    const status = "status" in error ? Number((error as { status?: number }).status) : 0;
    if (error.name === "ForbiddenError" || status === 403) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.name === "ConflictError" || status === 409) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
  }
  console.error(error);
  return NextResponse.json({ error: "The campus service could not complete that request." }, { status: 500 });
}
