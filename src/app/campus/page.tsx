import { PublicFooter, PublicHeader } from "@/components/chrome";
import { getStore } from "@/lib/store";

export default function CampusPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <p className="kicker">Campus life</p>
        <h1 className="display text-5xl">What the gallery is actually of.</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {getStore().gallery.map((item) => (
            <article key={item.title} className="overflow-hidden rounded-[22px] border border-[var(--line)]">
              <img src={`/gallery/${item.category.toLowerCase()}.svg`} alt="" className="h-44 w-full object-cover" />
              <div className="bg-[var(--card)] p-5">
                <p className="kicker">{item.category}</p>
                <h2 className="display text-3xl">{item.title}</h2>
                <p className="mt-2 text-[var(--ink-soft)]">{item.caption}</p>
              </div>
            </article>
          ))}
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
