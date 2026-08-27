"use client";

import Link from "next/link";
import { ADS, CUSTOMERS, LEADS } from "@/lib/os-demo";
import { useDialer } from "@/components/os/DialerDock";

function Kpi({ l, n, s }: { l: string; n: string; s: string }) {
  return (
    <div className="rounded-[14px] border p-4" style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)" }}>
      <div className="text-[10px] uppercase tracking-[1.2px]" style={{ color: "var(--text-secondary)" }}>{l}</div>
      <div className="mt-2 font-mono text-[28px] font-semibold tracking-tight">{n}</div>
      <div className="mt-1 text-[11.5px]" style={{ color: "var(--state-running)" }}>{s}</div>
    </div>
  );
}

export default function CommandPage() {
  const { dial } = useDialer();
  const hot = LEADS.filter((l) => l.kind !== "partner" && l.stage <= 1).slice(0, 6);
  const spend = ADS.reduce((a, x) => a + x.spend, 0);
  const leadsN = ADS.reduce((a, x) => a + x.leads, 0);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-end justify-between gap-4 px-5 pt-5">
        <div>
          <h3 className="m-0 text-[34px] leading-none tracking-tight">Good morning. Five trades. One war room.</h3>
          <p className="mt-2 max-w-[640px] text-[13.5px]" style={{ color: "var(--text-secondary)" }}>
            Speed-to-lead is 47s. Inbound shops who want a site and the machine get a call before they bounce to a web guy on Facebook. Signed customers stay isolated.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dialer" className="btn-os brand no-underline">Start power dial</Link>
          <Link href="/ads" className="btn-os no-underline">Launch ads</Link>
        </div>
      </div>
      <div className="grid grid-cols-6 gap-2.5 px-5 py-3">
        <Kpi l="Speed to lead" n="47s" s="target < 60s" />
        <Kpi l="Calls today" n="38" s="Twilio · 4 lines" />
        <Kpi l="SMS sent" n="126" s="A2P 10DLC live" />
        <Kpi l="Ad spend" n={`$${spend.toLocaleString()}`} s={`${leadsN} leads · Zernio`} />
        <Kpi l="Demos booked" n="4" s="+2 vs yesterday" />
        <Kpi l="AI jobs live" n="2" s="Head Wrangler on box" />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-3 overflow-hidden px-5 pb-5">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-[14px] border" style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)" }}>
          <h4 className="m-0 border-b px-3.5 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ borderColor: "var(--hairline)", color: "var(--text-secondary)" }}>
            Hot board — call these now
          </h4>
          <div className="min-h-0 flex-1 overflow-auto p-2">
            {hot.map((l) => (
              <div key={l.id} className="flex items-start justify-between gap-2 border-b px-1 py-2.5" style={{ borderColor: "var(--hairline)" }}>
                <div>
                  <div className="text-[13px] font-semibold">{l.company} · {l.name}</div>
                  <div className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>{l.note}</div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button className="btn-os brand" onClick={() => dial(l.id)}>Call</button>
                  <Link href="/inbox" className="btn-os no-underline">Inbox</Link>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="flex min-h-0 flex-col overflow-hidden rounded-[14px] border" style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)" }}>
          <h4 className="m-0 border-b px-3.5 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ borderColor: "var(--hairline)", color: "var(--text-secondary)" }}>
            Local domination — share of search
          </h4>
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-auto p-3">
            {CUSTOMERS.map((c) => (
              <div key={c.id} className="rounded-xl border p-3" style={{ background: "var(--surface-inset)", borderColor: "var(--hairline)" }}>
                <b>{c.city.split(",")[0]}</b>
                <div className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>{c.name} · rank #{c.rank}</div>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--surface-void)" }}>
                  <i className="block h-full" style={{ width: c.share, background: "linear-gradient(90deg, var(--brand), var(--state-running))" }} />
                </div>
                <div className="mt-1.5 font-mono text-xs">{c.share} share</div>
              </div>
            ))}
          </div>
        </section>
        <section className="flex min-h-0 flex-col overflow-hidden rounded-[14px] border" style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)" }}>
          <h4 className="m-0 border-b px-3.5 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ borderColor: "var(--hairline)", color: "var(--text-secondary)" }}>
            AI + human feed
          </h4>
          <div className="min-h-0 flex-1 overflow-auto p-3 text-[12.5px]">
            {[
              ["AI", "Zernio · Apex Google RSA is 2.1× impression share vs last week."],
              ["You", "Approval needed: Cascade after-hours SMS blast (46 opted-in)."],
              ["Twilio", "Inbound from 530-555-0142 — routed to the Apex line."],
              ["AI", "Booked Priya Shah estimate Thursday 7:30a."],
              ["Partner", "Ken Williamson sent a reroof. Auto-texted in 19s."],
            ].map(([who, text]) => (
              <div key={text} className="mb-2 flex gap-2">
                <span className="h-fit rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase" style={{ borderColor: "var(--hairline)", color: "var(--brand-text)" }}>{who}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
