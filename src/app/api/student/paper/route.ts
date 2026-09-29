import { NextResponse } from "next/server";
import { fail, guardSpike, requireUser } from "@/lib/http";
import { textPdf } from "@/lib/pdf";
import { getStore } from "@/lib/store";

export async function GET(request: Request) {
  const { session, error } = await requireUser();
  if (!session) return error;
  const limited = guardSpike(request, session.id);
  if (limited) return limited;
  const id = new URL(request.url).searchParams.get("id") || "";
  const store = getStore();
  const paper = store.papers.find((row) => row.id === id);
  if (!paper) return NextResponse.json({ error: "Paper not found." }, { status: 404 });
  try {
    store.assertCanReadStudent(session, session.id);
    const profile = store.profile(session.id);
    const department = store.departments.find((row) => row.id === profile?.departmentId);
    const mine = store.courses.filter((row) => row.studentId === session.id).map((row) => row.courseCode);
    const allowed = mine.includes(paper.subjectCode) || department?.code === "CSE";
    if (session.role === "STUDENT" && !allowed) {
      return NextResponse.json({ error: "That paper is not on your course list." }, { status: 403 });
    }
  } catch (err) {
    return fail(err);
  }
  const count = store.paperDownloads.get(paper.id) || 0;
  store.paperDownloads.set(paper.id, count + 1);
  const pdf = textPdf([
    "Helios Institute of Technology",
    `${paper.subjectCode}  ${paper.title}`,
    `${paper.regulation}  ${paper.examType}  ${paper.year}  semester ${paper.semester}`,
    "Cover sheet for the vault reader.",
    "The scanned paper is an object in storage, not a database blob.",
    `Object key ${paper.fileKey}`,
    "A production reader opens a short-lived presigned URL.",
    "This preview does not invent the question text.",
    `Downloads recorded in this process: ${count + 1}`,
  ]);
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${paper.subjectCode}-${paper.year}.pdf"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
