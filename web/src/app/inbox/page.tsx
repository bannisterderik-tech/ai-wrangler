"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LEADS, SMS_TEMPLATES } from "@/lib/os-demo";
import { useDialer } from "@/components/os/DialerDock";

type Msg = { dir: "in" | "out"; t: string; ch?: string };
type Thread = {
  id: string;
  name: string;
  phone: string;
  kind: string;
  via: string;
  book: string;
  preview: string;
  unread: boolean;
  sla: number;
  wrangle: boolean;
  task?: string;
};

const SEED: Record<string, Msg[]> = {
  L1: [{ dir: "in", t: "Saw what you did for Apex. Can you do the site + ads for us?" }, { dir: "out", t: "Yes. 20 min teardown this week." }],
  L2: [{ dir: "in", t: "Our CSR is drowning and nights go to voicemail." }],
  L8: [{ dir: "out", t: "Sending you a Redding roofer who needs a site." }, { dir: "in", t: "Got it. I'll intro." }],
};

const OPS: Thread[] = [
  { id: "I1", name: "Maya @ Apex", phone: "", kind: "client", via: "sms", book: "Apex Roofing", preview: "Can the AI text storm leads in under a minute?", unread: true, sla: 0, wrangle: true, task: "Turn on 60s SMS SLA" },
  { id: "I2", name: "Dev @ Cascade", phone: "", kind: "client", via: "email", book: "Cascade HVAC", preview: "We're losing after-hours calls to the big guys.", unread: true, sla: 0, wrangle: true, task: "Night receptionist + Twilio overflow" },
  { id: "VM1", name: "Missed · 530-555-4401", phone: "+1 530 555 4401", kind: "lead", via: "vm", book: "Summit Roofing", preview: "Voicemail 0:18 — need a website like Apex, please call", unread: true, sla: 92, wrangle: false },
];

const CHANS: [string, string][] = [
  ["all", "All"],
  ["unread", "Unread"],
  ["sms", "SMS"],
  ["email", "Email"],
  ["call", "Calls / VM"],
  ["wrangle", "Needs a job"],
];

