import { createHmac } from "crypto";
import { NextResponse } from "next/server";
import { fail, requireUser } from "@/lib/http";
import { getStore } from "@/lib/store";

export async function POST(request: Request) {
  const { session, error } = await requireUser();
  if (!session) return error;
  if (session.role !== "STUDENT" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Only a student can start a fee payment." }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const invoiceId = String(body.invoiceId || "");
  const key = request.headers.get("idempotency-key") || String(body.idempotencyKey || "");
  if (!key) return NextResponse.json({ error: "Idempotency-Key is required." }, { status: 400 });
  const store = getStore();
  try {
    store.assertMfa(session.id, "payment");
    const studentId = session.role === "STUDENT" ? session.id : String(body.studentId || "");
    store.assertCanReadStudent(session, studentId);
    const order = store.beginCheckout(studentId, invoiceId, key);
    const secret = process.env.PAYMENT_WEBHOOK_SECRET || "dev-webhook-secret";
    const signature = createHmac("sha256", secret).update(`${order.gatewayRef}|${order.amountPaise}`).digest("hex");
    return NextResponse.json({ ...order, signature, gateway: "razorpay" });
  } catch (err) {
    return fail(err);
  }
}
