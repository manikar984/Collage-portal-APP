import { NextResponse } from "next/server";
import { requireUser } from "@/lib/http";
import { queueDepth } from "@/lib/queue";
import { getStore } from "@/lib/store";

export async function GET() {
  const { session, error } = await requireUser();
  if (!session) return error;
  if (session.role !== "ADMIN" && session.role !== "EXAM_CELL") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const store = getStore();
  return NextResponse.json({
    leads: store.leads,
    mentors: store.mentors,
    jobs: store.jobs.slice(-12).reverse(),
    queueDepth: queueDepth(),
    unpaid: store.invoices.filter((row) => row.status !== "PAID").length,
    passes: store.passes,
  });
}
