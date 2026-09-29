"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mark } from "@/components/chrome";

export default function FacultyPage() {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [note, setNote] = useState("");
  const [passes, setPasses] = useState<any[]>([]);
  const [marks, setMarks] = useState("32");
  const [csv, setCsv] = useState("rollNo,courseCode,marks\n21CSE0142,CS401,32\n21CSE0148,CS401,28\n21CSE0155,CS401,35");
  const [gateCode, setGateCode] = useState("");
  const [notice, setNotice] = useState({ title: "Lab closed Friday", content: "CS401 lab is closed this Friday for maintenance. Theory class meets in AB-112." });

  useEffect(() => {
    fetch("/api/me").then(async (response) => {
      if (response.status === 401) router.push("/login");
      const data = await response.json();
      setMe(data);
      if (data.role === "STUDENT") router.push("/portal");
      if (data.role === "FACULTY" || data.role === "ADMIN") {
        const sheet = await fetch("/api/faculty/attendance").then((res) => res.json());
        setRoster(sheet.roster || []);
      }
      if (data.role === "WARDEN" || data.role === "ADMIN") {
        const desk = await fetch("/api/outing").then((res) => res.json());
        setPasses(desk.passes || []);
      }
    });
  }, [router]);

  async function save() {
    const response = await fetch("/api/faculty/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marks: roster.map((row) => ({ studentId: row.studentId, present: row.present })) }),
    });
    const data = await response.json();
    setNote(data.absentNotified?.length ? `Absent notice queued for ${data.absentNotified.join(", ")}` : "Everyone is marked present.");
  }

  async function decide(passId: string, decision: string) {
    await fetch("/api/outing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passId, decision }),
    });
    setPasses((rows) => rows.map((row) => row.id === passId ? { ...row, status: decision } : row));
  }

  if (!me) return <main className="p-8"><div className="skeleton h-40" /></main>;

  return (
    <main className="mx-auto max-w-4xl px-5 py-6">
      <Mark />
      <p className="kicker mt-8">{me.role}</p>
      <h1 className="display text-5xl">{me.name}</h1>
      {(me.role === "FACULTY" || me.role === "ADMIN") && (
        <section className="mt-6">
          <h2 className="text-2xl">CS401 · section B</h2>
          <div className="card mt-3 divide-y divide-[var(--line)]">
            {roster.map((row) => (
              <label key={row.studentId} className="flex items-center justify-between px-4 py-3">
                <span>{row.rollNo} · {row.name}</span>
                <input type="checkbox" checked={row.present} onChange={(e) => setRoster(roster.map((item) => item.studentId === row.studentId ? { ...item, present: e.target.checked } : item))} />
              </label>
            ))}
          </div>
          <button className="btn mt-4" onClick={save}>Save attendance</button>
          {note && <p className="mt-3 text-sm">{note}</p>}
          <div className="card mt-4 grid gap-3 p-4">
            <p className="kicker">CIE marks · out of 40</p>
            <label className="text-sm">Ananya Rao, CS401
              <input className="field mt-1" value={marks} onChange={(e) => setMarks(e.target.value)} />
            </label>
            <button className="btn secondary" onClick={async () => {
              const response = await fetch("/api/faculty/marks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId: roster[0]?.studentId, courseCode: "CS401", marks: Number(marks) }),
              });
              const body = await response.json();
              setNote(response.ok ? `CIE saved: ${body.marks}/40` : body.error);
            }}>Save CIE</button>
            <textarea className="field" rows={4} value={csv} onChange={(e) => setCsv(e.target.value)} />
            <button className="btn secondary" onClick={async () => {
              const response = await fetch("/api/faculty/marks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ csv }),
              });
              const body = await response.json();
              setNote(response.ok ? `CSV saved ${body.saved} rows. Internal average ${body.internalAverage}/40. SGPA still comes from completed grades, not CIE.` : body.error);
            }}>Upload CIE CSV</button>
          </div>
          <div className="card mt-4 grid gap-3 p-4">
            <p className="kicker">Circular</p>
            <input className="field" value={notice.title} onChange={(e) => setNotice({ ...notice, title: e.target.value })} />
            <textarea className="field" rows={3} value={notice.content} onChange={(e) => setNotice({ ...notice, content: e.target.value })} />
            <button className="btn secondary" onClick={async () => {
              const response = await fetch("/api/faculty/circular", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...notice, department: "CSE", year: 2021, category: "Academic" }),
              });
              const body = await response.json();
              setNote(response.ok ? "Circular posted to CSE 2021." : body.error);
            }}>Post circular</button>
          </div>
        </section>
      )}
      {(me.role === "WARDEN" || me.role === "ADMIN") && (
        <section className="mt-8">
          <h2 className="text-2xl">Gate passes</h2>
          <div className="card mt-3 grid gap-3 p-4">
            <p className="kicker">Gate scan</p>
            <input className="field" value={gateCode} onChange={(e) => setGateCode(e.target.value)} placeholder="Pass code" />
            <button className="btn" onClick={async () => {
              const response = await fetch("/api/outing/scan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: gateCode }),
              });
              const body = await response.json();
              setNote(response.ok ? `Scanned. ${body.destination} is now ${body.status}.` : body.error);
              if (response.ok) {
                const desk = await fetch("/api/outing").then((res) => res.json());
                setPasses(desk.passes || []);
              }
            }}>Scan at the gate</button>
          </div>
          <div className="mt-3 grid gap-3">
            {passes.map((pass) => (
              <article key={pass.id} className="card p-4">
                <p className="kicker">{pass.status}</p>
                <h3 className="text-xl">{pass.destination}</h3>
                <p className="text-sm text-[var(--ink-soft)]">{pass.reason}</p>
                {pass.status === "PENDING" && (
                  <div className="mt-3 flex gap-2">
                    <button className="btn" onClick={() => decide(pass.id, "APPROVED")}>Approve</button>
                    <button className="btn secondary" onClick={() => decide(pass.id, "REJECTED")}>Reject</button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
      <button className="btn secondary mt-8" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); location.href = "/login"; }}>Log out</button>
    </main>
  );
}
