"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award, Bell, BookOpen, Calendar, ChevronDown, ChevronRight, ClipboardCheck,
  CreditCard, Download, FileText, LayoutDashboard, LogOut, Menu, Moon, Phone,
  PanelLeft, Search, Sun, User,
} from "lucide-react";
import type { ExamRow, MarkRow, PortalRecord } from "@/lib/portal-data";

const MARKS = [
  ["marks-mid", "Mid Marks"],
  ["marks-internal", "Final Internal Marks"],
  ["marks-overall", "Overall Marks"],
  ["marks-honors", "Overall Marks Honors and Minors"],
  ["marks-semwise", "Overall Marks - Semwise"],
  ["marks-credits", "Credit Register"],
] as const;

const DOWNLOADS = [
  ["downloads-hall", "Hall Tickets", "hall"],
  ["downloads-timetable", "Exam Time Tables", "timetable"],
  ["downloads-memo", "Marks / Results", "memo"],
  ["downloads-certificates", "Certificates", "certificates"],
  ["downloads-academic", "Academic Documents", "academic"],
  ["downloads-other", "Other Documents", "other"],
] as const;

const NAV = [
  ["home", "Dashboard", LayoutDashboard],
  ["basic", "Basic Information", User],
  ["academic", "Academic Information", BookOpen],
  ["attendance", "Attendance", ClipboardCheck],
  ["timetable", "Exam Time Tables", Calendar],
  ["fees", "Online Fee Payments", CreditCard],
] as const;

const EXAM_LABEL: Record<string, string> = {
  MID1: "Mid I",
  MID2: "Mid II",
  REGULAR: "Semester End / Regular",
  SUPPLEMENTARY: "Supplementary",
  INTERNAL: "Final Internal",
  OVERALL: "Overall",
};

const TITLES: Record<string, string> = {
  home: "Dashboard",
  basic: "Basic Information",
  academic: "Academic Information",
  attendance: "Attendance",
  timetable: "Exam Time Tables",
  fees: "Online Fee Payments",
  contact: "Contact Us",
  notifications: "Notifications",
  "marks-mid": "Mid Marks",
  "marks-internal": "Final Internal Marks",
  "marks-overall": "Overall Marks",
  "marks-honors": "Honors and Minors",
  "marks-semwise": "Semester-wise Results",
  "marks-credits": "Credit Register",
};

function inr(paise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);
}

function semesterSummary(record: PortalRecord, semester: number) {
  const rows = record.marks.filter((row) => row.semester === semester && row.examType === "OVERALL" && row.kind === "REGULAR");
  let points = 0;
  let credits = 0;
  let earned = 0;
  for (const row of rows) {
    if (row.obtained === null || !row.grade) continue;
    const gp = row.gradePoints || 0;
    points += gp * row.credits;
    credits += row.credits;
    if (gp > 0) earned += row.credits;
  }
  return { credits, earned, sgpa: credits === 0 ? null : Math.round((points / credits) * 100) / 100 };
}

function attendanceOf(record: PortalRecord, semester: number) {
  const rows = record.attendance.filter((row) => row.semester === semester);
  const held = rows.reduce((sum, row) => sum + row.conducted, 0);
  const present = rows.reduce((sum, row) => sum + row.attended, 0);
  return { rows, held, present, missed: Math.max(0, held - present), percent: held === 0 ? 0 : Math.round((present / held) * 1000) / 10 };
}

function statusFor(percent: number) {
  if (percent >= 85) return { label: "Good", className: "good" };
  if (percent >= 75) return { label: "Warning", className: "warning" };
  return { label: "Shortage", className: "shortage" };
}

function greeting(name: string) {
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `${hello}, ${name.split(" ")[0]}`;
}

