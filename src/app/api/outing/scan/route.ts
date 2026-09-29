import { NextResponse } from "next/server";
import { requireUser } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function POST(request: Request) {
  const { session, error } = await requireUser();
  if (!session) return error;
  if (session.role !== "WARDEN" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Only the gate desk can scan a pass." }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const result = getStore().scanPass(String(body.token || ""));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, status: result.pass.status, destination: result.pass.destination, scannedAt: result.pass.scannedAt });
}
