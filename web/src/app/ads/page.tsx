"use client";

import { useCallback, useEffect, useState } from "react";
import { DeskBar } from "@/components/os/Dossier";
import { GoogleAds } from "@/components/os/GoogleAds";

type Campaign = {
  id: string; customerId: string; customer: string; name: string; platform: string;
  status: string; goal: string | null; spend: number; leads: number; dailyCap: number; cpl: number | null;
};
const TONE: Record<string, string> = {
  active: "var(--state-go)", paused: "var(--text-secondary)",
  pending_review: "var(--state-blocked)", draft: "var(--state-thinking)",
};
const money = (n: number) => "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });

/** Campaigns on a customer's own ad account. Their card, their spend, at cost. */
export default function AdsPage() {
  const [rows, setRows] = useState<Campaign[] | null>(null);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", customerId: "", platform: "google", goal: "", dailyCap: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [side, setSide] = useState<"plan" | "google">("plan");

  const load = useCallback(async () => {
    const res = await fetch("/api/ads", { cache: "no-store" });
    if (!res.ok) return;
    const out = await res.json();
    setRows(out.campaigns ?? []);
    setPlatforms(out.platforms ?? []);
    setCustomers(out.customers ?? []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/ads", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, dailyCap: Number(draft.dailyCap) }),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out.error || "could not draft it");
    setAdding(false);
    setDraft({ name: "", customerId: "", platform: "google", goal: "", dailyCap: "" });
    await load();
  }

  async function setStatus(id: string, status: string) {
    setBusy(true);
    await fetch("/api/ads", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }),
    });
    setBusy(false);
    await load();
  }

  if (!rows) return <div className="p-5 text-[13px]" style={{ color: "var(--text-secondary)" }}>Reading the campaigns…</div>;

  const spend = rows.reduce((a, r) => a + r.spend, 0);
  const leads = rows.reduce((a, r) => a + r.leads, 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DeskBar>
        {/*
          Two different things, kept apart on purpose. The plan is what we agreed
          to spend; Google is what actually happened. Merging them into one table
          would make a number somebody typed look like a number Google reported.
        */}
        <button className={`btn-os ${side === "plan" ? "brand" : ""}`} onClick={() => setSide("plan")}>The plan</button>
        <button className={`btn-os ${side === "google" ? "brand" : ""}`} onClick={() => setSide("google")}>Live on Google</button>
        {side === "plan" ? (
          <button className="btn-os" onClick={() => setAdding((v) => !v)}>{adding ? "Cancel" : "+ New campaign"}</button>
        ) : null}
        {side === "plan" ? (
          <span className="ml-auto text-[11px] tabular-nums" style={{ color: "var(--text-secondary)" }}>
            {money(spend)} planned · {leads} leads{leads ? ` · ${money(Math.round(spend / leads))} per lead` : ""}
          </span>
        ) : null}
      </DeskBar>

      {side === "google" ? <GoogleAds /> : null}

      {side === "plan" && adding ? (
        <form onSubmit={add} className="flex flex-wrap items-end gap-2 border-b px-4 py-3" style={{ borderColor: "var(--hairline)", background: "var(--surface-raised)" }}>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Campaign</span>
            <input autoFocus value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="btn-os min-w-[200px]" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>For</span>
            <select className="btn-os" value={draft.customerId} onChange={(e) => setDraft({ ...draft, customerId: e.target.value })}>
              <option value="">Pick a customer…</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Where</span>
            <select className="btn-os" value={draft.platform} onChange={(e) => setDraft({ ...draft, platform: e.target.value })}>
              {platforms.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Daily cap</span>
            <input type="number" min="1" value={draft.dailyCap} onChange={(e) => setDraft({ ...draft, dailyCap: e.target.value })} className="btn-os w-[100px] tabular-nums" />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Goal</span>
            <input value={draft.goal} onChange={(e) => setDraft({ ...draft, goal: e.target.value })} placeholder="calls under $50" className="btn-os min-w-[180px]" />
          </label>
          <button className="btn-os brand" type="submit" disabled={busy || !draft.name.trim() || !draft.customerId}>Draft it</button>
          {error ? <span className="text-[12px]" style={{ color: "var(--state-stop)" }}>{error}</span> : null}
        </form>
      ) : null}

      {side === "plan" ? (
      <div className="min-h-0 flex-1 overflow-auto">
        {rows.length === 0 ? (
          <div className="p-5 text-[13.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            No campaigns. These run on the customer&apos;s own ad account with their card — we pass the spend
            through at cost and never hold it. A new one is drafted, never live: turning on spend is a decision.
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                {["Campaign", "Customer", "Where", "Status", "Cap/day", "Spend", "Leads", "Per lead", ""].map((h) => (
                  <th key={h} className="sticky top-0 border-b px-3 py-2" style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-b" style={{ borderColor: "var(--hairline)" }}>
                  <td className="px-3 py-2.5"><b>{a.name}</b>{a.goal ? <div className="text-[11.5px]" style={{ color: "var(--text-secondary)" }}>{a.goal}</div> : null}</td>
                  <td className="px-3 py-2.5">{a.customer}</td>
                  <td className="px-3 py-2.5">{a.platform}</td>
                  <td className="px-3 py-2.5" style={{ color: TONE[a.status] }}>{a.status.replace("_", " ")}</td>
                  <td className="px-3 py-2.5 tabular-nums">{money(a.dailyCap)}</td>
                  <td className="px-3 py-2.5 tabular-nums">{money(a.spend)}</td>
                  <td className="px-3 py-2.5 tabular-nums">{a.leads}</td>
                  <td className="px-3 py-2.5 tabular-nums">{a.cpl != null ? money(a.cpl) : "—"}</td>
                  <td className="px-3 py-2.5">
                    {a.status === "active" ? (
                      <button className="btn-os" disabled={busy} onClick={() => setStatus(a.id, "paused")}>Pause</button>
                    ) : (
                      <button className="btn-os brand" disabled={busy} onClick={() => setStatus(a.id, "active")}>
                        {a.status === "pending_review" ? "Approve & start" : "Start"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      ) : null}
    </div>
  );
}
