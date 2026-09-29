import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/chrome";
import { getStore } from "@/lib/store";

export default function DepartmentsPage() {
  const departments = getStore().departments;
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <p className="kicker">Branches</p>
        <h1 className="display text-5xl">Six departments, one timetable office.</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {departments.map((dept) => (
            <Link key={dept.code} href={`/departments/${dept.code.toLowerCase()}`} className="card block p-5">
              <p className="kicker">{dept.code}</p>
              <h2 className="display mt-1 text-3xl">{dept.name}</h2>
              <p className="mt-2 text-[var(--ink-soft)]">{dept.overview}</p>
              <p className="mt-3 text-sm">{dept.hod} · {dept.email}</p>
            </Link>
          ))}
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
