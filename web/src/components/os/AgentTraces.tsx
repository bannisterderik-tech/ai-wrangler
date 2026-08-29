"use client";

import { useCallback, useEffect, useState } from "react";

type Trace = {
  id: string; kind: string; name: string; input: string | null; output: string | null;
  ok: boolean; ms: number; cost: number; at: string;
};

const TONE: Record<string, string> = {
  tool: "var(--state-running)", model: "var(--state-thinking)",
  decision: "var(--brand-text)", event: "var(--text-secondary)", error: "var(--state-stop)",
};

/**
 * Why it did that.
 *
 * Spend and a heartbeat say an agent is alive and what it burned. Neither
 * answers the question a customer actually asks. Failures first, because an
 * agent that worked is easy to explain and an agent that stopped is the
 * support call.
 */
export function AgentTraces({ personId }: { personId: string }) {
  const [rows, setRows] = useState<Trace[] | null>(null);
  const [failures, setFailures] = useState(0);
  const [cost, setCost] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/traces?personId=${encodeURIComponent(personId)}`, { cache: "no-store" });
    if (res.status === 403) return setDenied(true);
    if (!res.ok) return;
    const d = await res.json();
    setRows(d.traces ?? []);
    setFailures(d.failures ?? 0);
    setCost(d.cost ?? 0);
  }, [personId]);
  useEffect(() => {
    load();
  }, [load]);

  if (denied) return null;
  if (!rows) return <p className="p-4 text-[13px]" style={{ color: "var(--text-secondary)" }}>Reading…</p>;

  if (!rows.length) {
    return (
      <p className="max-w-[70ch] p-4 text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        Nothing recorded yet. Every tool call, model call and decision this agent makes lands here with what it
        saw, what it chose and what it cost — so &ldquo;why did it do that&rdquo; has an answer that is not a guess.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex flex-wrap items-baseline gap-3 text-[12.5px]">
        <span><b>{rows.length}</b> steps</span>
        <span style={{ color: failures ? "var(--state-stop)" : "var(--text-secondary)" }}>
          <b>{failures}</b> failed
        </span>
        <span style={{ color: "var(--text-secondary)" }}>${cost.toFixed(4)}</span>
      </div>
      {rows.map((t) => (
        <div key={t.id} className="border-b pb-1.5" style={{ borderColor: "var(--hairline)" }}>
          <button className="flex w-full flex-wrap items-baseline gap-2 text-left text-[12px]"
            onClick={() => setOpen(open === t.id ? null : t.id)}>
            <span className="w-[62px] shrink-0 font-semibold" style={{ color: TONE[t.kind] ?? "var(--text-secondary)" }}>
              {t.kind}
            </span>
            <span className="font-mono">{t.name}</span>
            {!t.ok ? <span style={{ color: "var(--state-stop)" }}>failed</span> : null}
            <span className="ml-auto tabular-nums" style={{ color: "var(--text-secondary)" }}>
              {t.ms}ms{t.cost ? ` · $${t.cost.toFixed(4)}` : ""}
            </span>
          </button>
          {open === t.id ? (
            <div className="mt-1.5 flex flex-col gap-1.5 rounded-lg p-2.5 font-mono text-[11.5px] leading-relaxed"
              style={{ background: "var(--surface)", color: "var(--text-secondary)" }}>
              <div><b>in</b> {t.input ?? "—"}</div>
              <div><b>out</b> {t.output ?? "—"}</div>
              <div>{new Date(t.at).toLocaleString()}</div>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