export default function InboxPage() {
  const { dial } = useDialer();
  const router = useRouter();
  const [chan, setChan] = useState("all");
  const [id, setId] = useState("L1");
  const [convos, setConvos] = useState<Record<string, Msg[]>>(SEED);
  const [body, setBody] = useState("");
  const [wrangled, setWrangled] = useState<Record<string, boolean>>({});

  const all: Thread[] = useMemo(() => {
    const leadThreads: Thread[] = LEADS.map((l) => {
      const msgs = convos[l.id] || [];
      const last = msgs[msgs.length - 1];
      return {
        id: l.id,
        name: l.name,
        phone: l.phone,
        kind: l.kind === "partner" ? "partner" : "lead",
        via: "sms",
        book: l.company,
        preview: last?.t || l.note,
        unread: msgs.length === 0 || last?.dir === "in",
        sla: l.sla,
        wrangle: false,
      };
    });
    const ops = OPS.map((t) => ({
      ...t,
      unread: t.wrangle ? !wrangled[t.id] && !convos[t.id]?.some((m) => m.dir === "out") : t.unread && !convos[t.id]?.length,
    }));
    return [...leadThreads, ...ops];
  }, [convos, wrangled]);

  const list = all.filter((t) => {
    if (chan === "unread") return t.unread;
    if (chan === "sms") return t.via === "sms";
    if (chan === "email") return t.via === "email";
    if (chan === "call") return t.via === "vm" || t.via === "call";
    if (chan === "wrangle") return t.wrangle;
    return true;
  });
  const cur = list.find((t) => t.id === id) || list[0];
  const l = LEADS.find((x) => x.id === cur?.id);
  const msgs = cur
    ? convos[cur.id] || (cur.via === "vm" || cur.wrangle ? [{ dir: "in" as const, t: cur.preview, ch: cur.via }] : [])
    : [];

  const fill = (tpl: string) => {
    if (!l) return tpl;
    return tpl.replace("{name}", l.name.split(" ")[0]).replace("{company}", l.company).replace("{job}", l.note).replace("{city}", l.city);
  };

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!cur || !body.trim()) return;
    const text = body.trim();
    setConvos((c) => ({ ...c, [cur.id]: [...(c[cur.id] || msgs), { dir: "out", t: text }] }));
    setBody("");
    if (cur.via === "sms" || cur.via === "vm") {
      await fetch("/api/twilio/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: cur.phone || l?.phone, body: text }),
      }).catch(() => {});
    }
  }

  async function wrangle() {
    if (!cur) return;
    setWrangled((w) => ({ ...w, [cur.id]: true }));
    await fetch(`/api/inbox/${cur.id}/wrangle`, { method: "POST" }).catch(() => {});
    router.push("/work");
  }

  if (!cur) return <div className="p-6 text-sm" style={{ color: "var(--text-secondary)" }}>Inbox is empty.</div>;

  return (
    <div className="grid h-full min-h-0 grid-cols-[300px_1fr_260px]">
      <div className="min-h-0 overflow-auto border-r" style={{ borderColor: "var(--hairline)", background: "var(--surface-raised)" }}>
        <div className="flex flex-wrap gap-1 border-b p-2" style={{ borderColor: "var(--hairline)" }}>
          {CHANS.map(([cid, label]) => (
            <button key={cid} className={`btn-os ${chan === cid ? "brand" : ""}`} onClick={() => setChan(cid)}>{label}</button>
          ))}
        </div>
        {list.map((t) => (
          <button key={t.id} onClick={() => setId(t.id)} className="block w-full border-b px-3.5 py-3 text-left" style={{ background: t.id === cur.id ? "var(--brand-dim)" : "transparent", borderColor: "var(--hairline)" }}>
            <div className="text-[13.5px] font-semibold">{t.unread ? "● " : ""}{t.name} <span className="text-[10px] uppercase" style={{ color: "var(--text-secondary)" }}>{t.via}</span></div>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{t.book} · {t.kind}{t.sla ? ` · SLA ${t.sla}s` : ""}</div>
            <div className="truncate text-xs" style={{ color: "var(--text-secondary)" }}>{t.preview}</div>
          </button>
        ))}
      </div>
      <div className="flex min-h-0 flex-col">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: "var(--hairline)" }}>
          <div>
            <b>{cur.name}</b>
            <div className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>{cur.phone || cur.via} · {cur.book} · {cur.kind}</div>
          </div>
          <div className="flex gap-1.5">
            {cur.phone ? <button className="btn-os brand" onClick={() => dial(cur.id === "VM1" ? "L2" : cur.id)}>Call</button> : null}
            {cur.wrangle ? <button className="btn-os" onClick={wrangle}>Wrangle</button> : null}
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-4">
          {msgs.map((m, i) => (
            <div key={i} className={`max-w-[72%] rounded-[14px] px-3 py-2 text-[13.5px] ${m.dir === "out" ? "self-end text-white" : "self-start"}`} style={{ background: m.dir === "out" ? "var(--brand)" : "var(--surface-inset)" }}>
              {m.t}
            </div>
          ))}
        </div>
        {cur.via === "sms" || cur.via === "vm" ? (
          <div className="flex flex-wrap gap-1.5 px-3 pt-2">
            {SMS_TEMPLATES.map((t) => (
              <button key={t.id} className="btn-os" onClick={() => setBody(fill(t.body))}>{t.name}</button>
            ))}
          </div>
        ) : null}
        <form onSubmit={send} className="flex gap-2 border-t p-3" style={{ borderColor: "var(--hairline)" }}>
          <textarea className="min-h-11 flex-1 resize-none rounded-xl border px-3 py-2 text-[13.5px]" style={{ background: "var(--surface-inset)", borderColor: "var(--hairline)" }} value={body} onChange={(e) => setBody(e.target.value)} placeholder={cur.via === "email" ? "Reply by email — stays on this customer" : cur.via === "vm" ? "Text them back, then call" : "SMS via Twilio — opted-in only"} />
          <button className="btn-os brand" type="submit">{cur.via === "email" ? "Send email" : "Send"}</button>
        </form>
      </div>
      <aside className="min-h-0 overflow-auto border-l p-3.5" style={{ borderColor: "var(--hairline)", background: "var(--surface-raised)" }}>
        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>One inbox</div>
        <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          SMS, email, Slack, missed calls, voicemail. A Cascade thread never sits on Apex&apos;s DID.
        </p>
        {l ? (
          <div className="mt-4 rounded-xl border p-3" style={{ borderColor: "var(--hairline)" }}>
            <b>{l.name}</b>
            <p className="mt-1 text-[12.5px]" style={{ color: "var(--text-secondary)" }}>{l.company} · {l.note}</p>
            <button className="btn-os brand mt-2" onClick={() => router.push("/leads")}>Open dossier</button>
          </div>
        ) : null}
        {cur.wrangle ? (
          <div className="mt-4 rounded-xl border p-3" style={{ borderColor: "color-mix(in srgb, var(--brand) 40%, var(--hairline))" }}>
            <b>{cur.task}</b>
            <p className="mt-1 mb-2 text-[12.5px]" style={{ color: "var(--text-secondary)" }}>{cur.book} asked. Wrangle hands it to Head Wrangler — isolated.</p>
            <button className="btn-os brand w-full" onClick={wrangle}>Wrangle → job</button>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
