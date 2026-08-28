"use client";

import { useCallback, useEffect, useState } from "react";
import { DeskBar, Dossier, Kv, RollItem } from "@/components/os/Dossier";

type Partner = {
  id: string; name: string; operator: string | null; email: string | null; phone: string | null;
  territory: string | null; tier: string; status: string; customers: number; book: number;
  royaltyPct: number; fee: number; collect: number; note: string | null; since: string | null;
};
type Tier = { id: string; royalty: number; fee: number; exclusive: boolean };

const TONE: Record<string, string> = {
  live: "var(--state-go)", onboarding: "var(--state-thinking)",
  applied: "var(--state-running)", paused: "var(--state-stop)",
};
const money = (n: number) => "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });

/**
 * Franchise licensees: other agencies running our name, playbooks and recipes in
 * their own territory. Not referral contacts — they are the network.
 */
export default function PartnersPage() {
  const [rows, setRows] = useState<Partner[] | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [id, setId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", operator: "", email: "", phone: "", territory: "", tier: "operator" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/partners", { cache: "no-store" });
    if (!res.ok) return;
    const out = await res.json();
    setRows(out.partners ?? []);
    setTiers(out.tiers ?? []);
    setStatuses(out.statuses ?? []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/partners", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out.error || "could not add them");
    setAdding(false);
    setDraft({ name: "", operator: "", email: "", phone: "", territory: "", tier: "operator" });
    await load();
  }

  async function patch(pid: string, body: Record<string, unknown>) {
    setBusy(true);
    await fetch("/api/partners", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: pid, ...body }),
    });
    setBusy(false);
    await load();
  }

  if (!rows) return <div className="p-5 text-[13px]" style={{ color: "var(--text-secondary)" }}>Reading the network…</div>;

  const open = Boolean(id && rows.some((r) => r.id === id));
  const p = rows.find((x) => x.id === id) ?? rows[0] ?? null;
  const live = rows.filter((r) => r.status === "live");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DeskBar>
        <button className="btn-os brand" onClick={() => setAdding((v) => !v)}>{adding ? "Cancel" : "+ New partner"}</button>
        <span className="ml-auto text-[11px] tabular-nums" style={{ color: "var(--text-secondary)" }}>
          {live.length} live · {money(rows.reduce((a, r) => a + r.book, 0))} their book · {money(live.reduce((a, r) => a + r.collect, 0))}/mo to us
        </span>
      </DeskBar>

      {adding ? (
        <form onSubmit={add} className="flex flex-wrap items-end gap-2 border-b px-4 py-3" style={{ borderColor: "var(--hairline)", background: "var(--surface-raised)" }}>
          {([["name", "Their agency"], ["operator", "Who runs it"], ["email", "Email"], ["phone", "Phone"], ["territory", "Territory"]] as const).map(([k, label]) => (
            <label key={k} className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>{label}</span>
              <input autoFocus={k === "name"} value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} className="btn-os min-w-[140px]" />
            </label>
          ))}
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Tier</span>
            <select className="btn-os" value={draft.tier} onChange={(e) => setDraft({ ...draft, tier: e.target.value })}>
              {tiers.map((t) => <option key={t.id} value={t.id}>{t.id} · {t.royalty}%{t.fee ? ` + ${money(t.fee)}/mo` : ""}</option>)}
            </select>
          </label>
          <button className="btn-os brand" type="submit" disabled={busy || !draft.name.trim()}>Add</button>
          {error ? <span className="text-[12px]" style={{ color: "var(--state-stop)" }}>{error}</span> : null}
        </form>
      ) : null}

      <Dossier
        onClose={() => setId(null)}
        list={
          rows.length === 0 ? (
            <div className="p-5 text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              No partners yet. These are other agencies running your name, playbooks and recipes in their own
              territory — one market, one partner.
            </div>
          ) : (
            rows.map((x) => (
              <RollItem
                key={x.id}
                on={open && x.id === p?.id}
                title={x.name}
                meta={`${x.operator ?? "no operator"} · ${x.status} · ${x.territory ?? "no territory"}`}
                onClick={() => setId(x.id)}
              />
            ))
          )
        }
        rail={
          p ? (
            <div className="flex flex-col gap-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Status</div>
              <div className="flex flex-wrap gap-1.5">
                {statuses.map((s) => (
                  <button key={s} className={`btn-os ${p.status === s ? "brand" : ""}`} disabled={busy} onClick={() => patch(p.id, { status: s })}>{s}</button>
                ))}
              </div>
              <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                They bring the market. We license the name, the playbooks and the agent recipes, and take a share of
                what they collect. One market, one partner — the database refuses a second claim on a territory.
              </p>
            </div>
          ) : null
        }
      >
        {open && p ? (
          <>
            <div className="border-b px-4 pt-4 pb-2.5" style={{ borderColor: "var(--hairline)" }}>
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TONE[p.status] }}>{p.status} · {p.tier}</div>
              <h3 className="mt-1 mb-1 text-[24px] leading-tight">{p.name}</h3>
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {[p.operator, p.territory].filter(Boolean).join(" · ") || "no operator or territory yet"}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.phone ? <a className="btn-os brand no-underline" href={`tel:${p.phone}`}>Call</a> : null}
                {p.email ? <a className="btn-os no-underline" href={`mailto:${p.email}`}>Email</a> : null}
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-4">
              <Kv
                rows={[
                  ["Operator", p.operator ?? "—"],
                  ["Territory", p.territory ?? "not agreed"],
                  ["Tier", `${p.tier} · ${p.royaltyPct}% of collected${p.fee ? ` + ${money(p.fee)}/mo` : ""}`],
                  ["Their book", p.customers ? `${p.customers} shops · ${money(p.book)}/mo` : "not reporting yet"],
                  ["We collect", money(p.collect) + "/mo"],
                  ["Signed", p.since ?? "—"],
                ]}
              />
              <div className="mt-4 flex flex-wrap items-end gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Their shops</span>
                  <input type="number" min="0" defaultValue={p.customers} className="btn-os w-[90px] tabular-nums"
                    onBlur={(e) => patch(p.id, { customers: Number(e.target.value) })} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Their book /mo</span>
                  <input type="number" min="0" defaultValue={p.book} className="btn-os w-[120px] tabular-nums"
                    onBlur={(e) => patch(p.id, { book: Number(e.target.value) })} />
                </label>
              </div>
              <p className="mt-3 max-w-[62ch] text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                We see these two numbers and nothing else. Their customers, threads and repos live in their own
                tenant — the same wall as between two of our customers, one level up.
              </p>
            </div>
          </>
        ) : null}
      </Dossier>
    </div>
  );
}
