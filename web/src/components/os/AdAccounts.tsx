"use client";

import { useCallback, useEffect, useState } from "react";

type Binding = { customerId: string; customerName: string; accountId: string; adAccountId: string; name: string };
type Customer = { id: string; name: string; bound: boolean };
type Found = { id: string; name: string; currency?: string };

/**
 * Pointing a customer at their Google Ads account.
 *
 * Every Zernio call is scoped to an account, so nothing on the Ads screen works
 * until this exists. It is deliberately a manual act rather than a name match:
 * an ad account is a live payment method, and binding the wrong one spends the
 * wrong shop's money. The database enforces one account, one customer — the
 * same unique index that keeps two customers off one repository.
 */
export function AdAccounts() {
  const [bound, setBound] = useState<Binding[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [connected, setConnected] = useState(false);
  const [draft, setDraft] = useState({ customerId: "", accountId: "", adAccountId: "", name: "" });
  const [found, setFound] = useState<Found[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/ads/accounts", { cache: "no-store" });
    if (!res.ok) return;
    const d = await res.json();
    setBound(d.bound ?? []);
    setCustomers(d.customers ?? []);
    setConnected(Boolean(d.connected));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  /** Ask Zernio which Google accounts that connection can actually see. */
  async function discover() {
    if (!draft.accountId.trim()) return;
    setBusy(true);
    setError("");
    setFound([]);
    const res = await fetch(`/api/ads/accounts?discover=${encodeURIComponent(draft.accountId.trim())}`, { cache: "no-store" });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (d.problem) return setError(d.problem);
    setFound(d.available ?? []);
    if (!d.available?.length) setError("Zernio returned no ad accounts for that connection.");
  }

  async function bind() {
    setBusy(true);
    setError("");
    setNote("");
    const res = await fetch("/api/ads/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out.error || "could not bind that");
    setNote("Bound. Their Google numbers are on Ads → Live on Google.");
    setDraft({ customerId: "", accountId: "", adAccountId: "", name: "" });
    setFound([]);
    await load();
  }

  async function unbind(customerId: string) {
    if (!confirm("Unbind that ad account? Their Google screens go empty until one is bound again.")) return;
    setBusy(true);
    await fetch(`/api/ads/accounts?customerId=${encodeURIComponent(customerId)}`, { method: "DELETE" });
    setBusy(false);
    await load();
  }

  return (
    <div className="rounded-[14px] p-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}>
      <div className="text-[10px] uppercase tracking-[0.6px]" style={{ color: "var(--text-secondary)" }}>
        Ad accounts
      </div>
      <p className="mt-1.5 mb-3 max-w-[74ch] text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        Which Google Ads account belongs to which customer. One account, one customer — enforced by the
        database, not by this screen. {connected ? "" : "Zernio has no key set, so nothing can be discovered or read yet."}
      </p>

      {bound.length ? (
        <div className="mb-3 flex flex-col gap-1.5">
          {bound.map((b) => (
            <div key={b.customerId} className="flex flex-wrap items-baseline gap-2 border-b pb-1.5 text-[12.5px]" style={{ borderColor: "var(--hairline)" }}>
              <span className="font-semibold">{b.customerName}</span>
              <span className="font-mono text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
                {b.name} · Google {b.adAccountId} · Zernio {b.accountId}
              </span>
              <button className="btn-os ml-auto" disabled={busy} onClick={() => unbind(b.customerId)}>Unbind</button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-2">
        <Field label="Customer">
          <select className="btn-os min-w-[160px]" value={draft.customerId} onChange={(e) => setDraft({ ...draft, customerId: e.target.value })}>
            <option value="">Pick one…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.bound ? " (rebind)" : ""}</option>
            ))}
          </select>
        </Field>
        <Field label="Zernio account id">
          <input className="btn-os w-[180px] font-mono text-[12px]" value={draft.accountId}
            onChange={(e) => setDraft({ ...draft, accountId: e.target.value })} placeholder="the connected account" />
        </Field>
        <button className="btn-os" disabled={busy || !draft.accountId.trim() || !connected} onClick={discover}>
          {busy ? "Asking…" : "Find its ad accounts"}
        </button>
      </div>

      {found.length ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {found.map((a) => (
            <button key={a.id} className={`btn-os ${draft.adAccountId === a.id ? "brand" : ""}`}
              onClick={() => setDraft({ ...draft, adAccountId: a.id, name: a.name })}>
              {a.name} · {a.id}{a.currency ? ` · ${a.currency}` : ""}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-2.5 flex flex-wrap items-end gap-2">
        <Field label="Google Ads customer id">
          <input className="btn-os w-[180px] font-mono text-[12px]" value={draft.adAccountId}
            onChange={(e) => setDraft({ ...draft, adAccountId: e.target.value })} placeholder="no dashes" />
        </Field>
        <Field label="Call it">
          <input className="btn-os w-[180px]" value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Bell Plumbing — Google" />
        </Field>
        <button className="btn-os brand" disabled={busy || !draft.customerId || !draft.accountId.trim() || !draft.adAccountId.trim()} onClick={bind}>
          Bind it
        </button>
      </div>

      {note ? <p className="mt-2 text-[12.5px]" style={{ color: "var(--state-go)" }}>{note}</p> : null}
      {error ? <p className="mt-2 text-[12.5px]" style={{ color: "var(--state-stop)" }}>{error}</p> : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
