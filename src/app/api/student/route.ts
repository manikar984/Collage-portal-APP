import { createHmac } from "crypto";
import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { fail, guardSpike, requireUser } from "@/lib/http";
import { bunkForecast, rotatingPass } from "@/lib/pure";
import { getStore } from "@/lib/store";

function secret() {
  return process.env.CAMPUS_TOKEN_SECRET || "dev-only-replace-before-production";
}

export async function GET(request: Request) {
  const { session, error } = await requireUser();
  if (!session) return error;
  const limited = guardSpike(request, session.id);
  if (limited) return limited;
  const view = new URL(request.url).searchParams.get("view") || "home";
  const requested = new URL(request.url).searchParams.get("studentId") || session.id;
  const store = getStore();
  try {
    store.assertCanReadStudent(session, requested);
    if (view === "id") {
      const user = store.users.find((row) => row.id === requested);
      const profile = store.profile(requested);
      const department = store.departments.find((row) => row.id === profile?.departmentId);
      const pass = rotatingPass(requested, secret());
      const svg = await QRCode.toString(pass.token, { type: "svg", margin: 1, color: { dark: "#17211c", light: "#fffaf3" } });
      return NextResponse.json({
        name: user?.fullName,
        rollNo: user?.rollNo,
        department: department?.code,
        semester: profile?.semester,
        section: profile?.section,
        hostel: profile?.hostelResident ? `${profile.hostelBlock}-${profile.roomNo}` : "Day scholar",
        bloodGroup: profile?.bloodGroup,
        token: pass.token,
        expiresInMs: pass.expiresInMs,
        svg,
      });
    }
    if (view === "attendance") {
      const rows = store.attendance
        .filter((row) => row.studentId === requested)
        .map((row) => ({ ...row, forecast: bunkForecast(row.attended, row.held) }));
      return NextResponse.json({ rows });
    }
    if (view === "hallticket") {
      return NextResponse.json({ tickets: store.hallTickets.filter((row) => row.studentId === requested) });
    }
    if (view === "pyq") {
      const profile = store.profile(requested);
      const department = store.departments.find((row) => row.id === profile?.departmentId);
      const mine = store.courses.filter((row) => row.studentId === requested).map((row) => row.courseCode);
      const papers = store.papers.filter((row) => mine.includes(row.subjectCode) || department?.code === "CSE");
      const exp = Math.floor(Date.now() / 1000) + 300;
      return NextResponse.json({
        papers: papers.map((paper) => {
          const sig = createHmac("sha256", secret()).update(`${paper.fileKey}.${exp}`).digest("hex").slice(0, 24);
          return {
            ...paper,
            presignedUrl: `https://cdn.helios.edu/${paper.fileKey}?exp=${exp}&sig=${sig}`,
            expiresInSec: 300,
          };
        }),
      });
    }
    if (view === "scholarships") {
      return NextResponse.json({
        scholarships: store.scholarships,
        applications: store.applications.filter((row) => row.studentId === requested),
      });
    }
    if (view === "circulars") {
      const profile = store.profile(requested);
      const department = store.departments.find((row) => row.id === profile?.departmentId);
      const rows = store.circulars.filter((row) => {
        if (row.targetRole && row.targetRole !== session.role && session.role === "STUDENT") return false;
        if (row.targetDepartment && row.targetDepartment !== department?.code) return false;
        if (row.targetYear && row.targetYear !== profile?.batchYear) return false;
        return true;
      });
      return NextResponse.json({ circulars: rows });
    }
    if (view === "outing") {
      const passes = await Promise.all(
        store.passes
          .filter((row) => row.studentId === requested)
          .map(async (pass) => {
            if (!pass.scanToken) return pass;
            const svg = await QRCode.toString(pass.scanToken, { type: "svg", margin: 1, color: { dark: "#17211c", light: "#fffaf3" } });
            return { ...pass, svg };
          }),
      );
      return NextResponse.json({ passes });
    }
    const academics = store.academics(requested);
    const invoices = store.invoicesFor(requested);
    const due = invoices.filter((row) => row.status !== "PAID").reduce((sum, row) => sum + row.amountPaise, 0);
    return NextResponse.json({
      academics,
      duePaise: due,
      unpaid: invoices.filter((row) => row.status !== "PAID").length,
      notices: store.noticesFor(requested),
    });
  } catch (err) {
    return fail(err);
  }
}
