"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ADS, CUSTOMERS, money } from "@/lib/os-demo";
import { DeskBar, Dossier, Kv, Rail, RollItem, Tabs } from "@/components/os/Dossier";

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
  const [q, setQ] = useState("");
  const [trade, setTrade] = useState("all");
  const [sort, setSort] = useState("mrr");
  const trades = useMemo(() => [...new Set(CUSTOMERS.map((c) => c.trade))], []);
  const list = useMemo(() => {
    let r = CUSTOMERS.slice();
    if (trade !== "all") r = r.filter((c) => c.trade === trade);
    const qq = q.toLowerCase();
    if (qq) r = r.filter((c) => (c.name + c.city + c.trade).toLowerCase().includes(qq));
    r.sort((a, b) => (sort === "rank" ? a.rank - b.rank : sort === "name" ? a.name.localeCompare(b.name) : b.mrr - a.mrr));
    return r;
  }, [q, trade, sort]);
  const c = list.find((x) => x.id === id) || list[0] || CUSTOMERS[0];
  const ads = ADS.filter((a) => a.cust === c.id);

  const body = {
    overview: <Kv rows={[["Trade", c.trade], ["Market", c.city], ["Rank", `#${c.rank} · ${c.share}`], ["Retainer", `${money(c.mrr)}/mo`], ["What we sell them", "Site · ads · Twilio · AI — not their roof calls"]]} />,
    people: <p className="text-[13px]">Owner, CSR, estimator at the shop. Call/SMS from Inbox. Isolated to this customer.</p>,
    funnel: <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>Their own customer jobs are not Wrangler leads. We run the site, the ads, the number, and the AI that answers it.</p>,
    build: <Kv rows={[["GitHub", `${c.id}/site`], ["Vercel", `${c.id}.vercel.app`], ["Jobs", "isolated worktree"]]} />,
    dominate: <div>{ads.map((a) => <div key={a.id} className="flex justify-between border-b py-2 text-[13px]" style={{ borderColor: "var(--hairline)" }}><span>{a.name}</span><span className="font-mono">{a.platform} · {money(a.spend)}</span></div>)}</div>,
    phone: <Kv rows={[["DID", "one number, this book only"], ["A2P", "10DLC per brand"], ["Missed call", "SMS in 20s"]]} />,
    money: <Kv rows={[["Retainer", `${money(c.mrr)}/mo`], ["Ads 30d", money(ads.reduce((s, a) => s + a.spend, 0))], ["Twilio", "metered"], ["AI", "capped per job"]]} />,
    memory: <p className="text-[13.5px] leading-relaxed">House rules, brand voice, busy season — the AI reads this before it writes a word their customers could see.</p>,
    walls: <Kv rows={[["Repo", "unique"], ["Vercel token", "theirs"], ["Zernio profile", "theirs"], ["Twilio DID", "not shared"]]} />,
  }[tab];

  return (
    <div className="flex h-full min-h-0 flex-col">
    <DeskBar>
      <input className="btn-os min-w-[160px]" placeholder="Search customers…" value={q} onChange={(e) => setQ(e.target.value)} />
      <select className="btn-os" value={trade} onChange={(e) => setTrade(e.target.value)}>
        <option value="all">All trades</option>
        {trades.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <select className="btn-os" value={sort} onChange={(e) => setSort(e.target.value)}>
        <option value="mrr">Sort: retainer</option>
        <option value="rank">Sort: rank</option>
        <option value="name">Sort: name</option>
      </select>
    </DeskBar>
    <Dossier
      list={list.map((r) => (
        <RollItem key={r.id} on={r.id === c.id} title={r.name} meta={`${r.city} · #${r.rank} · ${money(r.mrr)}/mo`} onClick={() => { setId(r.id); setTab("overview"); }} />
      ))}
      rail={<Rail title="Open live work" why={`Jobs we run for ${c.name} stay behind their wall.`} onDo={() => { window.location.href = "/work"; }} />}
    >
      <div className="border-b px-4 pt-4 pb-2" style={{ borderColor: "var(--hairline)" }}>
        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--brand-text)" }}>{c.trade}</div>
        <h3 className="mt-1 mb-1 text-[24px]">{c.name}</h3>
        <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{c.city} · rank #{c.rank} · {c.share} share</div>
        <div className="mt-3 flex gap-1.5">
          <Link href="/leads" className="btn-os brand no-underline">Leads</Link>
          <Link href="/ads" className="btn-os no-underline">Ads</Link>
        </div>
      </div>
      <Tabs tabs={TABS} tab={tab} onTab={setTab} />
      <div className="min-h-0 flex-1 overflow-auto p-4">{body}</div>
    </Dossier>
    </div>
  );
}
