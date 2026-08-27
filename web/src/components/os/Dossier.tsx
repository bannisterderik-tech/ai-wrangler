"use client";

import type { ReactNode } from "react";

export function Kv({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <div className="grid grid-cols-[128px_1fr] gap-x-3 gap-y-2 text-[13px]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <div className="pt-0.5 text-[11px] uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>{k}</div>
          <div className="min-w-0">{v}</div>
        </div>
      ))}
    </div>
  );
}

export function Dossier({
  list,
  rail,
  children,
}: {
  list: ReactNode;
  rail: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid h-full min-h-0 grid-cols-[300px_1fr_280px]">
      <div className="min-h-0 overflow-auto border-r" style={{ borderColor: "var(--hairline)", background: "var(--surface-raised)" }}>
        {list}
      </div>
      <div className="flex min-h-0 min-w-0 flex-col">{children}</div>
      <aside className="min-h-0 overflow-auto border-l p-3.5" style={{ borderColor: "var(--hairline)", background: "var(--surface-raised)" }}>
        {rail}
      </aside>
    </div>
  );
}

export function Rail({ title, why, onDo }: { title: string; why: string; onDo: () => void }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Next move</div>
      <div className="mt-2 rounded-xl border p-3" style={{ borderColor: "color-mix(in srgb, var(--brand) 40%, var(--hairline))" }}>
        <b className="block text-[14px]">{title}</b>
        <p className="mt-1.5 mb-3 text-[12.5px] leading-snug" style={{ color: "var(--text-secondary)" }}>{why}</p>
        <button className="btn-os brand w-full" onClick={onDo}>Do it</button>
      </div>
    </div>
  );
}

export function Tabs({ tabs, tab, onTab }: { tabs: [string, string][]; tab: string; onTab: (id: string) => void }) {
  return (
    <div className="flex gap-0.5 overflow-x-auto border-b px-2" style={{ borderColor: "var(--hairline)" }}>
      {tabs.map(([id, label]) => (
        <button
          key={id}
          onClick={() => onTab(id)}
          className="shrink-0 border-b-2 px-3 py-2.5 text-xs font-semibold"
          style={{
            borderColor: tab === id ? "var(--brand)" : "transparent",
            color: tab === id ? "var(--text-primary)" : "var(--text-secondary)",
            background: "transparent",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function RollItem({ on, title, meta, onClick }: { on: boolean; title: string; meta: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="block w-full border-b px-3.5 py-3 text-left"
      style={{ background: on ? "var(--brand-dim)" : "transparent", borderColor: "var(--hairline)" }}
    >
      <div className="text-[13.5px] font-semibold">{title}</div>
      <div className="mt-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>{meta}</div>
    </button>
  );
}
