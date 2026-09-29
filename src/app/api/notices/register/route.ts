import { NextResponse } from "next/server";
import { requireUser } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function POST(request: Request) {
  const { session, error } = await requireUser();
  if (!session) return error;
  const body = await request.json().catch(() => ({}));
  const token = String(body.token || "").trim().slice(0, 180);
  if (token.length < 8) return NextResponse.json({ error: "Device token is too short." }, { status: 400 });
  const store = getStore();
  const existing = store.devices.find((row) => row.userId === session.id && row.token === token);
  if (!existing) {
    store.devices.push({
      userId: session.id,
      token,
      platform: String(body.platform || "web").slice(0, 20),
      createdAt: new Date().toISOString(),
    });
  }
  return NextResponse.json({
    ok: true,
    stored: true,
    note: "Token saved for the notification worker. This preview has no Firebase key and does not call FCM.",
  });
}
