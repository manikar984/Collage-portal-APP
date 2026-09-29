import { PublicFooter, PublicHeader } from "@/components/chrome";
import { getStore } from "@/lib/store";

export default function PlacementsPage() {
  const store = getStore();
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <p className="kicker">Career cell · {store.stats.year}</p>
        <h1 className="display text-5xl">Offers, not slogans.</h1>
        <p className="mt-3 text-[var(--ink-soft)]">Median {store.stats.median} LPA · highest {store.stats.highest} LPA · {store.stats.offers} offers.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {store.stats.partners.map((name) => (
            <span key={name} className="chip font-semibold tracking-tight">{name}</span>
          ))}
        </div>
        <p className="mt-3 text-sm text-[var(--ink-soft)]">{store.alumni[0]?.quote}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {store.placements.map((row) => (
            <article key={row.name} className="card p-5">
              <p className="kicker">{row.marquee ? "Marquee" : "Offer"} · {row.dept}</p>
              <h2 className="display mt-1 text-3xl">{row.company}</h2>
              <p className="mt-2">{row.name}, {row.batch} · {row.role}</p>
              <p className="mt-2 text-2xl">{row.lpa} LPA</p>
            </article>
          ))}
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
