import { NextResponse } from "next/server";
import { fail, requireUser } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function GET() {
  const { session, error } = await requireUser();
  if (!session) return error;
  const store = getStore();
  const user = store.users.find((row) => row.id === session.id);
  const profile = store.profile(session.id);
  const department = store.departments.find((row) => row.id === profile?.departmentId);
  return NextResponse.json({
    id: session.id,
    name: session.name,
    role: session.role,
    identifier: session.identifier,
    email: user?.email,
    phone: user?.phone,
    profile,
    department: department ? { code: department.code, name: department.name } : null,
  });
}

export async function PATCH(request: Request) {
  const { session, error } = await requireUser();
  if (!session) return error;
  const body = await request.json().catch(() => ({}));
  const phone = String(body.phone || "").trim().slice(0, 20);
  if (phone.length < 8) return NextResponse.json({ error: "Enter a reachable phone number." }, { status: 400 });
  const store = getStore();
  try {
    store.assertMfa(session.id, "profile");
    const user = store.users.find((row) => row.id === session.id);
    if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
    user.phone = phone;
    return NextResponse.json({ ok: true, phone });
  } catch (err) {
    return fail(err);
  }
}
