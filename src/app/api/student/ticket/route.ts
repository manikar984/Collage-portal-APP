import { NextResponse } from "next/server";
import { fail, guardSpike, requireUser } from "@/lib/http";
import { textPdf } from "@/lib/pdf";
import { getStore } from "@/lib/store";

export async function GET(request: Request) {
  const { session, error } = await requireUser();
  if (!session) return error;
  const limited = guardSpike(request, session.id);
  if (limited) return limited;
  const requested = new URL(request.url).searchParams.get("studentId") || session.id;
  const store = getStore();
  try {
    store.assertCanReadStudent(session, requested);
  } catch (err) {
    return fail(err);
  }
  const ticket = store.hallTickets.find((row) => row.studentId === requested);
  const student = store.users.find((row) => row.id === requested);
  if (!ticket) return NextResponse.json({ error: "No hall ticket has been issued." }, { status: 404 });
  const pdf = textPdf([
    "Helios Institute of Technology",
    "Digital hall ticket",
    `${student?.fullName || ""}  ${student?.rollNo || ""}`,
    ticket.examName,
    ticket.centerName,
    `Room ${ticket.roomNo}   Bench ${ticket.benchCode}`,
    `Date ${ticket.examDate}   Report by ${ticket.reportingTime}`,
    ticket.rules,
    `Barcode ${ticket.barcodePayload}`,
  ]);
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="hall-ticket-${student?.rollNo || "student"}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
