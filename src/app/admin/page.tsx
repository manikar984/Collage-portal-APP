"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mark } from "@/components/chrome";

export default function AdminPage() {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [ops, setOps] = useState<any>(null);
  const [sso, setSso] = useState("");

  useEffect(() => {
    fetch("/api/me").then(async (response) => {
      if (response.status === 401) router.push("/login");
      const data = await response.json();
      setMe(data);
      if (data.role === "STUDENT") router.push("/portal");
      if (data.role === "FACULTY") router.push("/faculty");
      const desk = await fetch("/api/admin/ops");
      if (desk.ok) setOps(await desk.json());
    });
  }, [router]);

  if (!me) return <main className="p-8"><div className="skeleton h-40" /></main>;

  return (
    <main className="mx-auto max-w-5xl px-5 py-6">
      <Mark />
      <p className="kicker mt-8">Registrar · {me.role}</p>
      <h1 className="display text-5xl">Peak day, without a locked database.</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          ["Read path", "Results and timetables sit in Redis for five minutes. The primary is reserved for payments and grade writes."],
          ["Payment path", "Checkout is idempotent. The webhook only queues settlement. A replayed gateway event does not mark an invoice paid twice."],
          ["Edge", "60 requests a minute per token. Question papers and circulars are object keys, served from a CDN in production."],
        ].map(([title, copy]) => (
          <article key={title} className="card p-4">
            <h2 className="text-xl">{title}</h2>
            <p className="mt-2 text-sm text-[var(--ink-soft)]">{copy}</p>
          </article>
        ))}
      </div>
      <section className="card mt-6 p-5">
        <p className="kicker">Admissions queue</p>
        {(ops?.leads || []).length === 0 && <p className="mt-2 text-sm">No inquiries yet. The public form writes here.</p>}
        {(ops?.leads || []).map((lead: any) => (
          <p key={lead.id} className="mt-2 text-sm">{lead.name} · {lead.program} · {lead.phone}</p>
        ))}
        <p className="kicker mt-4">Mentorship requests</p>
        {(ops?.mentors || []).length === 0 && <p className="mt-2 text-sm">No alumni requests yet.</p>}
        {(ops?.mentors || []).map((row: any) => (
          <p key={row.id} className="mt-2 text-sm">{row.name} · {row.alumniName || "any mentor"} · {row.interest}</p>
        ))}
      </section>
      <section className="card mt-4 p-5">
        <p className="kicker">Settlement jobs · depth {ops?.queueDepth || 0}</p>
        {(ops?.jobs || []).length === 0 && <p className="mt-2 text-sm">No payment jobs yet.</p>}
        {(ops?.jobs || []).map((job: any) => (
          <p key={job.id} className="mt-2 font-mono text-xs">{job.status} {job.id}</p>
        ))}
      </section>
      <p className="mt-4 text-sm text-[var(--ink-soft)]">{ops?.unpaid ?? "—"} invoices are still unpaid.</p>
      <button className="btn mt-4" onClick={async () => {
        const response = await fetch("/api/admin/sso");
        const body = await response.json();
        setSso(response.ok ? `${body.note} ${body.redirect}` : body.error);
      }}>Sign legacy ERP redirect</button>
      {sso && <p className="mt-3 break-all text-sm">{sso}</p>}
      <button className="btn secondary mt-6" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); location.href = "/login"; }}>Log out</button>
    </main>
  );
}
