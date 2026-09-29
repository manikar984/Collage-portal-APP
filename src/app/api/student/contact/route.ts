import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function POST(request: Request) {
  const { session, error } = await requireUser();
  if (!session) return error;
  const body = await request.json().catch(() => ({}));
  const message = String(body.message || "").trim().slice(0, 500);
  if (message.length < 8) return NextResponse.json({ error: "Please write a short message." }, { status: 400 });
  const store = getStore();
  const row = {
    id: randomUUID(),
    userId: session.id,
    name: String(body.name || session.name).slice(0, 80),
    email: String(body.email || "").slice(0, 80),
    phone: String(body.phone || "").slice(0, 20),
    message,
    createdAt: new Date().toISOString(),
  };
  store.contacts.unshift(row);
  return NextResponse.json({ ok: true, reference: row.id.slice(0, 8).toUpperCase() });
}
