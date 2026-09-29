import { AlumniDesk } from "@/components/alumni-desk";
import { PublicFooter, PublicHeader } from "@/components/chrome";
import { getStore } from "@/lib/store";

export default function AlumniPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <p className="kicker">Alumni</p>
        <h1 className="display text-5xl">People who still take a Friday call.</h1>
        <AlumniDesk people={getStore().alumni} />
      </main>
      <PublicFooter />
    </>
  );
}
