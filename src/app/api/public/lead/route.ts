import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();
  const email = String(body.email || "").trim();
  const program = String(body.program || "").trim();
  if (!name || !phone || !email || !program) {
    return NextResponse.json({ error: "Name, phone, email, and program are required." }, { status: 400 });
  }
  const lead = {
    id: randomUUID(),
    name: name.slice(0, 80),
    phone: phone.slice(0, 20),
    email: email.slice(0, 80),
    program,
    rank: body.rank ? Number(body.rank) : null,
    message: String(body.message || "").slice(0, 400),
    createdAt: new Date().toISOString(),
  };
  getStore().leads.unshift(lead);
  return NextResponse.json({ ok: true, leadId: lead.id });
}
