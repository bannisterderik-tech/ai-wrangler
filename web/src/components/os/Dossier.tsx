"use client";

import { useEffect, useRef, useState } from "react";
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

/**
 * List, record, next move.
 *
 * Pass `children` = null for "nothing is selected" and the list takes the whole
 * screen — a record that opens itself on whatever sorted first is a record you
 * did not ask for, and one you then cannot get out of. `onClose` puts the way
 * out where people look for it, and Escape does the same thing.
 */
/**
 * How wide the list is, remembered per screen.
 *
 * A fixed 300px is right for a handful of rows and wrong for a real pipeline —
 * at forty leads you want to read company names, and at four you want the
 * dossier. Whoever is looking knows which; this just remembers what they chose.
 */
function useListWidth(key: string) {
  const [width, setWidth] = useState(300);
  const dragging = useRef(false);

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(`wrangler-list-${key}`));
      if (Number.isFinite(saved) && saved >= 220) setWidth(Math.min(saved, 720));
    } catch {
      /* a private window, or storage turned off. The default is fine. */
    }
  }, [key]);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!dragging.current) return;
      // Bounded so the list can never be dragged to nothing, or over the
      // dossier it exists to open.
      const next = Math.max(220, Math.min(720, e.clientX - 8));
      setWidth(next);
    };
    const up = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setWidth((w) => {
        try {
          localStorage.setItem(`wrangler-list-${key}`, String(w));
        } catch {
          /* nothing to do about it */
        }
        return w;
      });
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [key]);

  const start = () => {
    dragging.current = true;
    // Set on the body so the cursor holds while dragging over anything.
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  return { width, start, setWidth };
}

export function Dossier({
  list,
  rail,
  children,
  onClose,
  widthKey = "default",
}: {
  list: ReactNode;
  rail?: ReactNode;
  children?: ReactNode;
  onClose?: () => void;
  /** Which screen this is, so its chosen width is remembered separately. */
  widthKey?: string;
}) {
  const open = Boolean(children);
  const { width, start, setWidth } = useListWidth(widthKey);

  useEffect(() => {
    if (!open || !onClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) {
    return (
      <div className="h-full min-h-0 overflow-auto" style={{ background: "var(--surface-raised)" }}>
        {list}
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0" style={{ gridTemplateColumns: `${width}px 6px minmax(0, 1fr) 280px` }}>
      <div className="min-h-0 overflow-auto" style={{ background: "var(--surface-raised)" }}>
        {list}
      </div>
      {/*
        The divider. A button rather than a bare div so it is reachable from a
        keyboard: arrows nudge it, which is the only way to resize without a
        mouse.
      */}
      <button
        aria-label="Drag to resize the list"
        title="Drag to resize"
        onMouseDown={start}
        onDoubleClick={() => setWidth(300)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setWidth((w) => Math.max(220, w - 24));
          if (e.key === "ArrowRight") setWidth((w) => Math.min(720, w + 24));
        }}
        className="group relative cursor-col-resize border-0 p-0"
        style={{ background: "var(--hairline)" }}
      >
        <span
          className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100"
          style={{ background: "var(--brand)" }}
        />
      </button>
      <div className="relative flex min-h-0 min-w-0 flex-col">
        {onClose ? (
          <button
            onClick={onClose}
            aria-label="Close (Esc)"
            title="Close (Esc)"
            className="absolute right-3 top-3 z-10 cursor-pointer rounded-lg border px-2 py-1 text-[11px] leading-none"
            style={{ background: "var(--btn)", borderColor: "var(--hairline)", color: "var(--text-secondary)" }}
          >
            Close ✕
          </button>
        ) : null}
        {children}
      </div>
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

export function DeskBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2" style={{ borderColor: "var(--hairline)", background: "var(--surface-raised)" }}>
      {children}
    </div>
  );
}

export function RollItem({
  on,
  title,
  meta,
  onClick,
  picked,
  onPick,
}: {
  on: boolean;
  title: string;
  meta: string;
  onClick: () => void;
  /** Present only on screens that allow picking several at once. */
  picked?: boolean;
  onPick?: (e: React.MouseEvent) => void;
}) {
  const row = (
    <button
      onClick={onClick}
      className="block min-w-0 flex-1 overflow-hidden py-3 pr-3.5 text-left"
      style={{ paddingLeft: onPick ? 0 : 14 }}
    >
      <div className="truncate text-[13.5px] font-semibold">{title}</div>
      <div className="mt-0.5 truncate text-xs" style={{ color: "var(--text-secondary)" }}>{meta}</div>
    </button>
  );
  return (
    <div
      className="flex w-full min-w-0 max-w-full items-center gap-2.5 border-b"
      style={{ background: on ? "var(--brand-dim)" : "transparent", borderColor: "var(--hairline)" }}
    >
      {onPick ? (
        // Its own click target, so picking a row never opens it — the two
        // gestures mean different things and must not be the same click.
        <span className="flex shrink-0 self-stretch items-center pl-3.5">
          <input
            type="checkbox"
            aria-label={`Pick ${title}`}
            readOnly
            checked={Boolean(picked)}
            onClick={onPick}
            className="cursor-pointer"
          />
        </span>
      ) : null}
      {row}
    </div>
  );
}
