"use client";

import { useMemo, useState } from "react";
import { DIALER_SCRIPT, LEADS, STAGES, customerName } from "@/lib/os-demo";
import { useDialer } from "@/components/os/DialerDock";
import { Dossier, Kv, Rail, RollItem, Tabs } from "@/components/os/Dossier";

const TABS: [string, string][] = [
  ["overview", "Overview"],
  ["job", "Job"],
  ["comms", "Comms"],
  ["tasks", "Tasks"],
  ["money", "Money"],
  ["files", "Files"],
  ["attrib", "Source"],
  ["history", "History"],
];

export default function LeadsPage() {
  const { dial } = useDialer();
  const rows = useMemo(() => LEADS.filter((l) => l.kind !== "partner"), []);
  const [id, setId] = useState(rows[0].id);
  const [tab, setTab] = useState("overview");
  const l = rows.find((x) => x.id === id) || rows[0];
  const temp = l.score > 85 ? "hot" : l.score > 70 ? "warm" : "cold";
  const script = DIALER_SCRIPT.replace("{name}", l.name.split(" ")[0]).replace("{company}", customerName(l.cust)).replace("{job}", l.note);

  const body = {
    overview: (
      <Kv rows={[
        ["Book", <><b>{customerName(l.cust)}</b></>],
        ["Stage", STAGES[l.stage]],
        ["Score", `${l.score} · ${temp}`],
        ["SLA", l.sla ? `${l.sla}s` : "ok"],
        ["Phone", l.phone],
        ["City", l.city],
        ["Source", l.src],
        ["Consent", "Call · SMS · callable"],
      ]} />
    ),
    job: <Kv rows={[["Issue", l.note], ["Trade", customerName(l.cust)], ["Urgency", l.sla ? "inside the hour" : "scheduled"]]} />,
    comms: <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{script}</p>,
    tasks: <div className="text-[13px]">{["Speed-to-lead call", "SMS confirm", "Book estimate"].map((t) => <label key={t} className="mb-2 flex gap-2"><input type="checkbox" />{t}</label>)}</div>,
    money: <Kv rows={[["Estimate", "not priced"], ["Financing", "—"], ["Competitors", "in market"]]} />,
    files: <p style={{ color: "var(--text-secondary)" }}>Photos of the pain close claims. Drop them here when the app is live.</p>,
    attrib: <Kv rows={[["Campaign", l.src], ["Network", l.src], ["First touch", "today"]]} />,
    history: <p className="text-[13px]">{l.src} → {l.note}</p>,
  }[tab];

  return (
    <Dossier
      list={rows.map((r) => (
        <RollItem key={r.id} on={r.id === l.id} title={r.name} meta={`${customerName(r.cust)} · ${STAGES[r.stage]} · ${r.sla ? r.sla + "s" : "ok"}`} onClick={() => { setId(r.id); setTab("overview"); }} />
      ))}
      rail={
        <>
          <Rail title={`Call ${l.name.split(" ")[0]} now`} why={l.note} onDo={() => dial(l.id)} />
          <div className="mt-4 rounded-r-xl border-l-[3px] p-3 text-[12.5px] leading-relaxed" style={{ borderColor: "var(--brand)", background: "var(--surface-inset)" }}>{script}</div>
        </>
      }
    >
      <div className="border-b px-4 pt-4 pb-2" style={{ borderColor: "var(--hairline)" }}>
        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--brand-text)" }}>{l.kind} · {temp}</div>
        <h3 className="mt-1 mb-1 text-[24px]">{l.name}</h3>
        <div className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>{l.phone} · {l.city} · {customerName(l.cust)}</div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button className="btn-os brand" onClick={() => dial(l.id)}>Call</button>
          <a className="btn-os no-underline" href="/sms">SMS</a>
        </div>
      </div>
      <Tabs tabs={TABS} tab={tab} onTab={setTab} />
      <div className="min-h-0 flex-1 overflow-auto p-4">{body}</div>
    </Dossier>
  );
}
