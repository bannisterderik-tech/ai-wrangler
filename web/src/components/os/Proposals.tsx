"use client";

import { useCallback, useEffect, useState } from "react";

type Item = { name: string; detail: string; cadence: string; qty: number; unitCents: number };
type Summary = {
  id: string; title: string; status: string; currency: string;
  onceCents: number; monthlyCents: number; depositCents: number; dueTodayCents: number;
  sentAt: string | null; viewedAt: string | null; customerId: string | null;
};
type Detail = {
  proposal: { id: string; title: string; summary: string | null; terms: string | null; status: string; currency: string; depositKind: string; depositPct: number; depositCents: number };
  items: { name: string; detail: string | null; cadence: string; qty: number; unitCents: number }[];
  signature: { typedName: string; ip: string | null; signedAt: string; documentHash: string } | null;
  totals: { onceCents: number; monthlyCents: number; depositCents: number; dueTodayCents: number };
  link: string | null;
  editable: boolean;
  document: string;
};

const money = (c: number, cur = "usd") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: cur.toUpperCase() }).format(c / 100);
const dollars = (c: number) => (c / 100).toFixed(2);

const TONE: Record<string, string> = {
  draft: "var(--text-secondary)", sent: "var(--state-running)", viewed: "var(--state-thinking)",
  signed: "var(--state-blocked)", paid: "var(--state-go)", declined: "var(--state-stop)", void: "var(--text-secondary)",
};

/**
 * Build a proposal on a lead, send it, and watch what happens to it.
 *
 * A draft is editable; anything sent is not. Editing a sent proposal would
 * change what somebody is being asked to agree to — or what they already agreed
 * to — while the link in their inbox stays the same.
 */
