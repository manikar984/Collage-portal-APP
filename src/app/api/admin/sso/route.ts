import { createHmac } from "crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/http";

export async function GET() {
  const { session, error } = await requireUser();
  if (!session) return error;
  if (session.role !== "ADMIN" && session.role !== "EXAM_CELL") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const exp = Math.floor(Date.now() / 1000) + 120;
  const payload = `${session.id}.${session.role}.${exp}`;
  const secret = process.env.CAMPUS_TOKEN_SECRET || "dev-only-replace-before-production";
  const mac = createHmac("sha256", secret).update(payload).digest("base64url");
  return NextResponse.json({
    redirect: `/legacy-sso?staff=${encodeURIComponent(session.identifier)}&exp=${exp}&sig=${mac}`,
    note: "Signed redirect into the old ERP. The password is not copied, and this preview does not leave the campus host.",
  });
}
