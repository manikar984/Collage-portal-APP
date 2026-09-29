import Link from "next/link";
import { PublicFooter, PublicHeader } from "@/components/chrome";

export default function AdmissionsPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <p className="kicker">Admissions</p>
        <h1 className="display mt-2 text-5xl">How a seat is offered.</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["1", "Rank check", "Match the published cutoff for the branch. The checker on the home page uses last year's table, not a promise."],
            ["2", "Inquiry", "Name, phone, and program go to the registrar queue. No login is required."],
            ["3", "Counselling", "Bring the entrance memo. The portal does not replace the counselling authority."],
          ].map(([n, t, c]) => (
            <article key={n} className="card p-5">
              <div className="display text-4xl text-[var(--brass)]">{n}</div>
              <h2 className="mt-2 text-xl">{t}</h2>
              <p className="mt-2 text-[var(--ink-soft)]">{c}</p>
            </article>
          ))}
        </div>
        <Link href="/" className="btn mt-6 inline-block">Back to the rank checker</Link>
      </main>
      <PublicFooter />
    </>
  );
}
