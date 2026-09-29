import { NextResponse } from "next/server";
import { establishSession } from "@/lib/auth";
import { DEMO_OTP } from "@/lib/ids";
import { getStore } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const identifier = String(body.identifier || "");
  const password = String(body.password || "");
  const store = getStore();
  const user = store.findByIdentifier(identifier);
  if (!user || !store.verifyPassword(user, password) || user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Roll number or password was not recognized." }, { status: 401 });
  }
  const session = await establishSession(user);
  return NextResponse.json({
    ok: true,
    role: session.role,
    name: session.name,
    demoOtp: process.env.DEMO_MODE === "false" ? undefined : DEMO_OTP,
  });
}
