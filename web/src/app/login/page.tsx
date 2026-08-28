"use client";

import { useEffect, useState } from "react";

type Health = {
  login?: { configured: boolean; password: boolean; github: boolean; allowlist: boolean; email?: boolean };
  mail?: { configured: boolean };
};

export default function LoginPage() {
  const [health, setHealth] = useState<Health>({});
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("error")) setError(q.get("error")!);
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => {});
  }, []);

  /** Ask for a link. The answer is the same whether or not the address is an operator. */
  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/magic/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "could not send the link");
      return;
    }
    setSent(true);
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/operator/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "could not sign in");
      return;
    }
    const next = new URLSearchParams(window.location.search).get("next") || "/";
    window.location.href = next;
  }

  const login = health.login;

  return (
    <div className="flex h-full items-center justify-center p-6" style={{ background: "var(--surface-void)" }}>
      <div
        className="flex w-[380px] max-w-full flex-col gap-3.5 rounded-[14px] p-6"
        style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}
      >
        <div>
          <div className="flex items-center gap-2 text-[15px] font-semibold tracking-[0.3px]">
            <span style={{ color: "var(--brand-text)" }}>✛</span> AI WRANGLER
          </div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.8px]" style={{ color: "var(--text-secondary)" }}>
            Operator sign in
          </div>
        </div>

        {error ? (
          <div
            className="rounded-lg border px-3 py-2 text-[12px] leading-snug"
            style={{ borderColor: "var(--state-failed)", color: "var(--state-failed)" }}
          >
            {error}
          </div>
        ) : null}

        {login && !login.configured ? (
          <div className="text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            No sign-in method is configured, so the OS is sealed. Set <code>AUTH_SECRET</code> for magic-link
            sign in, then reload.
          </div>
        ) : null}

        {login?.email && sent ? (
          <div className="flex flex-col gap-2">
            <div
              className="rounded-lg border px-3 py-2.5 text-[12.5px] leading-relaxed"
              style={{ borderColor: "color-mix(in srgb, var(--brand) 40%, var(--hairline))" }}
            >
              If <b>{email}</b> can sign in here, a link is on its way. It works once and expires in 15 minutes.
              {health.mail && !health.mail.configured ? (
                <div className="mt-2" style={{ color: "var(--state-blocked)" }}>
                  No mail provider is set on this deploy, so the link was written to the server log instead of
                  sent. Set <code>RESEND_API_KEY</code>.
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => { setSent(false); setError(""); }}
              className="cursor-pointer rounded-lg border py-2 text-center text-xs"
              style={{ background: "var(--btn)", borderColor: "var(--hairline)", color: "var(--text-primary)" }}
            >
              Use a different address
            </button>
          </div>
        ) : null}

        {login?.email && !sent ? (
          <form onSubmit={sendLink} className="flex flex-col gap-2">
            <input
              type="email"
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@aiwrangler.co"
              className="w-full rounded-lg border px-2.5 py-2 text-[13px] outline-none"
              style={{ background: "var(--surface-inset)", borderColor: "var(--hairline)" }}
            />
            <button
              type="submit"
              disabled={busy || !email}
              className="cursor-pointer rounded-lg py-2 text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--brand)" }}
            >
              {busy ? "Sending…" : "Email me a sign-in link"}
            </button>
          </form>
        ) : null}

        {login?.password && !showPassword && login?.email ? (
          <button
            type="button"
            onClick={() => setShowPassword(true)}
            className="cursor-pointer bg-transparent text-left text-[11.5px] underline"
            style={{ color: "var(--text-secondary)" }}
          >
            Use the operator password instead
          </button>
        ) : null}

        {login?.password && (showPassword || !login?.email) ? (
          <form onSubmit={signIn} className="flex flex-col gap-2">
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Operator password"
              className="w-full rounded-lg border px-2.5 py-2 text-[13px] outline-none"
              style={{ background: "var(--surface-inset)", borderColor: "var(--hairline)" }}
            />
            <button
              type="submit"
              disabled={busy || !password}
              className="cursor-pointer rounded-lg py-2 text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--brand)" }}
            >
              {busy ? "Checking…" : "Sign in"}
            </button>
          </form>
        ) : null}

        {login?.github ? (
          <a
            href="/api/auth/operator/github/start"
            className="rounded-lg border py-2 text-center text-xs no-underline"
            style={{ background: "var(--btn)", borderColor: "var(--hairline)", color: "var(--text-primary)" }}
          >
            Sign in with GitHub
          </a>
        ) : null}

        <div className="text-[11.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          This is the agency control plane. Every customer’s repos, tokens and deploys live behind this
          door — there is no public side.
        </div>
      </div>
    </div>
  );
}
