"use client";

import { useMemo, useState } from "react";
import { LEADS, STAGES, money, type Lead } from "@/lib/os-demo";
import { useDialer } from "@/components/os/DialerDock";

export default function PipelinePage() {
  const { dial } = useDialer();
  const [rows, setRows] = useState<Lead[]>(LEADS.filter((l) => l.kind !== "partner").map((l) => ({ ...l })));
  const [filter, setFilter] = useState("all");
  const trades = useMemo(() => [...new Set(rows.map((l) => l.trade))], [rows]);
  const shown = useMemo(() => rows.filter((l) => filter === "all" || l.trade === filter), [rows, filter]);

  function move(id: string, dir: number) {
    setRows((all) =>
      all.map((l) => (l.id === id ? { ...l, stage: Math.max(0, Math.min(STAGES.length - 1, l.stage + dir)) } : l)),
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b px-5 py-2 text-xs" style={{ borderColor: "var(--hairline)", color: "var(--text-secondary)" }}>
        <span>Wrangler sales board — shops who want a site and the machine</span>
        <select className="btn-os" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All trades</option>
          {trades.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="grid min-h-0 flex-1 auto-cols-[minmax(240px,1fr)] grid-flow-col gap-2.5 overflow-auto p-3.5">
        {STAGES.map((name, i) => {
          const cards = shown.filter((l) => l.stage === i);
          return (
            <div key={name} className="flex min-h-0 flex-col rounded-xl border" style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)" }}>
              <div className="flex justify-between px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                <span>{name}</span><span>{cards.length}</span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto px-2 pb-2">
                {cards.map((l) => (
                  <div key={l.id} className="rounded-xl border p-3" style={{ background: "var(--surface-inset)", borderColor: "var(--hairline)" }}>
                    <b className="text-[13.5px]">{l.company}</b>
                    <div className="mt-1 flex justify-between text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
                      <span>{l.name} · {l.trade}</span>
                      <span className="font-mono">{money(l.value)}/mo</span>
                    </div>
                    <div className="mt-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>{l.note}</div>
                    <div className="mt-2 flex justify-end gap-1">
                      <button className="btn-os" onClick={() => dial(l.id)}>Call</button>
                      {i > 0 ? <button className="btn-os" onClick={() => move(l.id, -1)}>‹</button> : null}
                      {i < STAGES.length - 1 ? <button className="btn-os brand" onClick={() => move(l.id, 1)}>›</button> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
