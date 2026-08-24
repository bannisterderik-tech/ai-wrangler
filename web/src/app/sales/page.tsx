"use client";

import { useEffect, useState } from "react";

type Deal = { id: string; name: string; value: string; note: string | null; stage: number };
const COLS = ["Leads", "Talking", "Proposal sent", "Won"];

export default function SalesPage() {
  const [deals, setDeals] = useState<Deal[]>([]);

  async function load() {
    const d = await fetch("/api/deals").then((r) => r.json());
    setDeals(d.deals || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function move(id: string, stage: number) {
    await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, stage }),
    });
    await load();
  }

  return (
    <div className="overflow-auto p-4">
      <div className="mb-2.5 text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
        From first hello to onboarded customer. Win a deal and it flows into the customer workspace.
      </div>
      <div className="grid min-w-[760px] grid-cols-4 gap-2.5">
        {COLS.map((title, ci) => {
          const cards = deals.filter((d) => d.stage === ci);
          return (
            <div key={title} className="flex flex-col gap-1.5 rounded-[10px] p-2" style={{ background: "var(--surface-inset)", border: "1px solid var(--hairline)" }}>
              <div className="flex justify-between px-0.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                <span>{title}</span>
                <span>{cards.length}</span>
              </div>
              {cards.map((de) => (
                <div key={de.id} className="rounded-lg px-2.5 py-2.5" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}>
                  <div className="flex justify-between gap-1.5">
                    <span className="text-xs font-semibold">{de.name}</span>
                    <span className="text-[11px] tabular-nums" style={{ color: "var(--state-running)" }}>{de.value}</span>
                  </div>
                  <div className="mt-1 text-[11px] leading-snug" style={{ color: "var(--text-secondary)" }}>{de.note}</div>
                  <div className="mt-2 flex justify-end gap-1">
                    {ci > 0 ? (
                      <button onClick={() => move(de.id, ci - 1)} className="h-5 w-5 cursor-pointer rounded-[5px] border text-[10px]" style={{ background: "none", borderColor: "var(--hairline)", color: "var(--text-secondary)" }}>
                        ‹
                      </button>
                    ) : null}
                    {ci < 3 ? (
                      <button onClick={() => move(de.id, ci + 1)} className="h-5 w-5 cursor-pointer rounded-[5px] border text-[10px]" style={{ background: "none", borderColor: "var(--hairline)", color: "var(--text-secondary)" }}>
                        ›
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
