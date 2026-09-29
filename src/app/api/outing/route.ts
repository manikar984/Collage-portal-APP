import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { fail, requireUser } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function GET() {
  const { session, error } = await requireUser();
  if (!session) return error;
  if (session.role !== "WARDEN" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ passes: getStore().passes });
}

export async function POST(request: Request) {
  const { session, error } = await requireUser();
  if (!session) return error;
  const body = await request.json().catch(() => ({}));
  const store = getStore();
  if (session.role === "WARDEN" || session.role === "ADMIN") {
    const pass = store.approvePass(String(body.passId || ""), body.decision === "APPROVED" ? "APPROVED" : "REJECTED");
    if (!pass) return NextResponse.json({ error: "Pass not found." }, { status: 404 });
    return NextResponse.json({ ok: true, pass });
  }
  if (session.role !== "STUDENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const profile = store.profile(session.id);
  if (!profile?.hostelResident) return NextResponse.json({ error: "Day scholars do not need a hostel gate pass." }, { status: 400 });
  try {
    const pass = {
      id: randomUUID(),
      studentId: session.id,
      reason: String(body.reason || "").slice(0, 180),
      leaveFrom: String(body.leaveFrom),
      leaveTo: String(body.leaveTo),
      destination: String(body.destination || "").slice(0, 80),
      status: "PENDING" as const,
    };
    if (!pass.reason || !pass.destination) return NextResponse.json({ error: "Reason and destination are required." }, { status: 400 });
    store.passes.unshift(pass);
    return NextResponse.json({ ok: true, pass });
  } catch (err) {
    return fail(err);
  }
}
