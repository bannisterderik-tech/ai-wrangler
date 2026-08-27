"use client";

import { useState } from "react";
import Link from "next/link";
import { ADS, CUSTOMERS, LEADS, customerName, money } from "@/lib/os-demo";
import { Dossier, Kv, Rail, RollItem, Tabs } from "@/components/os/Dossier";

const TABS: [string, string][] = [
  ["overview", "Overview"],
  ["people", "People"],
  ["funnel", "Funnel"],
  ["build", "Build"],
  ["dominate", "Dominate"],
  ["phone", "Phone"],
  ["money", "Money"],
  ["memory", "Memory"],
  ["walls", "Walls"],
];

export default function CustomersPage() {
  const [id, setId] = useState<string>(CUSTOMERS[0].id);
  const [tab, setTab] = useState("overview");
  const c = CUSTOMERS.find((x) => x.id === id) || CUSTOMERS[0];
  const ads = ADS.filter((a) => a.cust === c.id);
  const leads = LEADS.filter((l) => l.cust === c.id);
  const inPlay = leads.filter((l) => l.stage < 4).length;

  const body = {
    overview: <Kv rows={[["Trade", c.trade], ["Market", c.city], ["Rank", `#${c.rank} · ${c.share}`], ["Retainer", `${money(c.mrr)}/mo`], ["Live leads", String(inPlay)]]} />,
    people: <p className="text-[13px]">Owner, CSR, estimator live on this book. Call/SMS from the lead desk, isolated to this customer.</p>,
    funnel: <div>{leads.map((l) => <div key={l.id} className="flex justify-between border-b py-2 text-[13px]" style={{ borderColor: "var(--hairline)" }}><span>{l.name}</span><span style={{ color: "var(--text-secondary)" }}>{l.note}</span></div>)}</div>,
    build: <Kv rows={[["GitHub", `${c.id}/site`], ["Vercel", `${c.id}.vercel.app`], ["Jobs", "isolated worktree"]]} />,
    dominate: <div>{ads.map((a) => <div key={a.id} className="flex justify-between border-b py-2 text-[13px]" style={{ borderColor: "var(--hairline)" }}><span>{a.name}</span><span className="font-mono">{a.platform} · {money(a.spend)}</span></div>)}</div>,
    phone: <Kv rows={[["DID", "one number, this book only"], ["A2P", "10DLC per brand"], ["Missed call", "SMS in 20s"]]} />,
    money: <Kv rows={[["Retainer", `${money(c.mrr)}/mo`], ["Ads 30d", money(ads.reduce((s, a) => s + a.spend, 0))], ["Twilio", "metered"], ["AI", "capped per job"]]} />,
    memory: <p className="text-[13.5px] leading-relaxed">House rules, brand voice, busy season — the AI reads this before it writes a word a homeowner could see.</p>,
    walls: <Kv rows={[["Repo", "unique"], ["Vercel token", "theirs"], ["Zernio profile", "theirs"], ["Twilio DID", "not shared"]]} />,
  }[tab];

  return (
    <Dossier
      list={CUSTOMERS.map((r) => (
        <RollItem key={r.id} on={r.id === c.id} title={r.name} meta={`${r.city} · #${r.rank} · ${money(r.mrr)}/mo`} onClick={() => { setId(r.id); setTab("overview"); }} />
      ))}
      rail={<Rail title="Open their pipeline" why={`${inPlay} leads in play for ${customerName(c.id)}. Isolation is on.`} onDo={() => { window.location.href = "/pipeline"; }} />}
    >
      <div className="border-b px-4 pt-4 pb-2" style={{ borderColor: "var(--hairline)" }}>
        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--brand-text)" }}>{c.trade}</div>
        <h3 className="mt-1 mb-1 text-[24px]">{c.name}</h3>
        <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{c.city} · rank #{c.rank} · {c.share} share</div>
        <div className="mt-3 flex gap-1.5">
          <Link href="/pipeline" className="btn-os brand no-underline">Pipeline</Link>
          <Link href="/ads" className="btn-os no-underline">Ads</Link>
        </div>
      </div>
      <Tabs tabs={TABS} tab={tab} onTab={setTab} />
      <div className="min-h-0 flex-1 overflow-auto p-4">{body}</div>
    </Dossier>
  );
}
