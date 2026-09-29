import { NextResponse } from "next/server";
import { fail, requireUser } from "@/lib/http";
import { ForbiddenError, getStore } from "@/lib/store";

export async function GET() {
  const { session, error } = await requireUser();
  if (!session) return error;
  if (session.role !== "FACULTY" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ marks: getStore().cie });
}

export async function POST(request: Request) {
  const { session, error } = await requireUser();
  if (!session) return error;
  if (session.role !== "FACULTY" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  if (typeof body.csv === "string" && body.csv.trim()) {
    const store = getStore();
    const saved: { rollNo: string; marks: number }[] = [];
    const skipped: string[] = [];
    const lines = body.csv.trim().split(/\r?\n/).filter(Boolean);
    const start = /roll/i.test(lines[0]) ? 1 : 0;
    for (const line of lines.slice(start)) {
      const [rollNo, courseCodeRaw, marksRaw] = line.split(",").map((part: string) => part.trim());
      const courseCode = courseCodeRaw || "CS401";
      const marks = Number(marksRaw);
      const student = store.roster.find((row) => row.rollNo.toLowerCase() === String(rollNo || "").toLowerCase());
      if (!student || !Number.isInteger(marks) || marks < 0 || marks > 40) {
        skipped.push(line);
        continue;
      }
      const existing = store.cie.find((row) => row.studentId === student.studentId && row.courseCode === courseCode);
      if (existing) existing.marks = marks;
      else store.cie.push({ studentId: student.studentId, courseCode, marks });
      saved.push({ rollNo: student.rollNo, marks });
    }
    const average = saved.length ? Math.round((saved.reduce((sum, row) => sum + row.marks, 0) / saved.length) * 10) / 10 : 0;
    return NextResponse.json({ saved: saved.length, skipped: skipped.length, internalAverage: average, rows: saved });
  }
  const studentId = String(body.studentId || "");
  const courseCode = String(body.courseCode || "CS401");
  const marks = Number(body.marks);
  if (!studentId || !Number.isInteger(marks) || marks < 0 || marks > 40) {
    return NextResponse.json({ error: "CIE marks must be a whole number from 0 to 40." }, { status: 400 });
  }
  const store = getStore();
  const onRoster = store.roster.some((row) => row.studentId === studentId);
  if (!onRoster) return fail(new ForbiddenError("That student is not on this roster."));
  const existing = store.cie.find((row) => row.studentId === studentId && row.courseCode === courseCode);
  if (existing) existing.marks = marks;
  else store.cie.push({ studentId, courseCode, marks });
  return NextResponse.json({ saved: true, studentId, courseCode, marks });
}
