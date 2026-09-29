export default function LegacySsoPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16">
      <p className="kicker">Legacy ERP</p>
      <h1 className="display mt-2 text-5xl">The redirect stops here.</h1>
      <p className="mt-4 text-[var(--ink-soft)]">
        A production registrar session would be handed to the old ERP as a short-lived signed token. This preview does not call that system, and it never copies a password across.
      </p>
    </main>
  );
}
