"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DeskBar, Dossier, Kv, RollItem, Tabs } from "@/components/os/Dossier";
import { Proposals } from "@/components/os/Proposals";

type Lead = {
  id: string; company: string; contact: string | null; phone: string | null; email: string | null;
  city: string | null; trade: string | null; source: string | null; stage: string; value: number;
  note: string | null; createdAt: string;
};

const TONE: Record<string, string> = {
  new: "var(--state-running)", talking: "var(--state-thinking)", proposal: "var(--state-blocked)",
  won: "var(--state-go)", lost: "var(--text-secondary)",
};
const money = (n: number) => "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });

/**
 * The agency's own pipeline: shops buying web and technology from us. Not a
 * customer's callers — that is their CRM, at /client, and a different table.
 */
export default function LeadsPage() {
  const [stages, setStages] = useState<string[]>([]);
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [id, setId] = useState<string | null>(null);
  const [stage, setStage] = useState("all");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"overview" | "proposals">("overview");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ company: "", contact: "", phone: "", email: "", city: "", trade: "", source: "", value: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/leads", { cache: "no-store" });
    if (!res.ok) return;
    const out = await res.json();
    setStages(out.stages ?? []);
    setLeads(out.leads ?? []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    let r = leads ?? [];
    if (stage !== "all") r = r.filter((l) => l.stage === stage);
    const qq = q.trim().toLowerCase();
    if (qq) r = r.filter((l) => [l.company, l.contact, l.city, l.trade, l.note].join(" ").toLowerCase().includes(qq));
    return r;
  }, [leads, stage, q]);

  const open = Boolean(id && shown.some((l) => l.id === id));
  const l = shown.find((x) => x.id === id) ?? shown[0] ?? null;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, value: Number(draft.value) || 0 }),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out.error || "could not add them");
    setAdding(false);
    setDraft({ company: "", contact: "", phone: "", email: "", city: "", trade: "", source: "", value: "" });
    await load();
    setId(out.id);
  }

  async function move(leadId: string, to: string) {
    setBusy(true);
    await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: leadId, stage: to }),
    });
    setBusy(false);
    await load();
  }

  if (!leads) return <div className="p-5 text-[13px]" style={{ color: "var(--text-secondary)" }}>Reading the pipeline…</div>;

  const bar = (
    <DeskBar>
      {["all", ...stages].map((s) => (
        <button key={s} className={`btn-os ${stage === s ? "brand" : ""}`} onClick={() => { setStage(s); setId(null); }}>
          {s === "all" ? "Everyone" : s}{" "}
          <span className="tabular-nums opacity-70">
            {s === "all" ? leads.length : leads.filter((x) => x.stage === s).length}
          </span>
        </button>
      ))}
      <input className="btn-os min-w-[180px]" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
      <button className="btn-os brand" onClick={() => setAdding((v) => !v)}>{adding ? "Cancel" : "+ New lead"}</button>
      <span className="ml-auto text-[11px] tabular-nums" style={{ color: "var(--text-secondary)" }}>
        {money(leads.filter((x) => x.stage !== "won" && x.stage !== "lost").reduce((a, x) => a + x.value, 0))} in play
      </span>
    </DeskBar>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {bar}
      {adding ? (
        <form onSubmit={add} className="flex flex-wrap items-end gap-2 border-b px-4 py-3" style={{ borderColor: "var(--hairline)", background: "var(--surface-raised)" }}>
          {([["company", "Company"], ["contact", "Who"], ["phone", "Phone"], ["city", "Market"], ["trade", "Trade"], ["source", "How they found us"]] as const).map(([k, label]) => (
            <label key={k} className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>{label}</span>
              <input
                autoFocus={k === "company"}
                value={draft[k]}
                onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                className="btn-os min-w-[130px]"
              />
            </label>
          ))}
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Retainer /mo</span>
            <input type="number" min="0" value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} className="btn-os w-[110px] tabular-nums" />
          </label>
          <button className="btn-os brand" type="submit" disabled={busy || !draft.company.trim()}>Add</button>
          {error ? <span className="text-[12px]" style={{ color: "var(--state-stop)" }}>{error}</span> : null}
        </form>
      ) : null}

      <Dossier
        onClose={() => setId(null)}
        list={
          shown.length === 0 ? (
            <div className="p-5 text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {leads.length === 0
                ? "No leads yet. These are shops buying a site and a lead system from you — add the first one."
                : "Nothing matches that filter."}
            </div>
          ) : (
            shown.map((x) => (
              <RollItem
                key={x.id}
                on={open && x.id === l?.id}
                title={x.company}
                meta={`${[x.contact, x.city].filter(Boolean).join(" · ") || "no contact yet"} · ${x.stage}${x.value ? ` · ${money(x.value)}/mo` : ""}`}
                onClick={() => { setId(x.id); setTab("overview"); }}
              />
            ))
          )
        }
        rail={
          l ? (
            <div className="flex flex-col gap-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Move it</div>
              <div className="flex flex-wrap gap-1.5">
                {stages.map((s) => (
                  <button key={s} className={`btn-os ${l.stage === s ? "brand" : ""}`} disabled={busy} onClick={() => move(l.id, s)}>{s}</button>
                ))}
              </div>
              <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Won a deal? Add them as a customer on Customers — that is what binds a repo and lets an agent work for them.
              </p>
            </div>
          ) : null
        }
      >
        {open && l ? (
          <>
            <div className="border-b px-4 pt-4 pb-2.5" style={{ borderColor: "var(--hairline)" }}>
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TONE[l.stage] }}>{l.stage}</div>
              <h3 className="mt-1 mb-1 text-[24px] leading-tight">{l.company}</h3>
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {[l.contact, l.phone, l.city].filter(Boolean).join(" · ") || "no contact details yet"}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {l.phone ? <a className="btn-os brand no-underline" href={`tel:${l.phone}`}>Call</a> : null}
                {l.phone ? <a className="btn-os no-underline" href={`sms:${l.phone}`}>Text</a> : null}
                {l.email ? <a className="btn-os no-underline" href={`mailto:${l.email}`}>Email</a> : null}
              </div>
            </div>
            <Tabs
              tabs={[["overview", "Overview"], ["proposals", "Proposals"]]}
              tab={tab}
              onTab={(t) => setTab(t as "overview" | "proposals")}
            />
            <div className="min-h-0 flex-1 overflow-auto">
              {tab === "proposals" ? (
                <Proposals leadId={l.id} company={l.company} />
              ) : (
                <div className="p-4">
              <Kv
                rows={[
                  ["Company", l.company],
                  ["Who", l.contact ?? "—"],
                  ["Phone", l.phone ?? "—"],
                  ["Email", l.email ?? "—"],
                  ["Market", l.city ?? "—"],
                  ["Trade", l.trade ?? "—"],
                  ["Source", l.source ?? "—"],
                  ["Retainer", l.value ? `${money(l.value)}/mo` : "not priced"],
                  ["Added", new Date(l.createdAt).toLocaleDateString()],
                ]}
              />
              {l.note ? <p className="mt-4 max-w-[62ch] text-[13.5px] leading-relaxed">{l.note}</p> : null}
                </div>
              )}
            </div>
          </>
        ) : null}
      </Dossier>
    </div>
  );
}
