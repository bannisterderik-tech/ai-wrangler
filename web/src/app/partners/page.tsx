"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PARTNERS } from "@/lib/os-demo";
import { DeskBar, Dossier, Kv, Rail, RollItem, Tabs } from "@/components/os/Dossier";

const TABS: [string, string][] = [
  ["overview", "Overview"],
  ["people", "People"],
  ["flow", "Flow"],
  ["comarket", "Co-market"],
  ["agreement", "Agreement"],
  ["history", "History"],
];

export default function PartnersPage() {
  const [id, setId] = useState(PARTNERS[0].id);
  const [tab, setTab] = useState("overview");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("sent");
  const list = useMemo(() => {
    let r = PARTNERS.slice();
    const qq = q.toLowerCase();
    if (qq) r = r.filter((x) => (x.name + x.kind + x.city).toLowerCase().includes(qq));
    r.sort((a, b) => (sort === "won" ? b.won - a.won : sort === "name" ? a.name.localeCompare(b.name) : b.sent - a.sent));
    return r;
  }, [q, sort]);
  const p = list.find((x) => x.id === id) || list[0] || PARTNERS[0];

  const body = {
    overview: <Kv rows={[["Kind", p.kind], ["Market", p.city], ["Sent us", String(p.sent)], ["Won", String(p.won)], ["Take", p.take]]} />,
    people: <p className="text-[13px]">Decision maker on file. SMS from the dock — reciprocity is the contract.</p>,
    flow: <p className="text-[13px]">{p.sent} inbound referrals · {p.won} won. Send one back this week.</p>,
    comarket: <Kv rows={[["Play", "Shared landing page + one shared number"], ["QR", "Truck wrap → Text-for-Info"], ["Ads", "Co-op Zernio geo"]]} />,
    agreement: <Kv rows={[["Take", p.take], ["W9", "on file"], ["Paid", "monthly after collected"]]} />,
    history: <p className="text-[13px]">Last ping in the Twilio thread.</p>,
  }[tab];

  return (
    <div className="flex h-full min-h-0 flex-col">
    <DeskBar>
      <input className="btn-os min-w-[160px]" placeholder="Search partners…" value={q} onChange={(e) => setQ(e.target.value)} />
      <select className="btn-os" value={sort} onChange={(e) => setSort(e.target.value)}>
        <option value="sent">Sort: sent us</option>
        <option value="won">Sort: won</option>
        <option value="name">Sort: name</option>
      </select>
    </DeskBar>
    <Dossier
      list={list.map((r) => (
        <RollItem key={r.id} on={r.id === p.id} title={r.name} meta={`${r.kind} · sent ${r.sent} · won ${r.won}`} onClick={() => { setId(r.id); setTab("overview"); }} />
      ))}
      rail={<Rail title="Text a thank-you and a job" why="Partners who get paid and thanked keep sending." onDo={() => { window.location.href = "/inbox"; }} />}
    >
      <div className="border-b px-4 pt-4 pb-2" style={{ borderColor: "var(--hairline)" }}>
        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--brand-text)" }}>{p.kind}</div>
        <h3 className="mt-1 mb-1 text-[24px]">{p.name}</h3>
        <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{p.city} · take {p.take}</div>
        <div className="mt-3 flex gap-1.5">
          <Link href="/inbox" className="btn-os brand no-underline">Inbox</Link>
        </div>
      </div>
      <Tabs tabs={TABS} tab={tab} onTab={setTab} />
      <div className="min-h-0 flex-1 overflow-auto p-4">{body}</div>
    </Dossier>
    </div>
  );
}