export function StudentPortal({ initialSection = "home" }: { initialSection?: string }) {
  const router = useRouter();
  const [section, setSection] = useState(initialSection);
  const [open, setOpen] = useState({ marks: initialSection.startsWith("marks"), downloads: initialSection.startsWith("downloads") });
  const [menu, setMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const [query, setQuery] = useState("");
  const [record, setRecord] = useState<PortalRecord | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("hit-theme");
    if (saved === "dark" || saved === "light") setTheme(saved);
  }, []);

  useEffect(() => {
    let stop = false;
    fetch("/api/student/record", { cache: "no-store" }).then(async (response) => {
      if (response.status === 401) {
        router.push("/login");
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        if (!stop) setError(data.error || "Could not open the student record.");
        return;
      }
      if (!stop) setRecord(data);
    });
    return () => { stop = true; };
  }, [router]);

  function choose(next: string) {
    setSection(next);
    setMenu(false);
    setProfileOpen(false);
    if (next.startsWith("marks")) setOpen((value) => ({ ...value, marks: true }));
    if (next.startsWith("downloads")) setOpen((value) => ({ ...value, downloads: true }));
  }

  function jump(event: FormEvent) {
    event.preventDefault();
    const hit = [...NAV.map(([id, label]) => [id, label]), ...MARKS, ...DOWNLOADS.map(([id, label]) => [id, label])]
      .find(([, label]) => String(label).toLowerCase().includes(query.trim().toLowerCase()));
    if (hit) choose(String(hit[0]));
  }

  if (!record) {
    return <main className="sp"><p className="sp-note" style={{ padding: 28 }}>{error || "Loading student record..."}</p></main>;
  }

  const title = TITLES[section] || (section.startsWith("downloads") ? "Downloads" : "Student Portal");

  return (
    <div className={`sp ${collapsed ? "is-collapsed" : ""}`} data-theme={theme}>
      <header className="sp-header">
        <button className="sp-iconbtn sp-mobile-only" type="button" aria-label="Open menu" onClick={() => setMenu(true)}><Menu size={18} /></button>
        <button className="sp-iconbtn sp-desktop-only" type="button" aria-label="Collapse sidebar" onClick={() => setCollapsed((value) => !value)}><PanelLeft size={18} /></button>
        <div className="sp-brand">
          <BrandLogo />
          <div>
            <strong>Helios Institute of Technology</strong>
            <span>Student academic portal</span>
          </div>
        </div>
        <form className="sp-search" onSubmit={jump}>
          <Search size={16} />
          <input aria-label="Search sections" placeholder="Search sections" value={query} onChange={(event) => setQuery(event.target.value)} />
        </form>
        <div className="sp-header-actions">
          <button className="sp-iconbtn sp-bell" type="button" aria-label="Notifications" onClick={() => choose("notifications")}>
            <Bell size={18} />
            <span className="sp-badge" />
          </button>
          <button className="sp-iconbtn" type="button" aria-label="Toggle color theme" onClick={() => {
            const next = theme === "dark" ? "light" : "dark";
            setTheme(next);
            localStorage.setItem("hit-theme", next);
          }}>{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</button>
          <div className="sp-menu">
            <button className="sp-profile" type="button" aria-expanded={profileOpen} onClick={() => setProfileOpen((value) => !value)}>
              <img src={record.student.photo} alt="" />
              <span>
                <strong>{record.student.name}</strong>
                <span className="sp-muted">{record.student.htno} · Sem {record.student.semester}</span>
              </span>
            </button>
            {profileOpen && (
              <div className="sp-dropdown">
                <button type="button" onClick={() => choose("basic")}><User size={16} /> Profile</button>
                <button type="button" onClick={() => choose("home")}><LayoutDashboard size={16} /> Dashboard</button>
                <button type="button" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); location.href = "/login"; }}><LogOut size={16} /> Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div className="sp-shell">
        {menu && <button className="sp-backdrop" type="button" aria-label="Close menu" onClick={() => setMenu(false)} />}
        <aside className={`sp-sidebar ${menu ? "open" : ""}`}>
          {NAV.map(([id, label, Icon]) => (
            <button key={id} type="button" className={`sp-navbtn ${section === id ? "active" : ""}`} title={label} onClick={() => choose(id)}>
              <Icon size={18} /> <span className="sp-label">{label}</span>
            </button>
          ))}
          <button type="button" className="sp-parent" aria-expanded={open.marks} onClick={() => setOpen({ ...open, marks: !open.marks })}>
            <Award size={18} /> <span className="sp-label">Marks Details</span> <ChevronDown className="sp-chev" size={16} style={{ marginLeft: "auto", transform: open.marks ? "rotate(180deg)" : undefined }} />
          </button>
          {open.marks && MARKS.map(([id, label]) => (
            <button key={id} type="button" className={`sp-sub ${section === id ? "active" : ""}`} onClick={() => choose(id)}>{label}</button>
          ))}
          <button type="button" className="sp-parent" aria-expanded={open.downloads} onClick={() => setOpen({ ...open, downloads: !open.downloads })}>
            <Download size={18} /> <span className="sp-label">Downloads</span> <ChevronDown className="sp-chev" size={16} style={{ marginLeft: "auto", transform: open.downloads ? "rotate(180deg)" : undefined }} />
          </button>
          {open.downloads && DOWNLOADS.map(([id, label]) => (
            <button key={id} type="button" className={`sp-sub ${section === id ? "active" : ""}`} onClick={() => choose(id)}>{label}</button>
          ))}
          <button type="button" className={`sp-navbtn ${section === "contact" ? "active" : ""}`} onClick={() => choose("contact")}>
            <Phone size={18} /> <span className="sp-label">Contact Us</span>
          </button>
        </aside>
        <main className="sp-main">
          <div className="sp-pagehead">
            <h1>{section === "home" ? greeting(record.student.name) : title}</h1>
            {section === "home" && <p>Here is your academic overview.</p>}
          </div>
          {section === "home" && <Home record={record} onOpen={choose} />}
          {section === "basic" && <Basic record={record} />}
          {section === "academic" && <Academic record={record} />}
          {section === "attendance" && <Attendance record={record} />}
          {section === "timetable" && <Timetable record={record} />}
          {section === "fees" && <Fees record={record} onPaid={() => fetch("/api/student/record").then((res) => res.json()).then(setRecord)} />}
          {section === "marks-mid" && <MidMarks record={record} />}
          {section === "marks-internal" && <InternalMarks record={record} />}
          {section === "marks-overall" && <OverallMarks record={record} />}
          {section === "marks-honors" && <Honors record={record} />}
          {section === "marks-semwise" && <Semwise record={record} />}
          {section === "marks-credits" && <Credits record={record} />}
          {section.startsWith("downloads") && <Downloads record={record} category={DOWNLOADS.find((row) => row[0] === section)?.[2] || "hall"} />}
          {section === "notifications" && <Notifications record={record} />}
          {section === "contact" && <Contact record={record} />}
        </main>
      </div>
    </div>
  );
}

