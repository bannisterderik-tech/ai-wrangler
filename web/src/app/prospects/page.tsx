"use client";

import { useCallback, useEffect, useState } from "react";
import { DeskBar, Dossier, Kv, RollItem } from "@/components/os/Dossier";

type Lead = {
  id: string; company: string; contact: string | null; phone: string | null; email: string | null;
  city: string | null; trade: string | null; source: string | null; stage: string; value: number;
  note: string | null; createdAt: string;
};
const money = (n: number) => "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });

/**
 * Shops we want but have not spoken to. The same pipeline as Leads, filtered to
 * the stage before it starts — engaging one moves it, it does not copy it.
 */
export default function ProspectsPage() {
  const [all, setAll] = useState<Lead[] | null>(null);
  const [id, setId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ company: "", contact: "", phone: "", city: "", trade: "", source: "", value: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/leads", { cache: "no-store" });
    if (res.ok) setAll((await res.json()).leads ?? []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, value: Number(draft.value) || 0, stage: "prospects" }),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out.error || "could not add them");
    setAdding(false);
    setDraft({ company: "", contact: "", phone: "", city: "", trade: "", source: "", value: "" });
    await load();
    setId(out.id);
  }

  async function engage(leadId: string) {
    setBusy(true);
    await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: leadId, stage: "new" }),
    });
    setBusy(false);
    setId(null);
    await load();
  }

  if (!all) return <div className="p-5 text-[13px]" style={{ color: "var(--text-secondary)" }}>Reading the list…</div>;

  const rows = all.filter((l) => l.stage === "prospects");
  const open = Boolean(id && rows.some((l) => l.id === id));
  const p = rows.find((x) => x.id === id) ?? rows[0] ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DeskBar>
        <button className="btn-os brand" onClick={() => setAdding((v) => !v)}>{adding ? "Cancel" : "+ New prospect"}</button>
        <span className="ml-auto text-[11px] tabular-nums" style={{ color: "var(--text-secondary)" }}>
          {rows.length} on the list · {money(rows.reduce((a, x) => a + x.value, 0))} if they all land
        </span>
      </DeskBar>

      {adding ? (
        <form onSubmit={add} className="flex flex-wrap items-end gap-2 border-b px-4 py-3" style={{ borderColor: "var(--hairline)", background: "var(--surface-raised)" }}>
          {([["company", "Company"], ["contact", "Who"], ["phone", "Phone"], ["city", "Market"], ["trade", "Trade"], ["source", "Where you found them"]] as const).map(([k, label]) => (
            <label key={k} className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>{label}</span>
              <input autoFocus={k === "company"} value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} className="btn-os min-w-[130px]" />
            </label>
          ))}
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Worth /mo</span>
            <input type="number" min="0" value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} className="btn-os w-[110px] tabular-nums" />
          </label>
          <button className="btn-os brand" type="submit" disabled={busy || !draft.company.trim()}>Add</button>
          {error ? <span className="text-[12px]" style={{ color: "var(--state-stop)" }}>{error}</span> : null}
        </form>
      ) : null}

      <Dossier
        onClose={() => setId(null)}
        list={
          rows.length === 0 ? (
            <div className="p-5 text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Nobody on the list. A prospect is a shop you want but have not spoken to — add one, and it becomes a
              lead the moment you engage.
            </div>
          ) : (
            rows.map((x) => (
              <RollItem
                key={x.id}
                on={open && x.id === p?.id}
                title={x.company}
                meta={`${[x.city, x.trade].filter(Boolean).join(" · ") || "no detail yet"}${x.value ? ` · ${money(x.value)}/mo` : ""}`}
                onClick={() => setId(x.id)}
              />
            ))
          )
        }
        rail={
          p ? (
            <div className="flex flex-col gap-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Next move</div>
              <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Book the teardown. Show them their own broken funnel on screen — never open a deck.
              </p>
              <button className="btn-os brand" disabled={busy} onClick={() => engage(p.id)}>Engaged — move to Leads</button>
              {p.phone ? <a className="btn-os no-underline text-center" href={`tel:${p.phone}`}>Call {p.contact ?? p.company}</a> : null}
            </div>
          ) : null
        }
      >
        {open && p ? (
          <>
            <div className="border-b px-4 pt-4 pb-2.5" style={{ borderColor: "var(--hairline)" }}>
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--state-running)" }}>prospect</div>
              <h3 className="mt-1 mb-1 text-[24px] leading-tight">{p.company}</h3>
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {[p.contact, p.phone, p.city].filter(Boolean).join(" · ") || "no contact details yet"}
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-4">
              <Kv
                rows={[
                  ["Company", p.company], ["Who", p.contact ?? "—"], ["Phone", p.phone ?? "—"],
                  ["Market", p.city ?? "—"], ["Trade", p.trade ?? "—"], ["Found via", p.source ?? "—"],
                  ["Worth", p.value ? `${money(p.value)}/mo` : "not sized"],
                ]}
              />
            </div>
          </>
        ) : null}
      </Dossier>
    </div>
  );
}