export function Proposals({ leadId, company }: { leadId: string; company: string }) {
  const [list, setList] = useState<Summary[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/proposals?leadId=${leadId}`, { cache: "no-store" });
    if (res.ok) setList((await res.json()).proposals ?? []);
  }, [leadId]);

  const loadOne = useCallback(async (id: string) => {
    const res = await fetch(`/api/proposals/${id}`, { cache: "no-store" });
    if (res.ok) setDetail(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (openId) loadOne(openId);
    else setDetail(null);
  }, [openId, loadOne]);

  async function start() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId,
        title: `Proposal for ${company}`,
        terms: "50% deposit to start. Balance on launch. The retainer is month to month; either side can stop it with 30 days notice.",
      }),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out.error || "could not start it");
    await load();
    setOpenId(out.id);
  }

  async function patch(body: Record<string, unknown>) {
    if (!openId) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/proposals/${openId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out.error || "that did not work");
    await Promise.all([load(), loadOne(openId)]);
  }

  if (!list) return <p className="p-4 text-[13px]" style={{ color: "var(--text-secondary)" }}>Reading proposals…</p>;

  if (openId && detail) {
    return (
      <Editor
        detail={detail}
        busy={busy}
        error={error}
        copied={copied}
        onCopy={async () => {
          if (!detail.link) return;
          await navigator.clipboard.writeText(detail.link).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }}
        onBack={() => setOpenId(null)}
        onPatch={patch}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <button className="btn-os brand" disabled={busy} onClick={start}>+ New proposal</button>
        <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
          Price it, send it, they sign and pay the deposit. Paying is what makes them a customer.
        </span>
      </div>
      {error ? <p className="text-[12.5px]" style={{ color: "var(--state-stop)" }}>{error}</p> : null}
      {list.length === 0 ? (
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Nothing sent to {company} yet.
        </p>
      ) : (
        list.map((p) => (
          <button
            key={p.id}
            onClick={() => setOpenId(p.id)}
            className="flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left"
            style={{ borderColor: "var(--hairline)", background: "var(--surface-raised)" }}
          >
            <div className="min-w-0">
              <div className="truncate text-[13.5px] font-semibold">{p.title}</div>
              <div className="text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
                {money(p.onceCents, p.currency)} once
                {p.monthlyCents ? ` · ${money(p.monthlyCents, p.currency)}/mo` : ""}
                {p.dueTodayCents ? ` · ${money(p.dueTodayCents, p.currency)} deposit` : ""}
                {p.viewedAt ? " · opened" : p.sentAt ? " · sent" : ""}
              </div>
            </div>
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider" style={{ color: TONE[p.status] }}>
              {p.status}
            </span>
          </button>
        ))
      )}
    </div>
  );
}

function Editor({
  detail, busy, error, copied, onBack, onPatch, onCopy,
}: {
  detail: Detail; busy: boolean; error: string; copied: boolean;
  onBack: () => void; onPatch: (b: Record<string, unknown>) => void; onCopy: () => void;
}) {
  const p = detail.proposal;
  const [items, setItems] = useState<Item[]>(
    detail.items.map((i) => ({ ...i, detail: i.detail ?? "" })),
  );
  const [title, setTitle] = useState(p.title);
  const [summary, setSummary] = useState(p.summary ?? "");
  const [terms, setTerms] = useState(p.terms ?? "");
  const [pct, setPct] = useState(String(p.depositPct));

  const editable = detail.editable;
  const once = items.filter((i) => i.cadence !== "monthly").reduce((a, i) => a + i.qty * i.unitCents, 0);
  const monthly = items.filter((i) => i.cadence === "monthly").reduce((a, i) => a + i.qty * i.unitCents, 0);
  const deposit = Math.round((once * Math.min(100, Math.max(0, Number(pct) || 0))) / 100);

  const set = (n: number, patch: Partial<Item>) =>
    setItems(items.map((i, x) => (x === n ? { ...i, ...patch } : i)));

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn-os" onClick={onBack}>← All proposals</button>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TONE[p.status] }}>{p.status}</span>
        {detail.link ? (
          <button className="btn-os" onClick={onCopy}>{copied ? "Copied ✓" : "Copy link"}</button>
        ) : null}
        {detail.link ? (
          <a className="btn-os no-underline" href={detail.link} target="_blank" rel="noreferrer">Open as they see it</a>
        ) : null}
      </div>

      {detail.signature ? (
        <div className="rounded-lg p-3" style={{ background: "var(--surface-raised)" }}>
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
            Signed
          </div>
          <div className="mt-1 text-[13.5px]">
            <strong>{detail.signature.typedName}</strong> · {new Date(detail.signature.signedAt).toLocaleString()}
            {detail.signature.ip ? ` · from ${detail.signature.ip}` : ""}
          </div>
          <div className="mt-1 font-mono text-[11px]" style={{ color: "var(--text-secondary)" }}>
            document {detail.signature.documentHash.slice(0, 16)}…
          </div>
        </div>
      ) : null}

      {!editable ? (
        <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          This one is out. It cannot be edited — the link in their inbox points at exactly what is written here.
          To change it, void it and write another.
        </p>
      ) : null}

      <Field label="Title">
        <input className="btn-os w-full" disabled={!editable} value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="The pitch, in their words">
        <textarea
          className="btn-os min-h-[70px] w-full" disabled={!editable}
          value={summary} onChange={(e) => setSummary(e.target.value)}
          placeholder="A site that loads fast and a receptionist that never misses a call."
        />
      </Field>

      <div>
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
          What they get
        </div>
        <div className="flex flex-col gap-2">
          {items.map((i, n) => (
            <div key={n} className="flex flex-wrap items-end gap-1.5 rounded-lg border p-2" style={{ borderColor: "var(--hairline)" }}>
              <input className="btn-os min-w-[140px] flex-1" disabled={!editable} placeholder="Site rebuild"
                value={i.name} onChange={(e) => set(n, { name: e.target.value })} />
              <input className="btn-os min-w-[140px] flex-1" disabled={!editable} placeholder="8 pages, booking flow"
                value={i.detail} onChange={(e) => set(n, { detail: e.target.value })} />
              <select className="btn-os" disabled={!editable} value={i.cadence} onChange={(e) => set(n, { cadence: e.target.value })}>
                <option value="once">one time</option>
                <option value="monthly">monthly</option>
              </select>
              <input className="btn-os w-[92px] tabular-nums" disabled={!editable} type="number" min="0" step="0.01"
                value={dollars(i.unitCents)}
                onChange={(e) => set(n, { unitCents: Math.round((Number(e.target.value) || 0) * 100) })} />
              {editable ? (
                <button className="btn-os" onClick={() => setItems(items.filter((_, x) => x !== n))}>✕</button>
              ) : null}
            </div>
          ))}
        </div>
        {editable ? (
          <button
            className="btn-os mt-2"
            onClick={() => setItems([...items, { name: "", detail: "", cadence: "once", qty: 1, unitCents: 0 }])}
          >
            + Line
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg p-3" style={{ background: "var(--surface-raised)" }}>
        <Field label="Deposit %">
          <input className="btn-os w-[80px] tabular-nums" disabled={!editable} type="number" min="0" max="100"
            value={pct} onChange={(e) => setPct(e.target.value)} />
        </Field>
        <div className="text-[13px] leading-relaxed">
          <div>{money(once, p.currency)} one time · {money(monthly, p.currency)}/mo</div>
          <div className="font-semibold">Due on signing: {money(deposit, p.currency)}</div>
          <div className="text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
            Taken on the one-time work only — a deposit on a retainer bills for months nobody has worked.
          </div>
        </div>
      </div>

      <Field label="Terms">
        <textarea className="btn-os min-h-[70px] w-full" disabled={!editable}
          value={terms} onChange={(e) => setTerms(e.target.value)} />
      </Field>

      {error ? <p className="text-[12.5px]" style={{ color: "var(--state-stop)" }}>{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        {editable ? (
          <>
            <button className="btn-os" disabled={busy}
              onClick={() => onPatch({ title, summary, terms, depositPct: Number(pct) || 0, items })}>
              Save
            </button>
            <button className="btn-os brand" disabled={busy || !items.length || once + monthly <= 0}
              onClick={async () => {
                onPatch({ title, summary, terms, depositPct: Number(pct) || 0, items });
                setTimeout(() => onPatch({ action: "send" }), 250);
              }}>
              Save and send
            </button>
          </>
        ) : null}
        {p.status !== "paid" && p.status !== "void" ? (
          <button className="btn-os stop" disabled={busy} onClick={() => onPatch({ action: "void" })}>Void it</button>
        ) : null}
      </div>
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
