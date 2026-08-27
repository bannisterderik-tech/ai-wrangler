"use client";

import { useMemo, useState } from "react";
import { PROSPECTS, PROSPECT_STAGES, money } from "@/lib/os-demo";
import { DeskBar, Dossier, Kv, Rail, RollItem, Tabs } from "@/components/os/Dossier";

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
  const [view, setView] = useState<"list" | "kanban">("list");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("value");
  const shown = useMemo(() => {
    let r = rows.slice();
    const qq = q.toLowerCase();
    if (qq) r = r.filter((x) => (x.name + x.city + x.trade + x.pain).toLowerCase().includes(qq));
    r.sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : b.value - a.value));
    return r;
  }, [rows, q, sort]);
  const r = shown.find((x) => x.id === id) || shown[0] || rows[0];

  const body = {
    overview: <Kv rows={[["Trade", r.trade], ["Market", r.city], ["Stage", PROSPECT_STAGES[r.stage]], ["Retainer", `${money(r.value)}/mo`], ["Why now", r.pain], ["Demo", r.demo || "not booked"], ["Crew", String(r.employees)], ["Jobs / mo", String(r.jobsMo)]]} />,
    people: <Kv rows={[["Decision maker", r.dm], ["Role", r.role], ["Phone", r.phone], ["Email", r.email]]} />,
    discovery: <Kv rows={[["Pain", r.pain], ["Stack today", r.stack], ["Why us", r.why]]} />,
    sequence: <div className="text-[13px]">{["Day 0 · Loom of the Apex rebuild", "Day 1 · Call the owner", "Day 3 · SMS the demo hold", "Day 7 · Proposal", "Day 10 · Isolation walkthrough"].map((t, i) => <label key={t} className="mb-2 flex gap-2"><input type="checkbox" checked={i < r.stage} readOnly />{t}</label>)}</div>,
    deal: <Kv rows={[["MRR", `${money(r.value)}/mo`], ["Onboarding", "Rebuild in 10 + DID + Zernio"], ["Term", "12 mo"], ["Status", PROSPECT_STAGES[r.stage]]]} />,
    history: <p className="text-[13px]">{r.why}</p>,
  }[tab];

  const bar = (
    <DeskBar>
      <button className={`btn-os ${view === "list" ? "brand" : ""}`} onClick={() => setView("list")}>List</button>
      <button className={`btn-os ${view === "kanban" ? "brand" : ""}`} onClick={() => setView("kanban")}>Kanban</button>
      <input className="btn-os min-w-[160px]" placeholder="Search prospects…" value={q} onChange={(e) => setQ(e.target.value)} />
      <select className="btn-os" value={sort} onChange={(e) => setSort(e.target.value)}>
        <option value="value">Sort: retainer</option>
        <option value="name">Sort: name</option>
      </select>
    </DeskBar>
  );

  if (view === "kanban") {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {bar}
        <div className="grid min-h-0 flex-1 auto-cols-[minmax(200px,1fr)] grid-flow-col gap-2 overflow-auto p-3">
          {PROSPECT_STAGES.map((name, i) => (
            <div key={name} className="flex min-h-0 flex-col rounded-xl border p-2" style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)" }}>
              <div className="flex justify-between px-1 py-2 text-[11px] uppercase" style={{ color: "var(--text-secondary)" }}><span>{name}</span><span>{shown.filter((x) => x.stage === i).length}</span></div>
              {shown.filter((x) => x.stage === i).map((x) => (
                <button key={x.id} className="mb-2 rounded-xl border p-3 text-left" style={{ background: "var(--surface-inset)", borderColor: "var(--hairline)" }} onClick={() => { setId(x.id); setView("list"); }}>
                  <b>{x.name}</b>
                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{x.dm} · {money(x.value)}/mo</div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
    {bar}
    <Dossier
      list={shown.map((x) => (
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
    </div>
  );
}
