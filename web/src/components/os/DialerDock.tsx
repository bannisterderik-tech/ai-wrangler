"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
type Lead = { id: string; company: string; contact: string | null; phone: string | null };

type Call = { id: string; t0: number; muted: boolean };
type Ctx = {
  call: Call | null;
  dial: (id: string) => void;
  hang: () => void;
  toggleMute: () => void;
  lead: Lead | null;
  next: Lead | null;
};

const DialerCtx = createContext<Ctx | null>(null);

export function useDialer() {
  const ctx = useContext(DialerCtx);
  if (!ctx) throw new Error("useDialer needs DialerProvider");
  return ctx;
}

export function DialerProvider({ children }: { children: React.ReactNode }) {
  const [call, setCall] = useState<Call | null>(null);
  const [, tick] = useState(0);
  // The dock dials whoever is on the real call board, not a fixed array.
  const [board, setBoard] = useState<Lead[]>([]);

  useEffect(() => {
    fetch("/api/calls", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setBoard(d?.board ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!call) return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [call]);

  const dial = useCallback(async (id: string) => {
    const l = board.find((x: Lead) => x.id === id);
    if (!l) return;
    setCall({ id, t0: Date.now(), muted: false });
    await fetch("/api/twilio/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: l.phone }),
    }).catch(() => {});
  }, [board]);

  const hang = useCallback(() => setCall(null), []);
  const toggleMute = useCallback(() => setCall((c) => (c ? { ...c, muted: !c.muted } : c)), []);
  const lead = useMemo(() => (call ? board.find((l: Lead) => l.id === call.id) || null : null), [call, board]);

  return (
    <DialerCtx.Provider value={{ call, dial, hang, toggleMute, lead, next: board[0] ?? null }}>
      {children}
    </DialerCtx.Provider>
  );
}

function dur(t0: number) {
  const s = Math.floor((Date.now() - t0) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function DialerDock() {
  const { call, lead, next, hang, toggleMute, dial } = useDialer();
  const router = useRouter();
  const first = next;

  return (
    <footer
      className="grid h-16 shrink-0 grid-cols-[220px_1fr_280px] items-center gap-4 border-t px-[18px]"
      style={{
        borderColor: "var(--hairline)",
        background: call ? "color-mix(in srgb, #120a08 80%, var(--surface-raised))" : "var(--surface-raised)",
      }}
    >
      <div>
        <div className="text-[13px] font-semibold">{lead ? lead.contact ?? lead.company : "Twilio idle"}</div>
        <div className="font-mono text-[12px]" style={{ color: "var(--text-secondary)" }}>
          {lead ? `${lead.phone} · ${lead.company} · ${dur(call!.t0)}` : "one shared number · per-customer DIDs not built"}
        </div>
      </div>
      <div className="flex h-7 items-end justify-center gap-[3px]">
        {call
          ? Array.from({ length: 18 }).map((_, i) => (
              <span
                key={i}
                className="block w-[3px] rounded-sm"
                style={{
                  background: i % 2 ? "var(--brand-text)" : "var(--brand)",
                  height: 6 + ((i * 7) % 20),
                  animation: "pulse 0.9s ease-in-out infinite",
                  animationDelay: `${(i % 5) * 0.1}s`,
                }}
              />
            ))
          : <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Ready</span>}
      </div>
      <div className="flex justify-end gap-2">
        {lead ? (
          <>
            <button className="btn-os" onClick={toggleMute}>{call?.muted ? "Unmute" : "Mute"}</button>
            <button className="btn-os" onClick={() => router.push("/inbox")}>Inbox</button>
            <button className="btn-os stop" onClick={hang}>Hang up</button>
          </>
        ) : (
          <>
            <button className="btn-os brand" onClick={() => first && dial(first.id)}>Power dial</button>
            <button className="btn-os" onClick={() => router.push("/dialer")}>Open dialer</button>
          </>
        )}
      </div>
    </footer>
  );
}