function BrandLogo() {
  const sources = ["/brand/logo.png", "/brand/logo.jpg", "/brand/logo.jpeg", "/brand/logo.webp", "/brand/logo.svg"];
  const [index, setIndex] = useState(0);
  if (index >= sources.length) return <span className="sp-logo" aria-hidden="true" />;
  return <img className="sp-logo" src={sources[index]} alt="Institute logo" onError={() => setIndex((value) => value + 1)} />;
}

function SemesterPills({ value, onChange }: { value: number; onChange: (semester: number) => void }) {
  return (
    <div className="sp-pills" role="tablist" aria-label="Semester">
      {Array.from({ length: 8 }, (_, index) => (
        <button key={index + 1} type="button" role="tab" aria-selected={value === index + 1} className={value === index + 1 ? "active" : ""} onClick={() => onChange(index + 1)}>Sem {index + 1}</button>
      ))}
    </div>
  );
}

function Grid({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="sp-table-wrap">
      <table className="sp-table">
        <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={headers.length}>No records for this selection.</td></tr>}
          {rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

function Home({ record, onOpen }: { record: PortalRecord; onOpen: (section: string) => void }) {
  const current = attendanceOf(record, record.student.semester);
  const previous = attendanceOf(record, Math.max(1, record.student.semester - 1));
  const delta = Math.round((current.percent - previous.percent) * 10) / 10;
  const summaries = Array.from({ length: record.student.semester }, (_, index) => semesterSummary(record, index + 1));
  const credits = summaries.reduce((sum, row) => sum + row.earned, 0);
  const graded = summaries.filter((row) => row.sgpa !== null);
  const cgpa = graded.length ? Math.round((graded.reduce((sum, row) => sum + (row.sgpa || 0), 0) / graded.length) * 100) / 100 : null;
  const upcoming = record.exams.filter((row) => row.semester === record.student.semester).slice(0, 3);
  const due = record.fees.find((row) => row.status !== "Paid");
  return (
    <section className="sp-grid" style={{ gap: 16 }}>
      <div className="sp-grid stats">
        <article className="sp-card"><p className="sp-kicker">Attendance</p><p className="sp-metric">{current.percent}%</p><p className="sp-muted">{delta >= 0 ? "+" : ""}{delta}% vs previous semester</p></article>
        <article className="sp-card"><p className="sp-kicker">Current semester</p><p className="sp-metric">Sem {record.student.semester}</p><p className="sp-muted">{record.student.course} {record.student.branch}</p></article>
        <article className="sp-card"><p className="sp-kicker">CGPA</p><p className="sp-metric">{cgpa ?? "—"}</p><p className="sp-muted">From published semesters</p></article>
        <article className="sp-card"><p className="sp-kicker">Credits</p><p className="sp-metric">{credits} / 160</p><p className="sp-muted">Earned{due ? ` · ${inr(due.amountPaise)} due` : ""}</p></article>
      </div>
      <div>
        <h2 style={{ margin: "4px 0 10px", fontSize: 15 }}>Quick actions</h2>
        <div className="sp-actions">
          {[
            ["attendance", "View attendance", "Semester-wise subject attendance", ClipboardCheck],
            ["marks-mid", "View marks", "Mid, internal, and results", Award],
            ["timetable", "Exam timetable", "Dates, halls, and sessions", Calendar],
            ["downloads-hall", "Download hall ticket", "Current examination ticket", Download],
            ["fees", "Fee payments", "Due, pending, and receipts", CreditCard],
            ["academic", "Academic information", "Subjects and faculty", BookOpen],
          ].map(([id, title, copy, Icon]) => (
            <button key={String(id)} className="sp-action" type="button" onClick={() => onOpen(String(id))}>
              {Icon === ClipboardCheck ? <ClipboardCheck size={18} /> : Icon === Award ? <Award size={18} /> : Icon === Calendar ? <Calendar size={18} /> : Icon === Download ? <Download size={18} /> : Icon === CreditCard ? <CreditCard size={18} /> : <BookOpen size={18} />}
              <span><strong>{String(title)}</strong><span>{String(copy)}</span></span>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      </div>
      <div className="sp-grid two">
        <article className="sp-card">
          <h2>Overall attendance</h2>
          <p className="sp-metric">{current.percent}%</p>
          <div className="sp-bar"><i style={{ width: `${current.percent}%` }} /></div>
          {current.rows.slice(0, 4).map((row) => {
            const percent = row.conducted ? Math.round((row.attended / row.conducted) * 1000) / 10 : 0;
            return (
              <div key={row.code} className="sp-row">
                <span>{row.title}</span>
                <strong>{percent}%</strong>
              </div>
            );
          })}
          <button className="sp-btn ghost" type="button" style={{ marginTop: 10 }} onClick={() => onOpen("attendance")}>View attendance</button>
        </article>
        <article className="sp-card">
          <h2>Upcoming exams</h2>
          <div className="sp-list">
            {upcoming.map((row) => (
              <div key={`${row.code}-${row.examType}`} className="sp-exam">
                <Calendar size={16} />
                <div><strong>{row.title}</strong><div className="sp-muted">{EXAM_LABEL[row.examType]} · {row.date} · {row.time}</div></div>
              </div>
            ))}
          </div>
          <button className="sp-btn ghost" type="button" style={{ marginTop: 10 }} onClick={() => onOpen("timetable")}>View timetable</button>
        </article>
      </div>
      <article className="sp-card">
        <h2>Recent notifications</h2>
        <div className="sp-list">
          {record.notifications.slice(0, 4).map((row) => (
            <div key={row.number} className="sp-notice">
              <Bell size={16} />
              <div><strong>{row.message}</strong><div className="sp-muted">{row.date} · {row.number}</div></div>
            </div>
          ))}
        </div>
        <button className="sp-btn ghost" type="button" style={{ marginTop: 10 }} onClick={() => onOpen("notifications")}>View all notifications</button>
      </article>
    </section>
  );
}

function Basic({ record }: { record: PortalRecord }) {
  const s = record.student;
  const blocks = [
    ["Student profile", [["Name", s.name], ["HTNO", s.htno], ["Branch", s.branchName], ["Year", `${s.year}${s.year === 3 ? "rd" : s.year === 2 ? "nd" : s.year === 1 ? "st" : "th"} year`], ["Semester", String(s.semester)], ["Section", s.section]]],
    ["Academic details", [["Course", s.course], ["Regulation", s.regulation], ["Academic year", s.academicYear], ["Residence", s.hostel]]],
    ["Contact information", [["Email", s.email], ["Phone", s.phone], ["Date of birth", s.dob], ["Blood group", s.bloodGroup]]],
    ["Parent / guardian", [["Name", s.guardianName], ["Phone", s.guardianPhone]]],
  ] as const;
  return (
    <section className="sp-grid two">
      {blocks.map(([title, rows]) => (
        <article key={title} className="sp-card">
          <h2>{title}</h2>
          <div className="sp-info">
            {rows.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
          </div>
        </article>
      ))}
    </section>
  );
}

function Academic({ record }: { record: PortalRecord }) {
  const [semester, setSemester] = useState(record.student.semester);
  const rows = record.subjects.filter((row) => row.semester === semester && row.kind === "REGULAR");
  return (
    <section>
      <SemesterPills value={semester} onChange={setSemester} />
      <p className="sp-note">{record.student.course} · {record.student.branchName} · Year {Math.ceil(semester / 2)}</p>
      <Grid headers={["Subject", "Code", "Credits", "Faculty", "Type"]} rows={rows.map((row) => [row.title, row.code, row.credits, row.faculty, "Regular"])} />
    </section>
  );
}

function Attendance({ record }: { record: PortalRecord }) {
  const [semester, setSemester] = useState(record.student.semester);
  const data = attendanceOf(record, semester);
  return (
    <section>
      <SemesterPills value={semester} onChange={setSemester} />
      {data.held === 0 ? <p className="sp-note">Semester {semester} has not commenced. No classes are recorded.</p> : (
        <>
          <div className="sp-grid stats">
            <article className="sp-card"><p className="sp-kicker">Overall</p><p className="sp-metric">{data.percent}%</p></article>
            <article className="sp-card"><p className="sp-kicker">Conducted</p><p className="sp-metric">{data.held}</p></article>
            <article className="sp-card"><p className="sp-kicker">Attended</p><p className="sp-metric">{data.present}</p></article>
            <article className="sp-card"><p className="sp-kicker">Missed</p><p className="sp-metric">{data.missed}</p></article>
          </div>
          <div className="sp-table-wrap" style={{ marginTop: 12 }}>
            <table className="sp-table">
              <thead><tr><th>Subject</th><th>Conducted</th><th>Attended</th><th>Missed</th><th>Percentage</th><th>Status</th></tr></thead>
              <tbody>
                {data.rows.map((row) => {
                  const percent = Math.round((row.attended / row.conducted) * 1000) / 10;
                  const status = statusFor(percent);
                  return (
                    <tr key={row.code}>
                      <td>{row.title}<div className="sp-muted">{row.code}</div></td>
                      <td>{row.conducted}</td>
                      <td>{row.attended}</td>
                      <td>{row.conducted - row.attended}</td>
                      <td>{percent}%<div className="sp-bar"><i style={{ width: `${percent}%` }} /></div></td>
                      <td><span className={`sp-badge-status ${status.className}`}>{status.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

function Timetable({ record }: { record: PortalRecord }) {
  const [semester, setSemester] = useState(record.student.semester);
  const [examType, setExamType] = useState<ExamRow["examType"]>("MID1");
  const rows = record.exams.filter((row) => row.semester === semester && row.examType === examType);
  return (
    <section>
      <SemesterPills value={semester} onChange={setSemester} />
      <div className="sp-pills" aria-label="Exam type">
        {(["MID1", "MID2", "REGULAR", "SUPPLEMENTARY"] as const).map((type) => (
          <button key={type} type="button" className={examType === type ? "active" : ""} onClick={() => setExamType(type)}>{EXAM_LABEL[type]}</button>
        ))}
      </div>
      <div className="sp-table-desk">
        <Grid headers={["Subject", "Code", "Date", "Day", "Time", "Venue"]} rows={rows.map((row) => [row.title, row.code, row.date, row.day, row.time, row.room])} />
      </div>
      <div className="sp-cards">
        {rows.length === 0 && <p className="sp-note">No records for this selection.</p>}
        {rows.map((row) => (
          <article key={`${row.code}-${row.date}`} className="sp-exam">
            <div><strong>{row.title}</strong><div className="sp-muted">{row.code} · {row.day} · {row.date}</div><div>{row.time} · {row.room}</div></div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Fees({ record, onPaid }: { record: PortalRecord; onPaid: () => void }) {
  const [otp, setOtp] = useState("482913");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const due = record.fees.filter((row) => row.status === "Due").reduce((sum, row) => sum + row.amountPaise, 0);
  const pending = record.fees.filter((row) => row.status === "Pending").reduce((sum, row) => sum + row.amountPaise, 0);
  const paid = record.fees.filter((row) => row.status === "Paid").reduce((sum, row) => sum + row.amountPaise, 0);

  async function pay(invoiceId: string) {
    setBusy(true);
    setNote("");
    await fetch("/api/auth/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ purpose: "payment" }) });
    const verified = await fetch("/api/auth/otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ purpose: "payment", code: otp }) });
    if (!verified.ok) {
      setNote("OTP was not accepted.");
      setBusy(false);
      return;
    }
    const key = `portal-${invoiceId}`;
    const checkout = await fetch("/api/fees/checkout", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key }, body: JSON.stringify({ invoiceId, idempotencyKey: key }) });
    const order = await checkout.json();
    if (!checkout.ok) {
      setNote(order.error || "Payment could not start.");
      setBusy(false);
      return;
    }
    const settled = await fetch("/api/fees/webhook", { method: "POST", headers: { "Content-Type": "application/json", "x-payment-signature": order.signature }, body: JSON.stringify({ ...order, method: "UPI" }) });
    setNote(settled.ok ? `Payment queued. Reference ${order.gatewayRef}.` : "The demo gateway did not accept the webhook.");
    onPaid();
    setBusy(false);
  }

  return (
    <section>
      <div className="sp-grid three">
        <article className="sp-card"><p className="sp-kicker">Total due</p><p className="sp-metric">{inr(due)}</p></article>
        <article className="sp-card"><p className="sp-kicker">Pending</p><p className="sp-metric">{inr(pending)}</p></article>
        <article className="sp-card"><p className="sp-kicker">Paid</p><p className="sp-metric">{inr(paid)}</p></article>
      </div>
      <p className="sp-note" style={{ marginTop: 12 }}>Pay Now uses the existing demo checkout, not a live bank. Demo OTP: 482913.</p>
      <label className="sp-field">Payment OTP<input value={otp} onChange={(event) => setOtp(event.target.value)} /></label>
      {note && <p className="sp-note">{note}</p>}
      <div className="sp-table-wrap">
        <table className="sp-table">
          <thead><tr><th>Year</th><th>Semester</th><th>Fee</th><th>Amount</th><th>Status</th><th>Date</th><th>Reference</th><th></th></tr></thead>
          <tbody>
            {record.fees.map((row) => (
              <tr key={row.id}>
                <td>{row.academicYear}</td>
                <td>{row.semester}</td>
                <td>{row.type}</td>
                <td>{inr(row.amountPaise)}</td>
                <td><span className={`sp-badge-status ${row.status.toLowerCase()}`}>{row.status.toUpperCase()}</span></td>
                <td>{row.paidOn || "—"}</td>
                <td>{row.reference || "—"}</td>
                <td>{row.invoiceId && row.status !== "Paid" ? <button type="button" disabled={busy} onClick={() => pay(row.invoiceId || "")}>Pay Now</button> : row.txnId ? <a href={`/api/fees/receipt?txnId=${row.txnId}`}>Receipt</a> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function markRows(record: PortalRecord, semester: number, examType: MarkRow["examType"], kind: MarkRow["kind"] = "REGULAR") {
  return record.marks.filter((row) => row.semester === semester && row.examType === examType && row.kind === kind && row.obtained !== null);
}

function MarkList({ rows }: { rows: MarkRow[] }) {
  if (rows.length === 0) return <p className="sp-note">No marks for this selection.</p>;
  const total = rows.reduce((sum, row) => sum + (row.obtained || 0), 0);
  const max = rows.reduce((sum, row) => sum + row.maxMarks, 0);
  return (
    <>
      <article className="sp-card" style={{ marginBottom: 12 }}><p className="sp-kicker">Marks summary</p><p className="sp-metric">{total} / {max}</p></article>
      <div className="sp-list">
        {rows.map((row) => (
          <article key={row.code} className="sp-card">
            <div className="sp-row"><strong>{row.title}</strong><span>{row.obtained} / {row.maxMarks}</span></div>
            <div className="sp-muted">{row.code}{row.grade ? ` · ${row.grade}` : ""}</div>
            <div className="sp-bar"><i style={{ width: `${Math.round(((row.obtained || 0) / row.maxMarks) * 100)}%` }} /></div>
          </article>
        ))}
      </div>
    </>
  );
}

function MidMarks({ record }: { record: PortalRecord }) {
  const [semester, setSemester] = useState(record.student.semester);
  const [examType, setExamType] = useState<MarkRow["examType"]>("MID1");
  return (
    <section>
      <SemesterPills value={semester} onChange={setSemester} />
      <div className="sp-pills">
        <button type="button" className={examType === "MID1" ? "active" : ""} onClick={() => setExamType("MID1")}>Mid I</button>
        <button type="button" className={examType === "MID2" ? "active" : ""} onClick={() => setExamType("MID2")}>Mid II</button>
      </div>
      <MarkList rows={markRows(record, semester, examType)} />
    </section>
  );
}

function InternalMarks({ record }: { record: PortalRecord }) {
  const [semester, setSemester] = useState(record.student.semester);
  return <section><SemesterPills value={semester} onChange={setSemester} /><MarkList rows={markRows(record, semester, "INTERNAL")} /></section>;
}

function OverallMarks({ record }: { record: PortalRecord }) {
  const [semester, setSemester] = useState(Math.max(1, record.student.semester - 1));
  const rows = record.marks.filter((row) => row.semester === semester && row.examType === "OVERALL" && row.kind === "REGULAR");
  const published = rows.some((row) => row.obtained !== null);
  return (
    <section>
      <SemesterPills value={semester} onChange={setSemester} />
      {!published ? <p className="sp-note">Result is not published for semester {semester}.</p> : (
        <Grid headers={["Subject", "Code", "Credits", "Marks", "Grade"]} rows={rows.map((row) => [row.title, row.code, row.credits, `${row.obtained}/${row.maxMarks}`, row.grade || "-"])} />
      )}
    </section>
  );
}

function Honors({ record }: { record: PortalRecord }) {
  const rows = record.marks.filter((row) => row.kind !== "REGULAR" && row.examType === "OVERALL");
  if (rows.length === 0) return <p className="sp-note">No honors or minor subjects are registered.</p>;
  return <Grid headers={["Semester", "Type", "Subject", "Code", "Marks", "Grade"]} rows={rows.map((row) => [row.semester, row.kind, row.title, row.code, row.obtained === null ? "In progress" : `${row.obtained}/${row.maxMarks}`, row.grade || "-"])} />;
}

function Semwise({ record }: { record: PortalRecord }) {
  const rows = useMemo(() => Array.from({ length: 8 }, (_, index) => {
    const semester = index + 1;
    const summary = semesterSummary(record, semester);
    const status = semester > record.student.semester ? "Not commenced" : semester === record.student.semester ? "In progress" : "Completed";
    return [semester, status, summary.credits || "—", summary.earned || "—", summary.sgpa ?? "—"] as (string | number)[];
  }), [record]);
  return <Grid headers={["Semester", "Status", "Credits registered", "Credits earned", "SGPA"]} rows={rows} />;
}

function Credits({ record }: { record: PortalRecord }) {
  const rows = record.marks.filter((row) => row.examType === "OVERALL");
  const earned = rows.reduce((sum, row) => sum + (row.gradePoints ? row.credits : 0), 0);
  return (
    <section>
      <p className="sp-note">Earned credits {earned}. Required credits 160.</p>
      <Grid headers={["Semester", "Code", "Subject", "Credits", "Grade", "Grade points", "Earned"]} rows={rows.map((row) => [row.semester, row.code, row.title, row.credits, row.grade || "-", row.gradePoints ?? "-", row.gradePoints ? row.credits : 0])} />
    </section>
  );
}

function Downloads({ record, category }: { record: PortalRecord; category: string }) {
  const rows = record.downloads.filter((row) => row.category === category);
  return (
    <div className="sp-list">
      {rows.length === 0 && <p className="sp-note">No documents in this folder.</p>}
      {rows.map((row) => (
        <article key={row.id} className="sp-doc">
          <div style={{ display: "flex", gap: 12 }}>
            <FileText size={20} />
            <div>
              <strong>{row.name}</strong>
              <div className="sp-muted">PDF · {row.exam}{row.semester ? ` · Semester ${row.semester}` : ""} · {row.detail}</div>
            </div>
          </div>
          <a className="sp-btn" href={`/api/student/document?id=${row.id}`}>Download</a>
        </article>
      ))}
    </div>
  );
}

function Notifications({ record }: { record: PortalRecord }) {
  const [filter, setFilter] = useState("all");
  const [read, setRead] = useState<string[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem("hit-read-notices");
    if (saved) setRead(JSON.parse(saved));
  }, []);
  function mark(number: string) {
    const next = Array.from(new Set([...read, number]));
    setRead(next);
    localStorage.setItem("hit-read-notices", JSON.stringify(next));
  }
  const rows = record.notifications.filter((row) => filter === "all" || (filter === "read" ? read.includes(row.number) : !read.includes(row.number)));
  return (
    <section>
      <div className="sp-pills">
        {["all", "unread", "read"].map((item) => <button key={item} type="button" className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}
      </div>
      <div className="sp-list">
        {rows.map((row) => (
          <button key={row.number} type="button" className={`sp-notice ${read.includes(row.number) ? "read" : ""}`} onClick={() => mark(row.number)}>
            <Bell size={16} />
            <div style={{ textAlign: "left" }}><strong>{row.message}</strong><div className="sp-muted">{row.date} · {row.number}</div></div>
          </button>
        ))}
      </div>
    </section>
  );
}

function Contact({ record }: { record: PortalRecord }) {
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const cards = [
    ["College address", record.college.address],
    ["Phone", record.college.phone],
    ["Email", record.college.email],
    ...record.college.departments.map((row) => [row.name, `${row.email} · ${row.phone}`]),
  ];
  return (
    <section className="sp-grid two">
      {cards.map(([title, value]) => (
        <article key={title} className="sp-card"><h2>{title}</h2><p className="sp-muted">{value}</p></article>
      ))}
      <form className="sp-card sp-form" onSubmit={async (event) => {
        event.preventDefault();
        const response = await fetch("/api/student/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: record.student.name, email: record.student.email, phone: record.student.phone, message }) });
        const data = await response.json();
        setNote(response.ok ? `Message sent. Reference ${data.reference}.` : data.error);
        if (response.ok) setMessage("");
      }}>
        <h2>Write to the office</h2>
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} required placeholder="Your message" />
        <button className="sp-btn" type="submit">Send</button>
        {note && <p className="sp-note">{note}</p>}
      </form>
    </section>
  );
}
