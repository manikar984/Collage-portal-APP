import { NextResponse } from "next/server";
import { fail, requireUser } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function GET(request: Request) {
  const { session, error } = await requireUser();
  if (!session) return error;
  const url = new URL(request.url);
  const requested = url.searchParams.get("studentId") || session.id;
  const store = getStore();
  try {
    store.assertCanReadStudent(session, requested);
    return NextResponse.json(store.academics(requested));
  } catch (err) {
    return fail(err);
  }
}
