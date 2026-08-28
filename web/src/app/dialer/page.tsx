"use client";

import { useCallback, useEffect, useState } from "react";
import { DeskBar } from "@/components/os/Dossier";

type Row = {
  id: string; company: string; contact: string | null; phone: string | null;
  city: string | null; stage: string; value: number; lastCall: string | null; calls: number;
};
type Call = { id: number; leadId: string | null; to: string | null; outcome: string; note: string | null; actor: string; at: string };
const money = (n: number) => "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });

/**
 * The call board. It dials with the device's own dialler, because Twilio here is
 * still one shared number for every customer — sending from it would put one
 * shop's call on another shop's line, which is the thing this product refuses to
 * do. Per-customer numbers are the fix, and until then this logs honestly.
 */
export default function DialerPage() {
  const [board, setBoard] = useState<Row[] | null>(null);
  const [recent, setRecent] = useState<Call[]>([]);
  const [outcomes, setOutcomes] = useState<string[]>([]);
  const [active, setActive] = useState<Row | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/calls", { cache: "no-store" });
    if (!res.ok) return;
    const out = await res.json();
    setBoard(out.board ?? []);
    setRecent(out.recent ?? []);
    setOutcomes(out.outcomes ?? []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function log(outcome: string) {
    if (!active) return;
    setBusy(true);
    await fetch("/api/calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: active.id, to: active.phone, outcome, note }),
    });
    setNote("");
    setBusy(false);
    await load();
  }

  if (!board) return <div className="p-5 text-[13px]" style={{ color: "var(--text-secondary)" }}>Reading the board…</div>;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DeskBar>
        <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
          {board.length} to call · {recent.length} logged recently
        </span>
        <span className="ml-auto text-[11px]" style={{ color: "var(--text-secondary)" }}>
          Dials with this device. Per-customer Twilio numbers are not built yet.
        </span>
      </DeskBar>

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(280px,380px)_1fr]">
        <div className="min-h-0 overflow-auto border-r" style={{ borderColor: "var(--hairline)" }}>
          {board.length === 0 ? (
            <div className="p-5 text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Nobody to call. The board is every lead with a phone number that is not won or lost — add one on
              Leads or Prospects.
            </div>
          ) : (
            board.map((r) => (
              <button
                key={r.id}
                onClick={() => { setActive(r); setNote(""); }}
                className="block w-full border-b px-4 py-3 text-left"
                style={{ borderColor: "var(--hairline)", background: active?.id === r.id ? "var(--brand-dim, rgba(255,77,24,0.12))" : "transparent" }}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[14px] font-semibold">{r.company}</span>
                  <span className="tabular-nums text-[12px]" style={{ color: "var(--text-secondary)" }}>{r.value ? money(r.value) : ""}</span>
                </div>
                <div className="mt-1 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                  {[r.contact, r.phone].filter(Boolean).join(" · ")}
                </div>
                <div className="mt-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                  {r.stage} · {r.calls ? `${r.calls} call${r.calls > 1 ? "s" : ""}` : "never called"}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="min-h-0 overflow-auto p-5">
          {!active ? (
            <div className="text-[13px]" style={{ color: "var(--text-secondary)" }}>Pick somebody to call.</div>
          ) : (
            <>
              <h2 className="mb-1 text-[26px] leading-tight">{active.company}</h2>
              <div className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                {[active.contact, active.phone, active.city].filter(Boolean).join(" · ")}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {active.phone ? <a className="btn-os brand no-underline" href={`tel:${active.phone}`}>Call {active.phone}</a> : null}
                {active.phone ? <a className="btn-os no-underline" href={`sms:${active.phone}`}>Text</a> : null}
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="What happened?"
                className="mt-3 w-full max-w-[62ch] rounded-lg border px-3 py-2 text-[13px] outline-none"
                style={{ background: "var(--surface-inset)", borderColor: "var(--hairline)" }}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {outcomes.map((o) => (
                  <button key={o} className="btn-os" disabled={busy} onClick={() => log(o)}>Log: {o}</button>
                ))}
              </div>

              <div className="mt-7 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                Recent calls
              </div>
              <div className="mt-2">
                {recent.length === 0 ? (
                  <div className="text-[13px]" style={{ color: "var(--text-secondary)" }}>Nothing logged yet.</div>
                ) : (
                  recent.map((c) => (
                    <div key={c.id} className="border-b py-2.5 text-[13px]" style={{ borderColor: "var(--hairline)" }}>
                      <span className="mr-2 text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                        {c.outcome} · {c.actor} · {new Date(c.at).toLocaleString()}
                      </span>
                      {c.note}
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
