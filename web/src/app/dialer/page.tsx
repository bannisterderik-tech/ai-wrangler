"use client";

import { DIALER_SCRIPT, LEADS } from "@/lib/os-demo";
import { useDialer } from "@/components/os/DialerDock";

export default function DialerPage() {
  const { dial, lead, call } = useDialer();
  const queue = LEADS.filter((l) => l.kind === "lead");
  const s = call ? Math.floor((Date.now() - call.t0) / 1000) : 0;
  const clock = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="grid h-full min-h-0 grid-cols-[280px_1fr]">
      <div className="overflow-auto border-r" style={{ borderColor: "var(--hairline)", background: "var(--surface-raised)" }}>
        <div className="flex items-center justify-between border-b px-3.5 py-3 text-sm font-semibold" style={{ borderColor: "var(--hairline)" }}>
          Call list · {queue.length}
        </div>
        {queue.map((l) => (
          <button
            key={l.id}
            onClick={() => dial(l.id)}
            className="block w-full border-b px-3.5 py-3 text-left"
            style={{
              background: lead?.id === l.id ? "var(--brand-dim)" : "transparent",
              borderColor: "var(--hairline)",
            }}
          >
            <div className="text-[13.5px] font-semibold">{l.company}</div>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{l.name} · {l.phone}</div>
          </button>
        ))}
      </div>
      <div className="overflow-auto p-6">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="m-0 text-[28px]">{lead ? `Live · ${lead.name}` : "Twilio lines idle"}</h3>
            <p className="mt-2 max-w-[560px] text-[13.5px]" style={{ color: "var(--text-secondary)" }}>
              {lead ? lead.note : "Click a shop. Four lines. We're selling sites and the machine — not taking roof calls."}
            </p>
          </div>
          <div className="font-mono text-[28px]">{lead ? clock : "0:00"}</div>
        </div>
        <div className="mt-5 rounded-r-xl border-l-[3px] p-4 text-[13.5px] leading-relaxed whitespace-pre-wrap" style={{ background: "var(--surface-inset)", borderColor: "var(--brand)" }}>
          {DIALER_SCRIPT}
        </div>
      </div>
    </div>
  );
}
