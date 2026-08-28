"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Event = { kind: string; direction: string; body: string | null; at: string; actor: string };
type Lead = {
  id: string; name: string; phone: string | null; email: string | null; source: string | null;
  stage: string; value: number; note: string | null; createdAt: string; timeline: Event[];
};
type Payload = { you: { name: string; email: string }; leads: Lead[] };

const STAGES = ["new", "contacted", "quoted", "won", "lost"];
const TONE: Record<string, string> = {
  new: "var(--state-running)", contacted: "var(--state-thinking)", quoted: "var(--state-blocked)",
  won: "var(--state-go)", lost: "var(--text-secondary)",
};
const money = (n: number) => "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });

/**
 * The client's own desk. Their leads, their calls, their texts — never ours, and
 * never another client's: every read behind this goes through withCustomer, so
 * Postgres refuses what a bug here might otherwise ask for.
 */
export default function ClientPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [stage, setStage] = useState<string>("all");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/client/leads", { cache: "no-store" });
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  const rows = useMemo(
    () => (data?.leads ?? []).filter((l) => stage === "all" || l.stage === stage),
    [data, stage],
  );
  const lead = rows.find((l) => l.id === sel) ?? null;

  async function log(kind: string) {
    if (!lead) return;
    setBusy(true);
    await fetch("/api/client/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead.id, kind, body: note || undefined }),
    });
    setNote("");
    setBusy(false);
    await load();
  }

  if (!data) {
    return <div className="p-6 text-[13px]" style={{ color: "var(--text-secondary)" }}>Loading your leads…</div>;
  }

  const open = data.leads.filter((l) => l.stage !== "won" && l.stage !== "lost");
  const pipeline = open.reduce((a, l) => a + l.value, 0);

  return (
    <div className="flex h-full min-h-0 flex-col" style={{ background: "var(--surface-void)" }}>
      <header
        className="flex flex-wrap items-center gap-3 border-b px-5 py-3"
        style={{ borderColor: "var(--hairline)", background: "var(--surface-raised)" }}
      >
        <div className="brand-mark" role="img" aria-label="AI Wrangler" />
        <div className="text-[14px] font-semibold">Your leads</div>
        <div className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
          {open.length} open · {money(pipeline)} in play
        </div>
        <div className="ml-auto flex items-center gap-3 text-[12px]" style={{ color: "var(--text-secondary)" }}>
          <Link href="/client/copilot" className="btn-os no-underline">Ask your copilot</Link>
          {data.you.name}
          <a href="/api/auth/logout" className="underline">Sign out</a>
        </div>
      </header>

      <div className="flex flex-wrap gap-1.5 border-b px-5 py-2" style={{ borderColor: "var(--hairline)" }}>
        {["all", ...STAGES].map((s) => (
          <button
            key={s}
            onClick={() => { setStage(s); setSel(null); }}
            className={`btn-os ${stage === s ? "brand" : ""}`}
          >
            {s === "all" ? "Everyone" : s}{" "}
            <span className="tabular-nums opacity-70">
              {s === "all" ? data.leads.length : data.leads.filter((l) => l.stage === s).length}
            </span>
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(280px,360px)_1fr]">
        <div className="min-h-0 overflow-auto border-r" style={{ borderColor: "var(--hairline)" }}>
          {rows.length === 0 ? (
            <div className="p-5 text-[13px]" style={{ color: "var(--text-secondary)" }}>
              Nothing here yet. New leads land the moment someone calls or fills in the form.
            </div>
          ) : (
            rows.map((l) => (
              <button
                key={l.id}
                onClick={() => setSel(l.id)}
                className="block w-full border-b px-4 py-3 text-left"
                style={{
                  borderColor: "var(--hairline)",
                  background: l.id === lead?.id ? "var(--brand-dim, rgba(255,77,24,0.12))" : "transparent",
                }}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[14px] font-semibold">{l.name}</span>
                  <span className="tabular-nums text-[13px]">{money(l.value)}</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-2 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                  <span>{l.phone ?? l.email ?? "no contact"}</span>
                  <span style={{ color: TONE[l.stage] }}>{l.stage}</span>
                </div>
                {l.source ? (
                  <div className="mt-1 text-[11px] uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                    {l.source}
                  </div>
                ) : null}
              </button>
            ))
          )}
        </div>

        <div className="min-h-0 overflow-auto p-5">
          {!lead ? (
            <div className="text-[13px]" style={{ color: "var(--text-secondary)" }}>Pick a lead.</div>
          ) : (
            <>
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TONE[lead.stage] }}>
                {lead.stage}
              </div>
              <h2 className="mt-1 mb-1 text-[26px] leading-tight">{lead.name}</h2>
              <div className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                {[lead.phone, lead.email, lead.source].filter(Boolean).join(" · ")} · {money(lead.value)}
              </div>
              {lead.note ? <p className="mt-3 max-w-[62ch] text-[13.5px] leading-relaxed">{lead.note}</p> : null}

              <div className="mt-5 flex flex-wrap gap-2">
                {lead.phone ? <a className="btn-os brand no-underline" href={`tel:${lead.phone}`}>Call</a> : null}
                {lead.phone ? <a className="btn-os no-underline" href={`sms:${lead.phone}`}>Text</a> : null}
                <button className="btn-os" disabled={busy} onClick={() => log("call")}>Log a call</button>
                <button className="btn-os" disabled={busy} onClick={() => log("note")}>Save note</button>
              </div>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What happened on the call?"
                rows={2}
                className="mt-3 w-full max-w-[62ch] rounded-lg border px-3 py-2 text-[13px] outline-none"
                style={{ background: "var(--surface-inset)", borderColor: "var(--hairline)" }}
              />

              <div className="mt-6 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                Everything that has happened
              </div>
              <div className="mt-2">
                {lead.timeline.length === 0 ? (
                  <div className="text-[13px]" style={{ color: "var(--text-secondary)" }}>Nothing logged yet.</div>
                ) : (
                  lead.timeline.map((e, i) => (
                    <div key={i} className="border-b py-2.5 text-[13px]" style={{ borderColor: "var(--hairline)" }}>
                      <span className="mr-2 text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                        {e.kind} {e.direction === "in" ? "in" : "out"} · {e.actor}
                      </span>
                      {e.body}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
