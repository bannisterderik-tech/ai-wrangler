"use client";

import { useMemo, useState } from "react";
import { DIALER_SCRIPT, LEADS, STAGES, money } from "@/lib/os-demo";
import { useDialer } from "@/components/os/DialerDock";
import { Dossier, Kv, Rail, RollItem, Tabs } from "@/components/os/Dossier";

const TABS: [string, string][] = [
  ["overview", "Overview"],
  ["discovery", "Discovery"],
  ["scope", "Scope"],
  ["comms", "Comms"],
  ["tasks", "Tasks"],
  ["money", "Money"],
  ["files", "Files"],
  ["source", "Source"],
];

export default function LeadsPage() {
  const { dial } = useDialer();
  const rows = useMemo(() => LEADS.filter((l) => l.kind !== "partner"), []);
  const [id, setId] = useState(rows[0].id);
  const [tab, setTab] = useState("overview");
  const l = rows.find((x) => x.id === id) || rows[0];
  const temp = l.score > 85 ? "hot" : l.score > 70 ? "warm" : "cold";
  const script = DIALER_SCRIPT.replace("{name}", l.name.split(" ")[0]).replace("{company}", l.company).replace("{job}", l.note);

  const body = {
    overview: (
      <Kv rows={[
        ["Company", <b key="co">{l.company}</b>],
        ["Trade", l.trade],
        ["Market", l.city],
        ["Contact", `${l.name} · owner`],
        ["Stage", STAGES[l.stage]],
        ["Score", `${l.score} · ${temp}`],
        ["Phone", l.phone],
        ["Source", l.src],
      ]} />
    ),
    discovery: <Kv rows={[["Pain", l.note], ["Why Wrangler", "Site + ads + Twilio + isolation — not another web guy"]]} />,
    scope: <Kv rows={[["Build", "Site · GBP · LSA · Twilio 60s SLA"], ["Not in scope", "Their homeowner jobs. That's their CRM. We don't take roof calls."]]} />,
    comms: <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{script}</p>,
    tasks: <div className="text-[13px]">{["Call the owner", "Book 20-min teardown", "Send Apex case study"].map((t) => <label key={t} className="mb-2 flex gap-2"><input type="checkbox" />{t}</label>)}</div>,
    money: <Kv rows={[["Retainer", `${money(l.value)}/mo`], ["Term", "12 mo"], ["Competing with", "Angi / DIY ads"]]} />,
    files: <p style={{ color: "var(--text-secondary)" }}>Drop the site audit and the proposal here.</p>,
    source: <Kv rows={[["How they found us", l.src], ["First touch", "today"]]} />,
  }[tab];

  return (
    <Dossier
      list={rows.map((r) => (
        <RollItem key={r.id} on={r.id === l.id} title={r.company} meta={`${r.name} · ${STAGES[r.stage]} · ${money(r.value)}/mo`} onClick={() => { setId(r.id); setTab("overview"); }} />
      ))}
      rail={
        <>
          <Rail title={`Call ${l.name.split(" ")[0]} at ${l.company}`} why={l.note} onDo={() => dial(l.id)} />
          <div className="mt-4 rounded-r-xl border-l-[3px] p-3 text-[12.5px] leading-relaxed" style={{ borderColor: "var(--brand)", background: "var(--surface-inset)" }}>{script}</div>
        </>
      }
    >
      <div className="border-b px-4 pt-4 pb-2" style={{ borderColor: "var(--hairline)" }}>
        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--brand-text)" }}>{l.trade} · {temp}</div>
        <h3 className="mt-1 mb-1 text-[24px]">{l.company}</h3>
        <div className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>{l.name} · {l.phone} · {l.city}</div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button className="btn-os brand" onClick={() => dial(l.id)}>Call</button>
          <a className="btn-os no-underline" href="/inbox">Inbox</a>
        </div>
      </div>
      <Tabs tabs={TABS} tab={tab} onTab={setTab} />
      <div className="min-h-0 flex-1 overflow-auto p-4">{body}</div>
    </Dossier>
  );
}
