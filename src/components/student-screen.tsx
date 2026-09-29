"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StudentChrome } from "./chrome";
import { inr } from "@/lib/pure";

type View = "home" | "academics" | "fees" | "profile" | "id" | "exams" | "attendance" | "pyq" | "scholarships" | "circulars" | "outing";

const paths: Record<View, string> = {
  home: "/portal",
  academics: "/portal/academics",
  fees: "/portal/fees",
  profile: "/portal/profile",
  id: "/portal/id",
  exams: "/portal/exams",
  attendance: "/portal/attendance",
  pyq: "/portal/pyq",
  scholarships: "/portal/scholarships",
  circulars: "/portal/circulars",
  outing: "/portal/outing",
};

async function read(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

export function StudentScreen({ view }: { view: View }) {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [otp, setOtp] = useState("482913");
  const [order, setOrder] = useState<any>(null);
  const [isolation, setIsolation] = useState("");
  const [passForm, setPassForm] = useState({ reason: "Home visit", destination: "Hyderabad", leaveFrom: "2026-10-08T09:00", leaveTo: "2026-10-09T18:00" });

  useEffect(() => {
    let stop = false;
    async function load() {
      const who = await read("/api/me");
      if (who.status === 401) {
        router.push("/login");
        return;
      }
      if (!stop) setMe(who.data);
      if (who.data?.role && who.data.role !== "STUDENT") {
        router.push(who.data.role === "FACULTY" || who.data.role === "WARDEN" ? "/faculty" : "/admin");
        return;
      }
      const endpoint = view === "academics"
        ? "/api/academics"
        : view === "fees"
          ? "/api/fees"
          : view === "exams"
            ? "/api/student?view=hallticket"
            : `/api/student?view=${view === "home" ? "home" : view}`;
      const next = await read(endpoint);
      if (!stop) setData(next.data);
    }
    load();
    return () => { stop = true; };
  }, [router, view]);

  useEffect(() => {
    if (view !== "id") return;
    const timer = setInterval(async () => {
      const next = await read("/api/student?view=id");
      setData(next.data);
    }, 1000);
    return () => clearInterval(timer);
  }, [view]);

  async function pay(invoiceId: string) {
    setBusy(true);
    setError("");
    await fetch("/api/auth/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ purpose: "payment" }) });
    const verified = await fetch("/api/auth/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ purpose: "payment", code: otp }) });
    if (!verified.ok) {
      const denied = await verified.json();
      setError(denied.error || "That OTP was not accepted.");
      setBusy(false);
      return;
    }
    const key = `pay-${invoiceId}`;
    const checkout = await fetch("/api/fees/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": key },
      body: JSON.stringify({ invoiceId, idempotencyKey: key }),
    });
    const orderData = await checkout.json();
    if (!checkout.ok) {
      setError(orderData.error || "Payment could not start");
      setBusy(false);
      return;
    }
    setOrder(orderData);
    const settled = await fetch("/api/fees/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-payment-signature": orderData.signature },
      body: JSON.stringify({ ...orderData, method: "UPI" }),
    });
    const job = await settled.json();
    if (!settled.ok) setError(job.error || "The gateway rejected the webhook");
    const refreshed = await read("/api/fees");
    setData(refreshed.data);
    setBusy(false);
  }

  async function tryOtherStudent() {
    const response = await read("/api/fees?studentId=22222222-2222-4222-8222-222222222222");
    setIsolation(response.ok ? "Unexpectedly allowed." : `${response.status} ${response.data.error}`);
  }

  async function applyPass() {
    setBusy(true);
    const response = await fetch("/api/outing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(passForm),
    });
    const body = await response.json();
    if (!response.ok) setError(body.error || "Could not file the pass");
    const next = await read("/api/student?view=outing");
    setData(next.data);
    setBusy(false);
  }

  if (!me || !data) {
    return (
      <StudentChrome active={paths[view]}>
        <div className="grid gap-3">
          <div className="skeleton h-10 w-48" />
          <div className="skeleton h-40" />
          <div className="skeleton h-28" />
        </div>
      </StudentChrome>
    );
  }

  return (
    <StudentChrome active={paths[view]}>
      {view === "home" && <Home me={me} data={data} />}
      {view === "academics" && <Academics data={data} />}
      {view === "fees" && (
        <Fees data={data} busy={busy} otp={otp} setOtp={setOtp} order={order} error={error} onPay={pay} />
      )}
      {view === "profile" && <Profile me={me} isolation={isolation} onProbe={tryOtherStudent} />}
      {view === "id" && <Identity data={data} />}
      {view === "exams" && <Exams data={data} />}
      {view === "attendance" && <Attendance data={data} />}
      {view === "pyq" && <Papers data={data} />}
      {view === "scholarships" && <Scholarships data={data} />}
      {view === "circulars" && <Circulars data={data} />}
      {view === "outing" && (
        <Outing data={data} form={passForm} setForm={setPassForm} busy={busy} error={error} onSubmit={applyPass} />
      )}
    </StudentChrome>
  );
}

