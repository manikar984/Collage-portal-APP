import { NextResponse } from "next/server";
import { requireUser } from "@/lib/http";
import { DEMO_OTP } from "@/lib/ids";
import { getStore } from "@/lib/store";

export async function POST(request: Request) {
  const { session, error } = await requireUser();
  if (!session) return error;
  const body = await request.json().catch(() => ({}));
  const purpose = String(body.purpose || "payment");
  const code = String(body.code || "");
  const store = getStore();
  if (!code) {
    store.issueOtp(session.id, purpose, DEMO_OTP);
    return NextResponse.json({
      ok: true,
      sent: true,
      demoOtp: process.env.DEMO_MODE === "false" ? undefined : DEMO_OTP,
    });
  }
  const ok = store.consumeOtp(session.id, purpose, code);
  if (!ok) return NextResponse.json({ error: "That OTP is not valid." }, { status: 401 });
  return NextResponse.json({ ok: true, granted: purpose });
}
