import { NextResponse } from "next/server";
import { fail, requireUser } from "@/lib/http";
import { academicYearFor, buildPortalRecord } from "@/lib/portal-data";
import { getStore } from "@/lib/store";

export async function GET(request: Request) {
  const { session, error } = await requireUser();
  if (!session) return error;
  const requested = new URL(request.url).searchParams.get("studentId") || session.id;
  const store = getStore();
  try {
    store.assertCanReadStudent(session, requested);
  } catch (err) {
    return fail(err);
  }
  const user = store.users.find((row) => row.id === requested);
  const profile = store.profile(requested);
  if (!user || !profile || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Student record not found." }, { status: 404 });
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
  const liveFees = store.invoicesFor(requested).map((invoice) => ({
    id: invoice.invoiceId,
    semester: profile.semester,
    academicYear: academicYearFor(profile.batchYear, profile.semester),
    type: invoice.type,
    description: invoice.description,
    amountPaise: invoice.amountPaise,
    status: invoice.status === "PAID" ? "Paid" as const : invoice.status === "PENDING" ? "Pending" as const : "Due" as const,
    paidOn: invoice.status === "PAID" ? store.payments.find((row) => row.invoiceId === invoice.invoiceId && row.status === "SETTLED")?.createdAt.slice(0, 10) || null : null,
    reference: store.payments.find((row) => row.invoiceId === invoice.invoiceId && row.status === "SETTLED")?.receiptNo || null,
    invoiceId: invoice.invoiceId,
    txnId: store.payments.find((row) => row.invoiceId === invoice.invoiceId && row.status === "SETTLED")?.txnId || null,
  }));
  const ticket = store.hallTickets.find((row) => row.studentId === requested);
  if (ticket) {
    const first = record.exams.find((row) => row.semester === profile.semester && row.examType === "MID1");
    if (first) {
      first.room = ticket.roomNo;
      first.date = ticket.examDate;
      first.time = `Report ${ticket.reportingTime}`;
    }
  }
  record.fees = [...liveFees, ...record.fees];
  record.notifications = [
    ...store.noticesFor(requested).map((row, index) => ({
      date: row.createdAt.slice(0, 10),
      number: `HIT/NTC/${String(index + 1).padStart(3, "0")}`,
      message: `${row.title}. ${row.body}`,
    })),
    ...record.notifications,
  ];
  return NextResponse.json(record);
}