function Home({ me, data }: { me: any; data: any }) {
  const [live, setLive] = useState<any[] | null>(null);
  const earned = data.academics?.earnedCredits ?? 0;
  const required = data.academics?.requiredCredits ?? 160;
  const notices = live || data.notices || [];
  useEffect(() => {
    const source = new EventSource("/api/notices/stream");
    source.onmessage = (event) => {
      try {
        setLive(JSON.parse(event.data).notices || []);
      } catch {
        setLive(null);
      }
    };
    return () => source.close();
  }, []);
  return (
    <section>
      <p className="kicker">{me.department?.code} · semester {me.profile?.semester}{me.profile?.section}</p>
      <h1 className="display mt-2 text-4xl md:text-6xl">Good day, {me.name.split(" ")[0]}.</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="card p-5 md:col-span-2">
          <p className="kicker">Credits toward graduation</p>
          <p className="display mt-2 text-5xl">{earned}<span className="text-2xl text-[var(--ink-soft)]"> / {required}</span></p>
          <div className="progress mt-4"><span style={{ width: `${Math.min(100, (earned / required) * 100)}%` }} /></div>
          <p className="mt-3 text-sm text-[var(--ink-soft)]">{data.academics?.remainingCredits} credits still required. CGPA {data.academics?.cgpa}.</p>
        </article>
        <article className="card p-5">
          <p className="kicker">Due now</p>
          <p className="display mt-2 text-4xl">{inr(data.duePaise || 0)}</p>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">{data.unpaid} open invoice{data.unpaid === 1 ? "" : "s"}.</p>
          <a className="btn mt-4 inline-block" href="/portal/fees">Pay fees</a>
        </article>
      </div>
      {notices.length > 0 && (
        <div className="mt-4 grid gap-2">
          {notices.slice(0, 3).map((row: any) => (
            <article key={row.id} className="card px-4 py-3">
              <p className="kicker">Notice</p>
              <h2 className="text-lg">{row.title}</h2>
              <p className="text-sm text-[var(--ink-soft)]">{row.body}</p>
            </article>
          ))}
        </div>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["/portal/id", "Digital ID", "QR rotates every 30 seconds"],
          ["/portal/exams", "Hall ticket", "Bench, room, and rules"],
          ["/portal/attendance", "Bunk margin", "75% is the line"],
          ["/portal/outing", "Gate pass", "Warden approval, then the gate"],
        ].map(([href, title, copy]) => (
          <a key={href} href={href} className="card p-4">
            <h2 className="text-lg">{title}</h2>
            <p className="text-sm text-[var(--ink-soft)]">{copy}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function Academics({ data }: { data: any }) {
  const groups = ["COMPLETED", "BACKLOG", "ENROLLED"] as const;
  return (
    <section>
      <p className="kicker">Academics</p>
      <h1 className="display text-4xl">What is done, and what is left.</h1>
      <div className="progress mt-4"><span style={{ width: `${Math.min(100, (data.earnedCredits / data.requiredCredits) * 100)}%` }} /></div>
      <p className="mt-2 text-sm text-[var(--ink-soft)]">{data.earnedCredits} earned · {data.remainingCredits} remaining · CGPA {data.cgpa}</p>
      {groups.map((status) => (
        <details key={status} open className="card mt-4 p-4">
          <summary className="cursor-pointer text-lg">{status === "COMPLETED" ? "Passed" : status === "BACKLOG" ? "Backlogs" : "This semester"}</summary>
          <div className="mt-3 grid gap-2">
            {data.rows.filter((row: any) => row.status === status).map((row: any) => (
              <div key={row.courseCode} className="flex items-center justify-between rounded-2xl bg-[var(--paper)] px-3 py-2">
                <div>
                  <strong>{row.courseCode}</strong> {row.title}
                  <div className="text-xs text-[var(--ink-soft)]">{row.credits} credits {row.elective ? "· elective" : ""}</div>
                </div>
                <span className="chip">{row.grade || "In progress"}</span>
              </div>
            ))}
          </div>
        </details>
      ))}
    </section>
  );
}

function Fees({ data, busy, otp, setOtp, order, error, onPay }: any) {
  return (
    <section>
      <p className="kicker">Fees</p>
      <h1 className="display text-4xl">Pay once. A second tap does not create a second order.</h1>
      <label className="mt-4 block max-w-xs text-sm">Payment OTP
        <input className="field mt-1" value={otp} onChange={(e) => setOtp(e.target.value)} />
      </label>
      <p className="mt-1 text-xs text-[var(--ink-soft)]">Demo OTP is 482913. A real deployment sends this by SMS and does not print it here.</p>
      {error && <p className="mt-2 text-sm text-[var(--clay)]">{error}</p>}
      <div className="mt-4 grid gap-3">
        {data.invoices?.map((invoice: any) => (
          <article key={invoice.invoiceId} className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="kicker">{invoice.type}</p>
              <h2 className="text-xl">{invoice.description}</h2>
              <p className="text-sm text-[var(--ink-soft)]">Due {invoice.dueDate}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl">{inr(invoice.amountPaise)}</div>
              <span className="chip">{invoice.status}</span>
              {invoice.status !== "PAID" && (
                <button className="btn mt-2" disabled={busy} onClick={() => onPay(invoice.invoiceId)}>Pay with UPI</button>
              )}
            </div>
          </article>
        ))}
      </div>
      {order && <p className="mt-4 text-sm">Gateway order {order.gatewayRef}. Settlement is queued, not written in the request that created it.</p>}
      <div className="mt-6">
        <p className="kicker">Receipts</p>
        {data.payments?.filter((row: any) => row.status === "SETTLED").map((row: any) => (
          <article key={row.txnId} className="card mt-3 p-4">
            <strong>{row.receiptNo}</strong>
            <p className="text-sm">{inr(row.amountPaise)} · {row.method} · {row.gatewayRef}</p>
            <p className="mt-1 break-all text-xs text-[var(--ink-soft)]">Verification hash {row.receiptHash}</p>
            <a className="btn secondary mt-3 inline-block" href={`/api/fees/receipt?txnId=${row.txnId}`}>Download receipt</a>
          </article>
        ))}
      </div>
    </section>
  );
}

function Profile({ me, isolation, onProbe }: any) {
  const [phone, setPhone] = useState(me.phone || "");
  const [code, setCode] = useState("482913");
  const [msg, setMsg] = useState("");

  async function savePhone() {
    setMsg("");
    await fetch("/api/auth/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ purpose: "profile" }) });
    const verified = await fetch("/api/auth/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ purpose: "profile", code }) });
    if (!verified.ok) {
      setMsg("That OTP was not accepted.");
      return;
    }
    const response = await fetch("/api/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
    const body = await response.json();
    setMsg(response.ok ? `Phone updated to ${body.phone}` : body.error);
  }

  return (
    <section>
      <p className="kicker">Profile</p>
      <h1 className="display text-4xl">{me.name}</h1>
      <div className="card mt-4 grid gap-2 p-5 text-sm">
        <p>Roll {me.identifier}</p>
        <p>{me.email}</p>
        <p>{me.phone}</p>
        <p>{me.department?.name}</p>
        <p>{me.profile?.hostelResident ? `Hostel ${me.profile.hostelBlock}-${me.profile.roomNo}` : "Day scholar"}</p>
        <p>Blood group {me.profile?.bloodGroup}. Guardian {me.profile?.guardianPhone}.</p>
      </div>
      <div className="card mt-4 grid max-w-md gap-3 p-5">
        <p className="kicker">Change phone</p>
        <input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input className="field" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Profile OTP" />
        <button className="btn secondary" onClick={savePhone}>Save with OTP</button>
        {msg && <p className="text-sm">{msg}</p>}
      </div>
      <div className="card mt-4 p-5">
        <p className="kicker">Isolation check</p>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">This session belongs to you. Asking for Rohan Iyer&apos;s fee ledger must fail.</p>
        <button className="btn secondary mt-3" onClick={onProbe}>Try another student&apos;s fees</button>
        {isolation && <p className="mt-3 text-sm">{isolation}</p>}
      </div>
      <div className="card mt-4 p-5">
        <p className="kicker">Device unlock</p>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">On a phone this step uses the device keystore for Face ID or fingerprint after the password login. This browser preview has no biometric hardware, so it does not pretend the scan succeeded.</p>
      </div>
      <button className="btn secondary mt-4" onClick={async () => {
        const token = `web-${me.identifier}-${Date.now()}`;
        const response = await fetch("/api/notices/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, platform: "web" }) });
        const body = await response.json();
        setMsg(body.note || body.error);
      }}>Register this browser for notices</button>
      <button className="btn mt-4" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); location.href = "/login"; }}>Log out</button>
    </section>
  );
}

function Identity({ data }: { data: any }) {
  const seconds = Math.ceil((data.expiresInMs || 0) / 1000);
  return (
    <section>
      <p className="kicker">Digital ID</p>
      <h1 className="display text-4xl">A screenshot expires.</h1>
      <div className="id-card mt-4 max-w-md">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#e7d7b0]">Helios student</p>
            <h2 className="display mt-2 text-4xl">{data.name}</h2>
            <p className="mt-2">{data.rollNo} · {data.department}-{data.section}</p>
            <p className="text-sm text-[#e7d7b0]">Semester {data.semester} · {data.hostel} · {data.bloodGroup}</p>
          </div>
          <span className="rounded-2xl bg-[#f6f1e6] px-3 py-2 text-sm text-[var(--ink)]">{seconds}s</span>
        </div>
      </div>
      <div className="card mt-4 max-w-md p-4">
        <div dangerouslySetInnerHTML={{ __html: data.svg || "" }} />
        <p className="mt-2 break-all text-xs text-[var(--ink-soft)]">{data.token}</p>
      </div>
    </section>
  );
}

function Exams({ data }: { data: any }) {
  const ticket = data.tickets?.[0];
  if (!ticket) return <p>No hall ticket has been issued.</p>;
  return (
    <section>
      <p className="kicker">Exam center</p>
      <h1 className="display text-4xl">{ticket.examName}</h1>
      <article className="card mt-4 max-w-xl p-5">
        <p>{ticket.centerName}</p>
        <p className="mt-2 text-2xl">Room {ticket.roomNo} · Bench {ticket.benchCode}</p>
        <p className="mt-2">Report by {ticket.reportingTime} on {ticket.examDate}</p>
        <p className="mt-3 text-sm text-[var(--ink-soft)]">{ticket.rules}</p>
        <p className="mt-3 font-mono text-sm">{ticket.barcodePayload}</p>
        <a className="btn mt-4 inline-block" href="/api/student/ticket">Download hall ticket</a>
      </article>
    </section>
  );
}

function Attendance({ data }: { data: any }) {
  return (
    <section>
      <p className="kicker">Attendance</p>
      <h1 className="display text-4xl">The 75% line, counted, not guessed.</h1>
      <div className="mt-4 grid gap-3">
        {data.rows?.map((row: any) => (
          <article key={row.courseCode} className="card p-4">
            <div className="flex items-center justify-between">
              <h2>{row.title}</h2>
              <span className="chip">{row.forecast.status === "SAFE" ? "Safe" : "Short"}</span>
            </div>
            <p className="mt-2 text-3xl">{row.forecast.percent}%</p>
            <p className="text-sm text-[var(--ink-soft)]">{row.attended} of {row.held} held.</p>
            <p className="mt-2 text-sm">
              {row.forecast.status === "SAFE"
                ? `You can miss ${row.forecast.canMiss} more class${row.forecast.canMiss === 1 ? "" : "es"} and stay at 75%.`
                : `You must attend the next ${row.forecast.mustAttend} classes to reach 75%.`}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Papers({ data }: { data: any }) {
  const [reader, setReader] = useState("");
  const [saved, setSaved] = useState("");

  async function openReader(id: string) {
    const response = await fetch(`/api/student/paper?id=${id}`);
    if (!response.ok) return;
    const blob = await response.blob();
    setReader(URL.createObjectURL(blob));
  }

  async function saveOffline(id: string, title: string) {
    const response = await fetch(`/api/student/paper?id=${id}`);
    if (!response.ok || !("caches" in window)) return;
    const cache = await caches.open("helios-pyq");
    await cache.put(`/pyq/${id}`, response);
    setSaved(title);
  }

  return (
    <section>
      <p className="kicker">PYQ vault</p>
      <h1 className="display text-4xl">Papers from the store, not a shared drive.</h1>
      {reader && (
        <iframe title="Question paper" src={reader} className="mt-4 h-[480px] w-full rounded-[22px] border border-[var(--line)] bg-white" />
      )}
      {saved && <p className="mt-3 text-sm">Saved on this device: {saved}</p>}
      <div className="mt-4 grid gap-3">
        {data.papers?.map((paper: any) => (
          <article key={paper.id} className="card p-4">
            <p className="kicker">{paper.regulation} · {paper.examType} · {paper.year}</p>
            <h2 className="text-xl">{paper.subjectCode} {paper.title}</h2>
            <p className="mt-2 break-all text-xs text-[var(--ink-soft)]">{paper.presignedUrl}</p>
            <p className="text-sm text-[var(--ink-soft)]">Object key {paper.fileKey}. The link expires in {paper.expiresInSec} seconds and is not a public file.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn" onClick={() => openReader(paper.id)}>Open reader</button>
              <button className="btn secondary" onClick={() => saveOffline(paper.id, paper.title)}>Save offline</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Scholarships({ data }: { data: any }) {
  return (
    <section>
      <p className="kicker">Scholarships</p>
      <h1 className="display text-4xl">Submitted, verified, then disbursed.</h1>
      <div className="mt-4 grid gap-3">
        {data.scholarships?.map((item: any) => {
          const application = data.applications?.find((row: any) => row.scholarshipId === item.id);
          return (
            <article key={item.id} className="card p-4">
              <p className="kicker">{item.provider}</p>
              <h2 className="text-xl">{item.name}</h2>
              <p className="text-sm text-[var(--ink-soft)]">{item.description}</p>
              <div className="mt-2 flex flex-wrap gap-2">{item.checklist.map((step: string) => <span key={step} className="chip">{step}</span>)}</div>
              <p className="mt-3">Status: {application?.status || "Not started"}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Circulars({ data }: { data: any }) {
  return (
    <section>
      <p className="kicker">Circulars</p>
      <h1 className="display text-4xl">Only the notices meant for your batch.</h1>
      <div className="mt-4 grid gap-3">
        {data.circulars?.map((row: any) => (
          <article key={row.id} className="card p-4">
            <p className="kicker">{row.category}</p>
            <h2 className="text-xl">{row.title}</h2>
            <p className="mt-2 text-[var(--ink-soft)]">{row.content}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Outing({ data, form, setForm, busy, error, onSubmit }: any) {
  return (
    <section>
      <p className="kicker">Hostel outing</p>
      <h1 className="display text-4xl">The warden approves. The gate scans.</h1>
      <div className="card mt-4 grid max-w-xl gap-3 p-4">
        <input className="field" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        <input className="field" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
        <input className="field" type="datetime-local" value={form.leaveFrom} onChange={(e) => setForm({ ...form, leaveFrom: e.target.value })} />
        <input className="field" type="datetime-local" value={form.leaveTo} onChange={(e) => setForm({ ...form, leaveTo: e.target.value })} />
        {error && <p className="text-sm text-[var(--clay)]">{error}</p>}
        <button className="btn" disabled={busy} onClick={onSubmit}>File leave</button>
      </div>
      <div className="mt-4 grid gap-3">
        {data.passes?.map((pass: any) => (
          <article key={pass.id} className="card p-4">
            <span className="chip">{pass.status}</span>
            <h2 className="mt-2 text-xl">{pass.destination}</h2>
            <p className="text-sm text-[var(--ink-soft)]">{pass.reason}</p>
            {pass.scanToken && (
              <div className="mt-3">
                <p className="font-mono text-sm">Gate code {pass.scanToken}</p>
                {pass.svg && <div className="mt-2 max-w-[180px]" dangerouslySetInnerHTML={{ __html: pass.svg }} />}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
