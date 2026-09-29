import { NextResponse } from "next/server";
import { fail, requireUser } from "@/lib/http";
import { textPdf } from "@/lib/pdf";
import { buildPortalRecord, semesterSummary } from "@/lib/portal-data";
import { getStore } from "@/lib/store";

export async function GET(request: Request) {
  const { session, error } = await requireUser();
  if (!session) return error;
  const id = new URL(request.url).searchParams.get("id") || "";
  const store = getStore();
  const user = store.users.find((row) => row.id === session.id);
  const profile = store.profile(session.id);
  if (!user || !profile || session.role !== "STUDENT") {
    return NextResponse.json({ error: "Student record not found." }, { status: 404 });
  }
  try {
    store.assertCanReadStudent(session, session.id);
  } catch (err) {
    return fail(err);
  }
  const department = store.departments.find((row) => row.id === profile.departmentId);
  const record = buildPortalRecord({
    id: user.id,
    name: user.fullName,
    htno: user.rollNo || "",
    branch: department?.code || "",
    branchName: department?.name || "",
    semester: profile.semester,
    section: profile.section,
    regulation: profile.regulation,
    batchYear: profile.batchYear,
    dob: profile.dob,
    email: user.email,
    phone: user.phone,
    bloodGroup: profile.bloodGroup,
    guardianPhone: profile.guardianPhone,
    hostel: profile.hostelResident ? `${profile.hostelBlock}-${profile.roomNo}` : "Day scholar",
  });
  const lines = ["Helios Institute of Technology", "Student document. Demonstration copy.", `${record.student.name}   ${record.student.htno}   ${record.student.branch}`];
  if (id === "hall-ticket") {
    const ticket = store.hallTickets.find((row) => row.studentId === session.id);
    lines.push("Hall ticket", ticket ? `${ticket.examName}` : `Semester ${record.student.semester}`, ticket ? `${ticket.centerName}` : "Helios Academic Block", ticket ? `Room ${ticket.roomNo}  Bench ${ticket.benchCode}` : "Seat will be allotted by the exam cell", ticket ? `Date ${ticket.examDate}  Report ${ticket.reportingTime}` : "See the exam timetable", ticket?.rules || "Carry the college ID.");
  } else if (id === "timetable-current") {
    lines.push(`Exam time table, semester ${record.student.semester}`);
    record.exams.filter((row) => row.semester === record.student.semester && row.examType === "MID1").forEach((row) => {
      lines.push(`${row.date}  ${row.code}  ${row.title}  ${row.time}  ${row.room}`);
    });
  } else if (id.startsWith("memo-")) {
    const semester = Number(id.slice(5));
    const summary = semesterSummary(record, semester);
    lines.push(`Marks memo, semester ${semester}`, `SGPA ${summary.sgpa ?? "-"}  Credits earned ${summary.earned}`);
    record.marks.filter((row) => row.semester === semester && row.examType === "OVERALL" && row.kind === "REGULAR").forEach((row) => {
      lines.push(`${row.code}  ${row.title}  ${row.obtained ?? "-"}/${row.maxMarks}  ${row.grade || "-"}`);
    });
  } else if (id === "bonafide") {
    lines.push("Bonafide certificate", `This is to state that ${record.student.name}, HTNO ${record.student.htno}, is a student of ${record.student.course} ${record.student.branchName}, semester ${record.student.semester}.`);
  } else if (id === "conduct") {
    lines.push("Conduct certificate", "No adverse disciplinary entry is recorded in this demonstration file.");
  } else if (id === "regulations") {
    lines.push(`${record.student.regulation} academic regulations`, "160 credits are required. Attendance below 75 percent is a shortage.");
  } else if (id === "fee-structure") {
    lines.push("Fee heads", "Tuition, hostel, mess, examination, and library dues are listed in Online Fee Payments.");
  } else {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }
  const pdf = textPdf(lines);
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
