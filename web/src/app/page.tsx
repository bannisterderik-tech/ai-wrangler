"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Command = {
  pipeline: { prospects: number; open: number; value: number; won: number };
  customers: number;
  work: { running: number; gated: number; spentToday: number };
  ads: { active: number; spend: number; leads: number };
  callsToday: number;
  unread: number;
  hot: { id: string; company: string; contact: string | null; phone: string | null; stage: string; note: string | null }[];
};

const money = (n: number) => "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });

function Kpi({ label, value, sub, href }: { label: string; value: string | number; sub: string; href?: string }) {
  const body = (
    <div className="rounded-[14px] p-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}>
      <div className="text-[10px] uppercase tracking-[0.6px]" style={{ color: "var(--text-secondary)" }}>{label}</div>
      <div className="mt-1 text-[26px] leading-none tabular-nums">{value}</div>
      <div className="mt-1.5 text-[12px]" style={{ color: "var(--text-secondary)" }}>{sub}</div>
    </div>
  );
  return href ? <Link href={href} className="no-underline">{body}</Link> : body;
}

/** Command. Every number is a row somebody can go and look at. */
export default function CommandPage() {
  const [d, setD] = useState<Command | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/command", { cache: "no-store" });
    if (res.ok) setD(await res.json());
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  if (!d) return <div className="p-5 text-[13px]" style={{ color: "var(--text-secondary)" }}>Reading the desk…</div>;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const nothing = d.pipeline.open === 0 && d.customers === 0 && d.work.running === 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto">
      <div className="px-6 pt-6 pb-2">
        <h1 className="text-[34px] leading-none tracking-tight">
          {greeting}. {d.customers} customer{d.customers === 1 ? "" : "s"}. One desk.
        </h1>
        <p className="mt-2 max-w-[64ch] text-[13.5px]" style={{ color: "var(--text-secondary)" }}>
          {nothing
            ? "Nothing on the books yet. Add a prospect, or add a customer and bind their repo — an agent cannot work until something is bound."
            : `${d.pipeline.open} in the pipeline worth ${money(d.pipeline.value)} a month, ${d.work.running} job${d.work.running === 1 ? "" : "s"} running, ${d.work.gated} waiting on you.`}
        </p>
      </div>

      <div className="grid gap-2.5 px-6 py-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Pipeline" value={d.pipeline.open} sub={`${money(d.pipeline.value)}/mo in play`} href="/leads" />
        <Kpi label="Prospects" value={d.pipeline.prospects} sub="not spoken to yet" href="/prospects" />
        <Kpi label="Customers" value={d.customers} sub={`${d.pipeline.won} won`} href="/customers" />
        <Kpi label="Needs you" value={d.work.gated} sub="agents stopped at a wall" href="/work" />
        <Kpi label="Jobs running" value={d.work.running} sub={`${money(d.work.spentToday)} spent`} href="/work" />
        <Kpi label="Unread" value={d.unread} sub={`${d.callsToday} ${d.callsToday === 1 ? "call" : "calls"} today`} href="/inbox" />
      </div>

      <div className="grid min-h-0 flex-1 gap-2.5 px-6 pb-6 lg:grid-cols-2">
        <div className="rounded-[14px] p-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}>
          <div className="mb-2 text-[10px] uppercase tracking-[0.6px]" style={{ color: "var(--text-secondary)" }}>
            Call these now
          </div>
          {d.hot.length === 0 ? (
            <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
              Nobody with a phone number in the pipeline. Add one on Leads and it shows up here and on the Dialer.
            </p>
          ) : (
            d.hot.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-3 border-b py-2.5" style={{ borderColor: "var(--hairline)" }}>
                <div className="min-w-0">
                  <b className="text-[13.5px]">{l.company}</b>
                  <div className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                    {[l.contact, l.stage].filter(Boolean).join(" · ")}
                  </div>
                </div>
                {l.phone ? <a className="btn-os brand shrink-0 no-underline" href={`tel:${l.phone}`}>Call</a> : null}
              </div>
            ))
          )}
        </div>

        <div className="rounded-[14px] p-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}>
          <div className="mb-2 text-[10px] uppercase tracking-[0.6px]" style={{ color: "var(--text-secondary)" }}>
            Ads
          </div>
          {d.ads.active === 0 ? (
            <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
              No campaigns running. They go on the customer&apos;s own ad account, and a new one is drafted rather
              than started — spending money is a decision.
            </p>
          ) : (
            <p className="text-[13px]">
              {d.ads.active} live · {money(d.ads.spend)} spend · {d.ads.leads} leads
              {d.ads.leads ? ` · ${money(Math.round(d.ads.spend / d.ads.leads))} per lead` : ""}
            </p>
          )}
          <Link href="/ads" className="btn-os mt-3 inline-block no-underline">Open ads</Link>
        </div>
      </div>
    </div>
  );
}
