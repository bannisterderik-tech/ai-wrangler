"use client";

import { useState } from "react";
import { DIALER_SCRIPT, LEADS, customerName } from "@/lib/os-demo";
import { useDialer } from "@/components/os/DialerDock";

export default function LeadsPage() {
  const { dial } = useDialer();
  const [id, setId] = useState(LEADS[0].id);
  const l = LEADS.find((x) => x.id === id) || LEADS[0];

  return (
    <div className="grid h-full min-h-0 grid-cols-[1fr_380px]">
      <div className="min-h-0 overflow-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              {["Name", "Book", "Kind", "Source", "Score", "SLA", ""].map((h) => (
                <th key={h} className="sticky top-0 border-b px-3 py-2.5" style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LEADS.map((x) => (
              <tr key={x.id} onClick={() => setId(x.id)} className="cursor-pointer" style={{ background: x.id === id ? "var(--brand-dim)" : "transparent" }}>
                <td className="border-b px-3 py-2.5" style={{ borderColor: "var(--hairline)" }}>
                  <b>{x.name}</b>
                  <div className="font-mono text-[11px]" style={{ color: "var(--text-secondary)" }}>{x.phone}</div>
                </td>
                <td className="border-b px-3 py-2.5" style={{ borderColor: "var(--hairline)" }}>{customerName(x.cust)}</td>
                <td className="border-b px-3 py-2.5" style={{ borderColor: "var(--hairline)" }}>{x.kind}</td>
                <td className="border-b px-3 py-2.5" style={{ borderColor: "var(--hairline)" }}>{x.src}</td>
                <td className="border-b px-3 py-2.5 font-mono" style={{ borderColor: "var(--hairline)" }}>{x.score}</td>
                <td className="border-b px-3 py-2.5 font-mono" style={{ borderColor: "var(--hairline)", color: x.sla > 45 ? "var(--state-failed)" : x.sla ? "var(--state-blocked)" : "var(--state-running)" }}>{x.sla ? `${x.sla}s` : "ok"}</td>
                <td className="border-b px-3 py-2.5" style={{ borderColor: "var(--hairline)" }}>
                  <button className="btn-os brand" onClick={(e) => { e.stopPropagation(); dial(x.id); }}>Call</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <aside className="overflow-auto border-l p-4" style={{ borderColor: "var(--hairline)", background: "var(--surface-raised)" }}>
        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--brand-text)" }}>{l.kind}</div>
        <h3 className="mt-2 mb-1 text-[22px]">{l.name}</h3>
        <div className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>{l.phone} · {l.city}</div>
        <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{l.note}</p>
        <div className="my-3 flex gap-2">
          <button className="btn-os brand" onClick={() => dial(l.id)}>Twilio call</button>
        </div>
        <div className="rounded-r-xl border-l-[3px] p-3 text-[13.5px] leading-relaxed" style={{ background: "var(--surface-inset)", borderColor: "var(--brand)" }}>
          {DIALER_SCRIPT.replace("{name}", l.name.split(" ")[0]).replace("{company}", customerName(l.cust)).replace("{job}", l.note)}
        </div>
      </aside>
    </div>
  );
}
