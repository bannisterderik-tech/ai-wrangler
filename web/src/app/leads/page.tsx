"use client";
import { isOpen, stage as stageOf, STAGES } from "@/lib/stages";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DeskBar, Dossier, Kv, RollItem, Tabs } from "@/components/os/Dossier";
import { Proposals } from "@/components/os/Proposals";
import { LeadBoard } from "@/components/os/LeadBoard";
import { ImportDeals } from "@/components/os/ImportDeals";

type Lead = {
  id: string; company: string; contact: string | null; phone: string | null; email: string | null;
  city: string | null; trade: string | null; source: string | null; stage: string; value: number;
  note: string | null; createdAt: string;
};

const money = (n: number) => "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });

const SORTS = {
  newest: { label: "Newest", by: (a: Lead, b: Lead) => +new Date(b.createdAt) - +new Date(a.createdAt) },
  value: { label: "Biggest", by: (a: Lead, b: Lead) => b.value - a.value },
  company: { label: "A–Z", by: (a: Lead, b: Lead) => a.company.localeCompare(b.company) },
  stage: {
    label: "Stage",
    // Pipeline order, not alphabetical — "Won" does not belong between
    // "Prospects" and "Offer Sent".
    by: (a: Lead, b: Lead) =>
      STAGES.findIndex((s) => s.id === a.stage) - STAGES.findIndex((s) => s.id === b.stage) || b.value - a.value,
  },
} as const;
type SortKey = keyof typeof SORTS;

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
  const [importing, setImporting] = useState(false);
  const [draft, setDraft] = useState({ company: "", contact: "", phone: "", email: "", city: "", trade: "", source: "", value: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [view, setView] = useState<"list" | "board">("list");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [said, setSaid] = useState("");
  const lastPick = useRef<string | null>(null);

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
    return [...r].sort(SORTS[sort].by);
  }, [leads, stage, q, sort]);

  // A pick only means anything while the row is on screen. Narrowing the filter
  // and then acting on rows you can no longer see is how the wrong thing gets
  // converted.
  const chosen = useMemo(() => shown.filter((x) => picked.has(x.id)), [shown, picked]);

  /** Click picks one; shift-click picks the run since the last one, as lists do. */
  const pick = useCallback(
    (leadId: string, e: React.MouseEvent, order: Lead[]) => {
      e.preventDefault();
      e.stopPropagation();
      setPicked((prev) => {
        const next = new Set(prev);
        if (e.shiftKey && lastPick.current) {
          const a = order.findIndex((x) => x.id === lastPick.current);
          const b = order.findIndex((x) => x.id === leadId);
          if (a > -1 && b > -1) {
            const add = !next.has(leadId);
            for (let i = Math.min(a, b); i <= Math.max(a, b); i++) {
              if (add) next.add(order[i].id);
              else next.delete(order[i].id);
            }
            return next;
          }
        }
        if (next.has(leadId)) next.delete(leadId);
        else next.add(leadId);
        return next;
      });
      lastPick.current = leadId;
    },
    [],
  );

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

  /** Move everything picked, one call each, so a failure part-way is visible. */
  async function moveMany(to: string) {
    setBusy(true);
    setError("");
    for (const x of chosen) {
      await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: x.id, stage: to }),
      });
    }
    setBusy(false);
    setSaid(`Moved ${chosen.length} to ${to}.`);
    setPicked(new Set());
    await load();
  }

  async function convert(into: "customer" | "partner", list: Lead[]) {
    if (!list.length) return;
    const names = list.map((x) => x.company).join(", ");
    if (
      !confirm(
        into === "customer"
          ? `Make ${list.length} lead(s) a customer? ${names}\n\nThis is you saying so — no deposit is taken and nothing is charged. Send a proposal instead if you want them to pay first.`
          : `Move ${list.length} lead(s) to Partners? ${names}\n\nThey leave the pipeline: a partner is not a deal you are trying to close.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    setSaid("");
    const res = await fetch("/api/leads/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: list.map((x) => x.id), into }),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out.error || "that did not work");
    const made = out.made?.length ?? 0;
    const skipped: { name: string; why: string }[] = out.skipped ?? [];
    setSaid(
      `${made} now ${made === 1 ? `a ${into}` : `${into}s`}.` +
        (skipped.length ? ` ${skipped.map((s) => `${s.name} — ${s.why}`).join("; ")}.` : ""),
    );
    setPicked(new Set());
    await load();
  }

  if (!leads) return <div className="p-5 text-[13px]" style={{ color: "var(--text-secondary)" }}>Reading the pipeline…</div>;

  const bar = (
    <DeskBar>
      {["all", ...stages].map((s) => (
        <button key={s} className={`btn-os ${stage === s ? "brand" : ""}`} onClick={() => { setStage(s); setId(null); }}
          title={s === "all" ? "Every lead" : stageOf(s).label}>
          {s === "all" ? null : (
            <span
              aria-hidden
              className="mr-1.5 inline-block h-[7px] w-[7px] rounded-full align-middle"
              style={{
                background: stageOf(s).dot,
                // "No stage" is the absence of one, so it reads as an empty ring.
                border: stageOf(s).dot === "transparent" ? "1px solid var(--text-secondary)" : "none",
              }}
            />
          )}
          {s === "all" ? "Everyone" : stageOf(s).label}{" "}
          <span className="tabular-nums opacity-70">
            {s === "all" ? leads.length : leads.filter((x) => x.stage === s).length}
          </span>
        </button>
      ))}
      <input className="btn-os min-w-[180px]" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
      {/*
        The list works a queue; the board answers where everything is piled up.
        Different questions, so both, rather than one compromise.
      */}
      <button className={`btn-os ${view === "list" ? "brand" : ""}`} onClick={() => setView("list")}>List</button>
      <button className={`btn-os ${view === "board" ? "brand" : ""}`} onClick={() => setView("board")}>Board</button>
      <select className="btn-os" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} title="Order the list">
        {(Object.keys(SORTS) as SortKey[]).map((k) => (
          <option key={k} value={k}>{SORTS[k].label}</option>
        ))}
      </select>
      <button className="btn-os brand" onClick={() => setAdding((v) => !v)}>{adding ? "Cancel" : "+ New lead"}</button>
      <button className="btn-os" onClick={() => setImporting((v) => !v)}>{importing ? "Cancel import" : "Import"}</button>
      <span className="ml-auto text-[11px] tabular-nums" style={{ color: "var(--text-secondary)" }}>
        {money(leads.filter((x) => isOpen(x.stage)).reduce((a, x) => a + x.value, 0))} in play
      </span>
    </DeskBar>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {bar}
      {importing ? <ImportDeals onDone={load} /> : null}
      {chosen.length ? (
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2.5" style={{ borderColor: "var(--hairline)", background: "var(--brand-dim)" }}>
          <span className="text-[12.5px] font-semibold tabular-nums">
            {chosen.length} picked · {money(chosen.reduce((a, x) => a + x.value, 0))}/mo
          </span>
          <button className="btn-os" onClick={() => setPicked(new Set())}>Clear</button>
          <span className="mx-1 text-[11px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Move to</span>
          {stages.map((sname) => (
            <button key={sname} className="btn-os" disabled={busy} onClick={() => moveMany(sname)}>{stageOf(sname).label}</button>
          ))}
          <span className="mx-1 text-[11px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Make them</span>
          <button className="btn-os brand" disabled={busy} onClick={() => convert("customer", chosen)}>A customer</button>
          <button className="btn-os" disabled={busy} onClick={() => convert("partner", chosen)}>A partner</button>
        </div>
      ) : null}
      {said ? (
        <div className="border-b px-4 py-2 text-[12.5px]" style={{ borderColor: "var(--hairline)", color: "var(--state-go)" }}>{said}</div>
      ) : null}
      {error ? (
        <div className="border-b px-4 py-2 text-[12.5px]" style={{ borderColor: "var(--hairline)", color: "var(--state-stop)" }}>{error}</div>
      ) : null}
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

      {view === "board" ? (
        <LeadBoard
          leads={shown}
          busy={busy}
          onMove={move}
          onOpen={(leadId) => { setId(leadId); setTab("overview"); setView("list"); }}
        />
      ) : (
      <Dossier
        widthKey="leads"
        onClose={() => setId(null)}
        list={
          shown.length === 0 ? (
            <div className="p-5 text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {leads.length === 0
                ? "No leads yet. These are shops buying a site and a lead system from you — add the first one."
                : "Nothing matches that filter."}
            </div>
          ) : (
            <>
              <label className="flex items-center gap-2.5 border-b px-3.5 py-2 text-[11px] uppercase tracking-wider"
                style={{ borderColor: "var(--hairline)", color: "var(--text-secondary)" }}>
                <input
                  type="checkbox"
                  className="cursor-pointer"
                  checked={chosen.length === shown.length && shown.length > 0}
                  ref={(el) => {
                    // Some picked but not all: neither box state is honest, so
                    // show the third one.
                    if (el) el.indeterminate = chosen.length > 0 && chosen.length < shown.length;
                  }}
                  onChange={(e) => setPicked(e.target.checked ? new Set(shown.map((x) => x.id)) : new Set())}
                />
                {chosen.length ? `${chosen.length} of ${shown.length}` : `all ${shown.length}`}
              </label>
              {shown.map((x) => (
                <RollItem
                  key={x.id}
                  on={open && x.id === l?.id}
                  picked={picked.has(x.id)}
                  onPick={(e) => pick(x.id, e, shown)}
                  title={x.company}
                  meta={`${[x.contact, x.city].filter(Boolean).join(" · ") || "no contact yet"} · ${x.stage}${x.value ? ` · ${money(x.value)}/mo` : ""}`}
                  onClick={() => { setId(x.id); setTab("overview"); }}
                />
              ))}
            </>
          )
        }
        rail={
          l ? (
            <div className="flex flex-col gap-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Move it</div>
              <div className="flex flex-col gap-1">
                {stages.map((s) => (
                  <button key={s} className={`btn-os text-left ${l.stage === s ? "brand" : ""}`} disabled={busy}
                    onClick={() => move(l.id, s)}>
                    <span aria-hidden className="mr-1.5 inline-block h-[7px] w-[7px] rounded-full align-middle"
                      style={{
                        background: stageOf(s).dot,
                        border: stageOf(s).dot === "transparent" ? "1px solid var(--text-secondary)" : "none",
                      }} />
                    {stageOf(s).label}
                  </button>
                ))}
              </div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                Make them
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button className="btn-os brand" disabled={busy} onClick={() => convert("customer", [l])}>
                  A customer
                </button>
                <button className="btn-os" disabled={busy} onClick={() => convert("partner", [l])}>
                  A partner
                </button>
              </div>
              <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Converting here is you saying so. The other way in is a deposit — send a proposal and let the
                payment do it, and the record then has money behind it rather than a click.
              </p>
            </div>
          ) : null
        }
      >
        {open && l ? (
          <>
            <div className="border-b px-4 pt-4 pb-2.5" style={{ borderColor: "var(--hairline)" }}>
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: stageOf(l.stage).dot }}>{stageOf(l.stage).label}</div>
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
      )}
    </div>
  );
}
