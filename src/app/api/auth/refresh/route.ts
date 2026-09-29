import { NextResponse } from "next/server";
import { refreshSession } from "@/lib/auth";

export async function POST() {
  const session = await refreshSession();
  if (!session) return NextResponse.json({ error: "Refresh token was rejected." }, { status: 401 });
  return NextResponse.json({ ok: true, role: session.role, name: session.name });
}
