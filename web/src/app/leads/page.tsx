"use client";

import { useMemo, useState } from "react";
import { DIALER_SCRIPT, LEADS, STAGES, money } from "@/lib/os-demo";
import { useDialer } from "@/components/os/DialerDock";
import { DeskBar, Dossier, Kv, Rail, Tabs } from "@/components/os/Dossier";

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
  const all = useMemo(() => LEADS.filter((l) => l.kind !== "partner").map((l) => ({ ...l })), []);
  const [rows, setRows] = useState(all);
  const [id, setId] = useState(all[0].id);
  const [tab, setTab] = useState("overview");
  const [view, setView] = useState<"list" | "kanban">("list");
  const [q, setQ] = useState("");
  const [trade, setTrade] = useState("all");
  const [stage, setStage] = useState("all");
  const [sort, setSort] = useState("score");

  const trades = useMemo(() => [...new Set(all.map((l) => l.trade))], [all]);
  const shown = useMemo(() => {
    let r = rows.slice();
    if (trade !== "all") r = r.filter((l) => l.trade === trade);
    if (stage !== "all") r = r.filter((l) => String(l.stage) === stage);
    const qq = q.toLowerCase();
    if (qq) r = r.filter((l) => (l.company + l.name + l.city + l.note + l.src).toLowerCase().includes(qq));
    r.sort((a, b) => {
      if (sort === "company") return a.company.localeCompare(b.company);
      if (sort === "value") return b.value - a.value;
      if (sort === "sla") return b.sla - a.sla;
      if (sort === "stage") return a.stage - b.stage;
      return b.score - a.score;
    });
    return r;
  }, [rows, q, trade, stage, sort]);

  const l = shown.find((x) => x.id === id) || shown[0] || rows[0];
  const temp = l.score > 85 ? "hot" : l.score > 70 ? "warm" : "cold";
  const script = DIALER_SCRIPT.replace("{name}", l.name.split(" ")[0]).replace("{company}", l.company).replace("{job}", l.note);

  function move(lid: string, dir: number) {
    setRows((allRows) =>
      allRows.map((x) => (x.id === lid ? { ...x, stage: Math.max(0, Math.min(STAGES.length - 1, x.stage + dir)) } : x)),
    );
    setId(lid);
  }

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
    scope: <Kv rows={[["Build", "Site · GBP · LSA · Twilio 60s SLA"], ["Not in scope", "Their own customer jobs. That lives in their software, not ours."]]} />,
    comms: <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{script}</p>,
    tasks: <div className="text-[13px]">{["Call the owner", "Book 20-min teardown", "Send Apex case study"].map((t) => <label key={t} className="mb-2 flex gap-2"><input type="checkbox" />{t}</label>)}</div>,
    money: <Kv rows={[["Retainer", `${money(l.value)}/mo`], ["Term", "12 mo"], ["Competing with", "Angi / DIY ads"]]} />,
    files: <p style={{ color: "var(--text-secondary)" }}>Drop the site audit and the proposal here.</p>,
    source: <Kv rows={[["How they found us", l.src], ["First touch", "today"]]} />,
  }[tab];

  const dossier = (
    <>
      <div className="border-b px-4 pt-4 pb-2" style={{ borderColor: "var(--hairline)" }}>
        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--brand-text)" }}>{l.trade} · {temp}</div>
        <h3 className="mt-1 mb-1 text-[24px]">{l.company}</h3>
        <div className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>{l.name} · {l.phone} · {l.city}</div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button className="btn-os brand" onClick={() => dial(l.id)}>Call</button>
          <a className="btn-os no-underline" href="/inbox">Inbox</a>
          <button className="btn-os" onClick={() => move(l.id, 1)}>Advance</button>
        </div>
      </div>
      <Tabs tabs={TABS} tab={tab} onTab={setTab} />
      <div className="min-h-0 flex-1 overflow-auto p-4">{body}</div>
    </>
  );

  const bar = (
    <DeskBar>
      <button className={`btn-os ${view === "list" ? "brand" : ""}`} onClick={() => setView("list")}>List</button>
      <button className={`btn-os ${view === "kanban" ? "brand" : ""}`} onClick={() => setView("kanban")}>Kanban</button>
      <input className="btn-os min-w-[180px]" placeholder="Search companies, owners, pain…" value={q} onChange={(e) => setQ(e.target.value)} />
      <select className="btn-os" value={trade} onChange={(e) => setTrade(e.target.value)}>
        <option value="all">All trades</option>
        {trades.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <select className="btn-os" value={stage} onChange={(e) => setStage(e.target.value)}>
        <option value="all">All stages</option>
        {STAGES.map((n, i) => <option key={n} value={String(i)}>{n}</option>)}
      </select>
      <select className="btn-os" value={sort} onChange={(e) => setSort(e.target.value)}>
        <option value="score">Sort: score</option>
        <option value="value">Sort: retainer</option>
        <option value="sla">Sort: SLA</option>
        <option value="company">Sort: name</option>
        <option value="stage">Sort: stage</option>
      </select>
    </DeskBar>
  );

  if (view === "kanban") {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {bar}
        <div className="grid min-h-0 flex-1 auto-cols-[minmax(220px,1fr)] grid-flow-col gap-2.5 overflow-auto p-3">
          {STAGES.map((name, i) => {
            const cards = shown.filter((r) => r.stage === i);
            return (
              <div key={name} className="flex min-h-0 flex-col rounded-xl border" style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)" }}>
                <div className="flex justify-between px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                  <span>{name}</span><span>{cards.length}</span>
                </div>
                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto px-2 pb-2">
                  {cards.map((r) => (
                    <div key={r.id} className="rounded-xl border p-3 text-left" style={{ background: "var(--surface-inset)", borderColor: r.id === l.id ? "var(--brand)" : "var(--hairline)" }}>
                      <button className="w-full text-left" onClick={() => { setId(r.id); setTab("overview"); }}>
                        <b className="text-[13.5px]">{r.company}</b>
                        <div className="mt-1 text-[11.5px]" style={{ color: "var(--text-secondary)" }}>{r.name} · {money(r.value)}/mo</div>
                        <div className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>{r.note}</div>
                      </button>
                      <div className="mt-2 flex justify-end gap-1">
                        <button className="btn-os" onClick={() => dial(r.id)}>Call</button>
                        {i > 0 ? <button className="btn-os" onClick={() => move(r.id, -1)}>‹</button> : null}
                        {i < STAGES.length - 1 ? <button className="btn-os brand" onClick={() => move(r.id, 1)}>›</button> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {bar}
      <Dossier
        list={
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                {["Company", "Owner", "Trade", "Stage", "Retainer", "Score"].map((h) => (
                  <th key={h} className="sticky top-0 border-b px-3 py-2" style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} onClick={() => { setId(r.id); setTab("overview"); }} className="cursor-pointer" style={{ background: r.id === l.id ? "var(--brand-dim)" : "transparent" }}>
                  <td className="border-b px-3 py-2" style={{ borderColor: "var(--hairline)" }}><b>{r.company}</b></td>
                  <td className="border-b px-3 py-2" style={{ borderColor: "var(--hairline)" }}>{r.name}</td>
                  <td className="border-b px-3 py-2" style={{ borderColor: "var(--hairline)" }}>{r.trade}</td>
                  <td className="border-b px-3 py-2" style={{ borderColor: "var(--hairline)" }}>{STAGES[r.stage]}</td>
                  <td className="border-b px-3 py-2 font-mono" style={{ borderColor: "var(--hairline)" }}>{money(r.value)}</td>
                  <td className="border-b px-3 py-2 font-mono" style={{ borderColor: "var(--hairline)" }}>{r.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
        rail={
          <>
            <Rail title={`Call ${l.name.split(" ")[0]} at ${l.company}`} why={l.note} onDo={() => dial(l.id)} />
            <div className="mt-4 rounded-r-xl border-l-[3px] p-3 text-[12.5px] leading-relaxed" style={{ borderColor: "var(--brand)", background: "var(--surface-inset)" }}>{script}</div>
          </>
        }
      >
        {dossier}
      </Dossier>
    </div>
  );
}
