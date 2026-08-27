"use client";

import { useMemo, useState } from "react";
import { LEADS, SMS_TEMPLATES, customerName } from "@/lib/os-demo";
import { useDialer } from "@/components/os/DialerDock";

type Msg = { dir: "in" | "out"; t: string };

const SEED: Record<string, Msg[]> = {
  L1: [{ dir: "in", t: "Roof leaking over the garage since last night." }, { dir: "out", t: "On it. Can you take a 2-min call?" }],
  L3: [{ dir: "out", t: "Furnace crew is 40 min out. Stay warm." }],
  L8: [{ dir: "out", t: "Sending you the Red Bluff reroof that came in at 8:14." }, { dir: "in", t: "Got it. I'll take it." }],
};

export default function SmsPage() {
  const { dial } = useDialer();
  const [id, setId] = useState("L1");
  const [convos, setConvos] = useState<Record<string, Msg[]>>(SEED);
  const [body, setBody] = useState("");
  const l = LEADS.find((x) => x.id === id) || LEADS[0];
  const msgs = convos[l.id] || [];
  const company = customerName(l.cust);

  const fill = useMemo(() => {
    return (tpl: string) =>
      tpl.replace("{name}", l.name.split(" ")[0]).replace("{company}", company).replace("{job}", l.note).replace("{city}", l.city);
  }, [l, company]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setConvos((c) => ({ ...c, [l.id]: [...(c[l.id] || []), { dir: "out", t: text }] }));
    setBody("");
    await fetch("/api/twilio/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: l.phone, body: text }),
    }).catch(() => {});
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-[320px_1fr]">
      <div className="overflow-auto border-r" style={{ borderColor: "var(--hairline)", background: "var(--surface-raised)" }}>
        {LEADS.map((x) => (
          <button key={x.id} onClick={() => setId(x.id)} className="block w-full border-b px-3.5 py-3 text-left" style={{ background: x.id === id ? "var(--brand-dim)" : "transparent", borderColor: "var(--hairline)" }}>
            <div className="text-[13.5px] font-semibold">{x.name} <span className="text-[10px] uppercase" style={{ color: "var(--text-secondary)" }}>{x.kind}</span></div>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{customerName(x.cust)} · {x.phone}</div>
          </button>
        ))}
      </div>
      <div className="flex min-h-0 flex-col">
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--hairline)" }}>
          <div>
            <b>{l.name}</b>
            <div className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>{l.phone} · Twilio A2P · {company}</div>
          </div>
          <button className="btn-os brand" onClick={() => dial(l.id)}>Call</button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-4">
          {msgs.map((m, i) => (
            <div key={i} className={`max-w-[72%] rounded-[14px] px-3 py-2 text-[13.5px] ${m.dir === "out" ? "self-end text-white" : "self-start"}`} style={{ background: m.dir === "out" ? "var(--brand)" : "var(--surface-inset)" }}>
              {m.t}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 px-3 pt-2">
          {SMS_TEMPLATES.map((t) => (
            <button key={t.id} className="btn-os" onClick={() => setBody(fill(t.body))}>{t.name}</button>
          ))}
        </div>
        <form onSubmit={send} className="flex gap-2 border-t p-3" style={{ borderColor: "var(--hairline)" }}>
          <textarea className="min-h-11 flex-1 resize-none rounded-xl border px-3 py-2 text-[13.5px]" style={{ background: "var(--surface-inset)", borderColor: "var(--hairline)" }} value={body} onChange={(e) => setBody(e.target.value)} placeholder="SMS via Twilio — opted-in only" />
          <button className="btn-os brand" type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}
