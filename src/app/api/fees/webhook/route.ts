import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { enqueuePaymentSettlement } from "@/lib/queue";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const gatewayRef = String(body.gatewayRef || "");
  const txnId = String(body.txnId || "");
  const amountPaise = Number(body.amountPaise || 0);
  const method = String(body.method || "UPI");
  const provided = request.headers.get("x-payment-signature") || String(body.signature || "");
  const secret = process.env.PAYMENT_WEBHOOK_SECRET || "dev-webhook-secret";
  const expected = createHmac("sha256", secret).update(`${gatewayRef}|${amountPaise}`).digest("hex");
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (!provided || a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Webhook signature rejected." }, { status: 401 });
  }
  const job = enqueuePaymentSettlement({ txnId, gatewayRef, method });
  return NextResponse.json({ accepted: true, ...job });
}
