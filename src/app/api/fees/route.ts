import { NextResponse } from "next/server";
import { fail, requireUser } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function GET(request: Request) {
  const { session, error } = await requireUser();
  if (!session) return error;
  const requested = new URL(request.url).searchParams.get("studentId") || session.id;
  const store = getStore();
  store.drainSettlements();
  try {
    store.assertCanReadStudent(session, requested);
    const invoices = store.invoicesFor(requested);
    const payments = store.payments.filter((row) => row.studentId === requested);
    return NextResponse.json({ invoices, payments });
  } catch (err) {
    return fail(err);
  }
}
