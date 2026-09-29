import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function POST(request: Request) {
  const { session, error } = await requireUser();
  if (!session) return error;
  if (session.role !== "FACULTY" && session.role !== "ADMIN" && session.role !== "EXAM_CELL") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const title = String(body.title || "").trim().slice(0, 120);
  const content = String(body.content || "").trim().slice(0, 800);
  if (!title || !content) {
    return NextResponse.json({ error: "A circular needs a title and a body." }, { status: 400 });
  }
  const circular = {
    id: randomUUID(),
    title,
    content,
    category: String(body.category || "Academic").slice(0, 40),
    targetDepartment: body.department ? String(body.department) : "CSE",
    targetYear: body.year ? Number(body.year) : 2021,
    targetRole: "STUDENT",
    createdAt: new Date().toISOString(),
  };
  getStore().circulars.unshift(circular);
  return NextResponse.json({ ok: true, id: circular.id });
}
