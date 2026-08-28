"use client";

import { useState } from "react";
import { STAGES } from "@/lib/stages";

type Lead = {
  id: string; company: string; contact: string | null; city: string | null;
  stage: string; value: number;
};

const money = (n: number) => "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });

/**
 * The pipeline as a board.
 *
 * The list is better for working a queue — search it, sort it, pick twenty and
 * act on them. The board is better for the question the list cannot answer at a
 * glance: where is everything piled up. Twelve stages is a lot of columns, so
 * they scroll sideways rather than being squeezed to nothing.
 *
 * Dragging a card is the whole point, so it is a real drag rather than a menu:
 * the gesture matches what the board is for.
 */
export function LeadBoard({
  leads,
  onMove,
  onOpen,
  busy,
}: {
  leads: Lead[];
  onMove: (id: string, to: string) => void;
  onOpen: (id: string) => void;
  busy: boolean;
}) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  return (
    <div className="flex min-h-0 flex-1 gap-2.5 overflow-x-auto p-3">
      {STAGES.map((s) => {
        const inStage = leads.filter((l) => l.stage === s.id);
        const worth = inStage.reduce((a, l) => a + l.value, 0);
        const target = over === s.id;
        return (
          <section
            key={s.id}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(s.id);
            }}
            onDragLeave={() => setOver((v) => (v === s.id ? null : v))}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              const id = dragging || e.dataTransfer.getData("text/plain");
              // Dropping a card back where it started is not a move.
              if (id && leads.find((l) => l.id === id)?.stage !== s.id) onMove(id, s.id);
              setDragging(null);
            }}
            className="flex w-[240px] shrink-0 flex-col rounded-[12px]"
            style={{
              background: "var(--surface-raised)",
              outline: target ? "2px solid var(--brand)" : "1px solid var(--hairline)",
              outlineOffset: target ? "-2px" : "-1px",
            }}
          >
            <header className="flex items-center gap-2 px-3 py-2.5">
              <span
                aria-hidden
                className="inline-block h-[9px] w-[9px] shrink-0 rounded-full"
                style={{
                  background: s.dot,
                  // "No stage" is the absence of one, so it reads as an empty ring.
                  border: s.dot === "transparent" ? "1px solid var(--text-secondary)" : "none",
                }}
              />
              <span className="min-w-0 flex-1 truncate text-[12px] font-semibold" title={s.label}>{s.label}</span>
              <span className="rounded px-1.5 text-[11px] tabular-nums" style={{ background: "var(--surface)", color: "var(--text-secondary)" }}>
                {inStage.length}
              </span>
            </header>
            {worth ? (
              <div className="px-3 pb-1.5 text-[11px] tabular-nums" style={{ color: "var(--text-secondary)" }}>
                {money(worth)}/mo
              </div>
            ) : null}

            <div className="flex min-h-[60px] flex-col gap-1.5 overflow-y-auto px-2 pb-2">
              {inStage.map((l) => (
                <article
                  key={l.id}
                  draggable={!busy}
                  onDragStart={(e) => {
                    setDragging(l.id);
                    e.dataTransfer.setData("text/plain", l.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    setDragging(null);
                    setOver(null);
                  }}
                  onClick={() => onOpen(l.id)}
                  className="cursor-pointer rounded-lg px-2.5 py-2"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--hairline)",
                    opacity: dragging === l.id ? 0.4 : 1,
                  }}
                >
                  <div className="truncate text-[12.5px] font-semibold">{l.company}</div>
                  <div className="mt-0.5 truncate text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    {[l.contact, l.city].filter(Boolean).join(" · ") || "no contact yet"}
                  </div>
                  {l.value ? (
                    <div className="mt-1 text-[11px] tabular-nums" style={{ color: "var(--text-secondary)" }}>
                      {money(l.value)}/mo
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
