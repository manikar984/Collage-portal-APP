import { NextResponse } from "next/server";
import { requireUser } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function GET() {
  const { session, error } = await requireUser();
  if (!session) return error;
  if (session.role !== "FACULTY" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ course: "CS401 Machine Learning", section: "B", roster: getStore().roster });
}

export async function POST(request: Request) {
  const { session, error } = await requireUser();
  if (!session) return error;
  if (session.role !== "FACULTY" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const marks = Array.isArray(body.marks) ? body.marks : [];
  const store = getStore();
  for (const mark of marks) {
    const row = store.roster.find((item) => item.studentId === mark.studentId);
    if (row) row.present = Boolean(mark.present);
  }
  const absent = store.roster.filter((row) => !row.present);
  for (const row of absent) {
    store.pushNotice(row.studentId, "Marked absent", `${row.name} was marked absent in CS401 section B.`);
  }
  return NextResponse.json({ saved: true, absentNotified: absent.map((row) => row.name) });
}
