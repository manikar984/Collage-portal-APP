"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { PublicFooter, PublicHeader } from "./chrome";

const cutoffs = [
  { code: "CSE", name: "Computer Science", rank: 4200 },
  { code: "IT", name: "Information Technology", rank: 6400 },
  { code: "ECE", name: "Electronics", rank: 8600 },
  { code: "EEE", name: "Electrical", rank: 14000 },
  { code: "ME", name: "Mechanical", rank: 18000 },
  { code: "CE", name: "Civil", rank: 22000 },
];

export function PublicHome() {
  const [rank, setRank] = useState("5100");
  const [lead, setLead] = useState({ name: "", phone: "", email: "", program: "CSE", message: "" });
  const [leadId, setLeadId] = useState("");
  const eligible = useMemo(() => cutoffs.filter((row) => Number(rank) > 0 && Number(rank) <= row.rank), [rank]);

  async function submitLead(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/public/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...lead, rank: Number(rank) }),
    });
    const data = await response.json();
    if (response.ok) setLeadId(data.leadId);
  }

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-5">
        <section className="grid items-end gap-8 py-8 md:grid-cols-[1.3fr_0.7fr]">
          <div>
            <p className="kicker">Autonomous · Academic City · Est. 1998</p>
            <h1 className="display mt-3 max-w-3xl text-5xl md:text-7xl">The campus, without the queue at the counter.</h1>
            <p className="mt-5 max-w-xl text-lg text-[var(--ink-soft)]">
              Hall tickets, fee receipts, attendance, and the hostel gate pass live on one identity. A student can open their own record. They cannot open anyone else&apos;s.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="btn" href="/login">Open the student vault</Link>
              <Link className="btn secondary" href="/departments">Browse branches</Link>
            </div>
          </div>
          <div className="card p-5">
            <p className="kicker">This year&apos;s desk</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                ["612", "offers"],
                ["8.4 LPA", "median CTC"],
                ["52 LPA", "highest"],
                ["6", "departments"],
              ].map(([n, l]) => (
                <div key={l} className="rounded-2xl bg-[var(--paper)] p-3">
                  <div className="display text-3xl">{n}</div>
                  <div className="text-sm text-[var(--ink-soft)]">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card mt-6 grid gap-6 p-6 md:grid-cols-2">
          <div>
            <p className="kicker">Admissions</p>
            <h2 className="display mt-2 text-4xl">Check a rank against last year&apos;s cutoffs.</h2>
            <label className="mt-4 block text-sm">EAMCET-style rank
              <input className="field mt-2" value={rank} onChange={(e) => setRank(e.target.value)} inputMode="numeric" />
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              {eligible.length === 0 ? <span className="chip">No branch at this rank in the published table.</span> : eligible.map((row) => (
                <span key={row.code} className="chip">{row.code} · cutoff {row.rank.toLocaleString("en-IN")}</span>
              ))}
            </div>
          </div>
          <form onSubmit={submitLead} className="grid gap-3">
            <p className="text-sm text-[var(--ink-soft)]">Leave a lead for the admissions desk. This stays in the demo registrar queue.</p>
            <input className="field" placeholder="Student or parent name" value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} required />
            <input className="field" placeholder="Phone" value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} required />
            <input className="field" placeholder="Email" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} required />
            <select className="field" value={lead.program} onChange={(e) => setLead({ ...lead, program: e.target.value })}>
              {cutoffs.map((row) => <option key={row.code}>{row.code}</option>)}
            </select>
            <button className="btn brass" type="submit">Send inquiry</button>
            {leadId && <p className="text-sm">Inquiry {leadId.slice(0, 8)} is with the admissions desk.</p>}
          </form>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            ["Departments", "CSE through Civil, with labs and the people who run them.", "/departments"],
            ["Placements", "Marquee offers, median CTC, and the companies that returned.", "/placements"],
            ["Campus life", "Fests, the canal ground, and convocation under the banyan.", "/campus"],
          ].map(([title, copy, href]) => (
            <Link key={title} href={href} className="card block p-5">
              <p className="kicker">Explore</p>
              <h3 className="display mt-2 text-3xl">{title}</h3>
              <p className="mt-2 text-[var(--ink-soft)]">{copy}</p>
            </Link>
          ))}
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
