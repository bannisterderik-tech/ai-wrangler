"use client";

import { useState } from "react";
import { PROSPECTS, PROSPECT_STAGES, money } from "@/lib/os-demo";
import { Dossier, Kv, Rail, RollItem, Tabs } from "@/components/os/Dossier";

const TABS: [string, string][] = [
  ["overview", "Overview"],
  ["people", "People"],
  ["discovery", "Discovery"],
  ["sequence", "Sequence"],
  ["deal", "Deal"],
  ["history", "History"],
];

export default function ProspectsPage() {
  const [rows, setRows] = useState(PROSPECTS.map((p) => ({ ...p })));
  const [id, setId] = useState(rows[0].id);
  const [tab, setTab] = useState("overview");
  const r = rows.find((x) => x.id === id) || rows[0];

  const body = {
    overview: <Kv rows={[["Trade", r.trade], ["Market", r.city], ["Stage", PROSPECT_STAGES[r.stage]], ["Retainer", `${money(r.value)}/mo`], ["Why now", r.pain], ["Demo", r.demo || "not booked"], ["Crew", String(r.employees)], ["Jobs / mo", String(r.jobsMo)]]} />,
    people: <Kv rows={[["Decision maker", r.dm], ["Role", r.role], ["Phone", r.phone], ["Email", r.email]]} />,
    discovery: <Kv rows={[["Pain", r.pain], ["Stack today", r.stack], ["Why us", r.why]]} />,
    sequence: <div className="text-[13px]">{["Day 0 · Loom of Apex storm page", "Day 1 · Call the owner", "Day 3 · SMS the demo hold", "Day 7 · Proposal", "Day 10 · Isolation walkthrough"].map((t, i) => <label key={t} className="mb-2 flex gap-2"><input type="checkbox" checked={i < r.stage} readOnly />{t}</label>)}</div>,
    deal: <Kv rows={[["MRR", `${money(r.value)}/mo`], ["Onboarding", "Storm 90 + DID + Zernio"], ["Term", "12 mo"], ["Status", PROSPECT_STAGES[r.stage]]]} />,
    history: <p className="text-[13px]">{r.why}</p>,
  }[tab];

  return (
    <Dossier
      list={rows.map((x) => (
        <RollItem key={x.id} on={x.id === r.id} title={x.name} meta={`${x.city} · ${PROSPECT_STAGES[x.stage]} · ${money(x.value)}/mo`} onClick={() => { setId(x.id); setTab("overview"); }} />
      ))}
      rail={<Rail title={r.stage >= 3 ? "Kick off onboarding" : `Call ${r.dm.split(" ")[0]}`} why={r.why} onDo={() => {}} />}
    >
      <div className="border-b px-4 pt-4 pb-2" style={{ borderColor: "var(--hairline)" }}>
        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--brand-text)" }}>{r.trade}</div>
        <h3 className="mt-1 mb-1 text-[24px]">{r.name}</h3>
        <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{r.dm} · {r.phone} · {r.city}</div>
        <div className="mt-3 flex gap-1.5">
          <button className="btn-os brand" onClick={() => setRows((all) => all.map((x) => x.id === r.id ? { ...x, stage: Math.min(3, x.stage + 1) } : x))}>Advance</button>
        </div>
      </div>
      <Tabs tabs={TABS} tab={tab} onTab={setTab} />
      <div className="min-h-0 flex-1 overflow-auto p-4">{body}</div>
    </Dossier>
  );
}
