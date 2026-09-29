"use client";

import { FormEvent, useState } from "react";

type Person = { name: string; dept: string; batch: number; role: string; org: string; spotlight: string; quote?: string; open: boolean };

export function AlumniDesk({ people }: { people: Person[] }) {
  const [form, setForm] = useState({ name: "", email: "", interest: "", alumniName: people[0]?.name || "" });
  const [note, setNote] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/public/mentor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    setNote(response.ok ? "The alumni desk has the request." : data.error);
  }

  return (
    <>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {people.map((person) => (
          <article key={person.name} className="card p-5">
            <p className="kicker">{person.dept} · {person.batch}</p>
            <h2 className="display text-3xl">{person.name}</h2>
            <p className="mt-2">{person.role}, {person.org}</p>
            <p className="mt-2 text-[var(--ink-soft)]">{person.spotlight}</p>
            {person.quote && <p className="mt-3 text-sm">“{person.quote}”</p>}
            {person.open && <span className="chip mt-3">Mentorship open</span>}
          </article>
        ))}
      </div>
      <form onSubmit={submit} className="card mt-6 grid max-w-xl gap-3 p-5">
        <p className="kicker">Ask for a mentor</p>
        <input className="field" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="field" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <select className="field" value={form.alumniName} onChange={(e) => setForm({ ...form, alumniName: e.target.value })}>
          {people.filter((person) => person.open).map((person) => <option key={person.name}>{person.name}</option>)}
        </select>
        <textarea className="field" rows={3} placeholder="What do you want to talk about?" value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })} required />
        <button className="btn" type="submit">Register</button>
        {note && <p className="text-sm">{note}</p>}
        <p className="text-xs text-[var(--ink-soft)]">Video booth recordings stay on campus storage. This preview keeps the written note, not a fabricated video.</p>
      </form>
    </>
  );
}
