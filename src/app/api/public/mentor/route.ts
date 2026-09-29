import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim().slice(0, 80);
  const email = String(body.email || "").trim().slice(0, 80);
  const interest = String(body.interest || "").trim().slice(0, 160);
  const alumniName = String(body.alumniName || "").trim().slice(0, 80);
  if (!name || !email || !interest) {
    return NextResponse.json({ error: "Name, email, and what you want to ask are required." }, { status: 400 });
  }
  const row = {
    id: randomUUID(),
    name,
    email,
    interest,
    alumniName,
    createdAt: new Date().toISOString(),
  };
  getStore().mentors.unshift(row);
  return NextResponse.json({ ok: true, id: row.id });
}
