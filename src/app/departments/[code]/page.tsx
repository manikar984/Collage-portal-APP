import { notFound } from "next/navigation";
import { PublicFooter, PublicHeader } from "@/components/chrome";
import { getStore } from "@/lib/store";

export default function DepartmentPage({ params }: { params: { code: string } }) {
  const dept = getStore().departments.find((row) => row.code.toLowerCase() === params.code.toLowerCase());
  if (!dept) notFound();
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-3xl px-5 py-8">
        <p className="kicker">{dept.code}</p>
        <h1 className="display text-5xl">{dept.name}</h1>
        <p className="mt-4 text-lg text-[var(--ink-soft)]">{dept.overview}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {dept.labs.map((lab) => <span key={lab} className="chip">{lab}</span>)}
        </div>
        <p className="mt-6">Head of department: {dept.hod}<br />{dept.email}</p>
        <div className="mt-8 grid gap-3">
          {getStore().faculty.filter((person) => person.departmentCode === dept.code).map((person) => (
            <article key={person.email} className="card p-4">
              <p className="kicker">{person.title}</p>
              <h2 className="text-2xl">{person.name}</h2>
              <p className="text-sm">{person.email}</p>
              <ul className="mt-2 text-sm text-[var(--ink-soft)]">
                {person.publications.map((title) => <li key={title}>{title}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
