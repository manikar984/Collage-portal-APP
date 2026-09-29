import Link from "next/link";

export function Mark({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="wordmark">
      <span className="mark" style={light ? { background: "#f0e2c4", color: "#17211c" } : undefined}>H</span>
      <span>
        <strong style={{ display: "block", fontSize: 15 }}>Helios</strong>
        <span style={{ display: "block", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: light ? "#e7d7b0" : "var(--ink-soft)" }}>
          Institute of Technology
        </span>
      </span>
    </Link>
  );
}

export function PublicHeader() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
      <Mark />
      <nav className="hidden items-center gap-5 md:flex">
        <Link className="navlink" href="/admissions">Admissions</Link>
        <Link className="navlink" href="/departments">Departments</Link>
        <Link className="navlink" href="/placements">Placements</Link>
        <Link className="navlink" href="/campus">Campus</Link>
        <Link className="navlink" href="/alumni">Alumni</Link>
      </nav>
      <Link href="/login" className="btn">Student login</Link>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mx-auto mt-16 max-w-6xl border-t border-[var(--line)] px-5 py-8 text-sm text-[var(--ink-soft)]">
      Helios Institute of Technology is a fictional campus used to demonstrate this portal. No real student records are stored.
    </footer>
  );
}

const tabs = [
  { href: "/portal", label: "Home" },
  { href: "/portal/academics", label: "Academics" },
  { href: "/portal/fees", label: "Fees" },
  { href: "/portal/profile", label: "Profile" },
];

export function StudentChrome({ active, children }: { active: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-[var(--line)] bg-[#fffaf3] p-5 md:block">
        <Mark />
        <p className="kicker mt-8">Student vault</p>
        <nav className="mt-4 grid gap-1">
          {tabs.map((tab) => (
            <Link key={tab.href} href={tab.href} className={`rounded-2xl px-3 py-2 text-sm ${active === tab.href ? "bg-[var(--pine-deep)] text-[#f6f1e6]" : ""}`}>
              {tab.label}
            </Link>
          ))}
          {[
            ["/portal/id", "Digital ID"],
            ["/portal/exams", "Hall ticket"],
            ["/portal/attendance", "Attendance"],
            ["/portal/pyq", "Question papers"],
            ["/portal/scholarships", "Scholarships"],
            ["/portal/circulars", "Circulars"],
            ["/portal/outing", "Gate pass"],
          ].map(([href, label]) => (
            <Link key={href} href={href} className={`rounded-2xl px-3 py-2 text-sm ${active === href ? "bg-[var(--pine-deep)] text-[#f6f1e6]" : "text-[var(--ink-soft)]"}`}>
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="px-4 pb-28 pt-4 md:px-8 md:pb-10">
        {children}
      </div>
      <nav className="bottom-nav">
        {tabs.map((tab) => (
          <Link key={tab.href} href={tab.href} className={active === tab.href ? "active" : ""}>
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
