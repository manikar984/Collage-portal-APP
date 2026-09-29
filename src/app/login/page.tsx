"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const demos = [
  ["21CSE0142", "Ananya Rao"],
  ["21ECE0088", "Rohan Iyer"],
  ["FAC1024", "Faculty"],
  ["WAR2001", "Warden"],
  ["EXM3001", "Exam cell"],
  ["ADM0001", "Registrar"],
];

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("21CSE0142");
  const [password, setPassword] = useState("campus-demo");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error || "Login failed");
      return;
    }
    if (data.role === "STUDENT") router.push("/portal");
    else if (data.role === "FACULTY" || data.role === "WARDEN") router.push("/faculty");
    else router.push("/admin");
  }

  return (
    <main className="sp" style={{ display: "grid", placeItems: "center", padding: 24 }}>
      <form className="sp-card sp-form" onSubmit={submit} style={{ width: "min(440px, 100%)" }}>
        <img src="/brand/logo.png" alt="Institute logo" className="sp-logo" onError={(event) => { event.currentTarget.style.display = "none"; }} />
        <h1 style={{ margin: "12px 0 4px", fontSize: 24 }}>Helios Institute of Technology</h1>
        <p className="sp-muted">Sign in with your HTNO or faculty ID.</p>
        <label className="sp-field" style={{ display: "grid", gap: 6, marginTop: 16 }}>HTNO / Faculty ID
          <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete="username" />
        </label>
        <label className="sp-field" style={{ display: "grid", gap: 6, margin: "12px 0" }}>Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
        </label>
        {error && <p className="sp-note">{error}</p>}
        <button className="sp-btn" type="submit" disabled={busy}>{busy ? "Checking..." : "Login"}</button>
        <p className="sp-note" style={{ marginTop: 12 }}>Demo password: campus-demo</p>
        <div className="sp-pills">
          {demos.map(([id, label]) => (
            <button type="button" key={id} onClick={() => setIdentifier(id)}>{label}</button>
          ))}
        </div>
      </form>
    </main>
  );
}
