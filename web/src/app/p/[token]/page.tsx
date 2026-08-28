"use client";

import { use, useCallback, useEffect, useState } from "react";

type Item = { name: string; detail: string | null; cadence: string; qty: number; unitCents: number };
type Proposal = {
  id: string; title: string; summary: string | null; terms: string | null; status: string;
  currency: string; company: string | null; contact: string | null; email: string | null;
  items: Item[]; onceCents: number; monthlyCents: number; depositCents: number; dueTodayCents: number;
  document: string; signed: { name: string; at: string } | null; payable: boolean;
};

const money = (c: number, cur = "usd") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: cur.toUpperCase() }).format(c / 100);

/**
 * What the client sees. No account, no nav, no product — a document, a price,
 * and the two things they might want to do about it.
 */
export default function ProposalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [p, setP] = useState<Proposal | null>(null);
  const [error, setError] = useState("");
  const [gone, setGone] = useState("");
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/p/${token}`, { cache: "no-store" });
    if (res.status === 410) return setGone("This proposal has expired. Ask us for a fresh one.");
    if (!res.ok) return setGone("This proposal is no longer available.");
    const data = await res.json();
    setP(data);
    setName((n) => n || data.contact || "");
  }, [token]);
  useEffect(() => {
    load();
  }, [load]);

  async function act(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/p/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out.error || "That did not work.");
    if (out.url) {
      window.location.href = out.url;
      return;
    }
    await load();
  }

  if (gone) return <Frame><p className="text-[15px]">{gone}</p></Frame>;
  if (!p) return <Frame><p className="text-[15px] opacity-60">Opening…</p></Frame>;

  const paid = p.status === "paid";
  const signed = Boolean(p.signed);

  return (
    <Frame>
      <header className="mb-8">
        <div className="brand-mark mb-6" role="img" aria-label="AI Wrangler" />
        <h1 className="text-[30px] leading-tight font-semibold" style={{ textWrap: "balance" }}>{p.title}</h1>
        {p.company ? <p className="mt-2 text-[15px] opacity-70">Prepared for {p.company}</p> : null}
      </header>

      {p.summary ? <p className="mb-8 max-w-[62ch] text-[15.5px] leading-relaxed">{p.summary}</p> : null}

      <section className="mb-8">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[1.2px] opacity-60">What is included</h2>
        <ul className="flex flex-col gap-3">
          {p.items.map((i, n) => (
            <li key={n} className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-3" style={{ borderColor: "var(--hairline)" }}>
              <div className="min-w-0">
                <div className="text-[15px] font-medium">{i.name}</div>
                {i.detail ? <div className="text-[13.5px] leading-relaxed opacity-70">{i.detail}</div> : null}
              </div>
              <div className="shrink-0 tabular-nums text-[15px]">
                {money(i.qty * i.unitCents, p.currency)}
                {i.cadence === "monthly" ? <span className="opacity-60">/mo</span> : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 rounded-xl p-5" style={{ background: "var(--surface-raised)" }}>
        <Row label="One time" value={money(p.onceCents, p.currency)} />
        {p.monthlyCents ? <Row label="Monthly" value={`${money(p.monthlyCents, p.currency)}/mo`} /> : null}
        <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--hairline)" }}>
          <Row label="Due today" value={money(p.dueTodayCents, p.currency)} strong />
        </div>
      </section>

      {p.terms ? (
        <section className="mb-8">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[1.2px] opacity-60">Terms</h2>
          <p className="max-w-[62ch] whitespace-pre-wrap text-[14px] leading-relaxed opacity-85">{p.terms}</p>
        </section>
      ) : null}

      {paid ? (
        <Done title="You're all set.">
          Signed by {p.signed?.name} and the deposit is paid. We will be in touch today to get started.
        </Done>
      ) : signed ? (
        <section className="rounded-xl p-5" style={{ background: "var(--surface-raised)" }}>
          <p className="mb-4 text-[14.5px] leading-relaxed">
            Signed by <strong>{p.signed?.name}</strong>. One thing left: the {money(p.dueTodayCents, p.currency)} deposit.
          </p>
          {p.payable ? (
            <button className="btn-os brand" disabled={busy} onClick={() => act({ action: "pay" })}>
              {busy ? "Opening…" : `Pay ${money(p.dueTodayCents, p.currency)} deposit`}
            </button>
          ) : (
            <p className="text-[14px] opacity-70">We will send an invoice for the deposit.</p>
          )}
          {error ? <p className="mt-3 text-[13.5px]" style={{ color: "var(--state-stop)" }}>{error}</p> : null}
        </section>
      ) : (
        <section className="rounded-xl p-5" style={{ background: "var(--surface-raised)" }}>
          <h2 className="mb-1 text-[17px] font-semibold">Agree to this proposal</h2>
          <p className="mb-4 max-w-[58ch] text-[13.5px] leading-relaxed opacity-70">
            Typing your name below signs this agreement. We record your name, the time, and the
            network address you sign from, along with a fingerprint of this exact document.
          </p>
          <label className="mb-3 flex flex-col gap-1.5">
            <span className="text-[11px] uppercase tracking-wider opacity-60">Your full name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="btn-os max-w-[320px]"
              placeholder="Jane Bell"
            />
          </label>
          <label className="mb-4 flex items-start gap-2.5 text-[14px] leading-relaxed">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1" />
            <span>I have read this proposal and I agree to it on behalf of {p.company ?? "my business"}.</span>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="btn-os brand"
              disabled={busy || name.trim().length < 2 || !agreed}
              onClick={() => act({ action: "sign", name, agreed, email: p.email })}
            >
              {busy ? "Signing…" : "Sign and continue"}
            </button>
            <button className="btn-os" disabled={busy} onClick={() => act({ action: "decline" })}>
              Not right now
            </button>
          </div>
          {error ? <p className="mt-3 text-[13.5px]" style={{ color: "var(--state-stop)" }}>{error}</p> : null}
        </section>
      )}

      <footer className="mt-10 text-[12.5px] opacity-50">AI Wrangler · questions? Just reply to the email this came from.</footer>
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[100dvh] w-full overflow-y-auto" style={{ background: "var(--surface)", color: "var(--text)" }}>
      <main className="mx-auto w-full max-w-[720px] px-5 py-12">{children}</main>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className={strong ? "text-[15px] font-semibold" : "text-[14px] opacity-70"}>{label}</span>
      <span className={`tabular-nums ${strong ? "text-[20px] font-semibold" : "text-[15px]"}`}>{value}</span>
    </div>
  );
}

function Done({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl p-5" style={{ background: "var(--surface-raised)" }}>
      <h2 className="mb-1 text-[17px] font-semibold" style={{ color: "var(--state-go)" }}>{title}</h2>
      <p className="max-w-[58ch] text-[14.5px] leading-relaxed">{children}</p>
    </section>
  );
}
