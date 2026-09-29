import { NextResponse } from "next/server";
import { fail, requireUser } from "@/lib/http";
import { rupees, textPdf } from "@/lib/pdf";
import { getStore } from "@/lib/store";

export async function GET(request: Request) {
  const { session, error } = await requireUser();
  if (!session) return error;
  const txnId = new URL(request.url).searchParams.get("txnId") || "";
  const store = getStore();
  store.drainSettlements();
  const payment = store.payments.find((row) => row.txnId === txnId);
  if (!payment || payment.status !== "SETTLED" || !payment.receiptNo) {
    return NextResponse.json({ error: "That receipt is not ready." }, { status: 404 });
  }
  try {
    store.assertCanReadStudent(session, payment.studentId);
  } catch (err) {
    return fail(err);
  }
  const invoice = store.invoices.find((row) => row.invoiceId === payment.invoiceId);
  const student = store.users.find((row) => row.id === payment.studentId);
  const pdf = textPdf([
    "Helios Institute of Technology",
    "Demonstration receipt. Not a tax invoice filed with any authority.",
    "GSTIN 36DEMO0000H1Z5 (fictional)  SAC 9992  Place of supply: Telangana",
    `Receipt ${payment.receiptNo}`,
    `Student ${student?.fullName || ""}  ${student?.rollNo || ""}`,
    `Invoice ${invoice?.description || payment.invoiceId}`,
    `Taxable value Rs ${rupees(payment.amountPaise)}`,
    "CGST 0.00   SGST 0.00   Education fee shown as exempt in this demo",
    `Total Rs ${rupees(payment.amountPaise)}   Method ${payment.method || "UPI"}`,
    `Gateway ${payment.gatewayRef || ""}`,
    `Verification ${payment.receiptHash || ""}`,
  ]);
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${payment.receiptNo}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
