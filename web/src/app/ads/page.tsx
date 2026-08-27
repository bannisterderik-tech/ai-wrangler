"use client";

import { useEffect, useState } from "react";
import { ADS as SEED, CUSTOMERS, customerName } from "@/lib/os-demo";

type Ad = (typeof SEED)[number] & { demo?: boolean };

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>(SEED);
  const [open, setOpen] = useState(false);
  const spend = ads.reduce((a, x) => a + x.spend, 0);
  const leadsN = ads.reduce((a, x) => a + x.leads, 0);

  useEffect(() => {
    fetch("/api/zernio/ads")
      .then((r) => r.json())
      .then((d) => { if (d.ads?.length) setAds(d.ads); })
      .catch(() => {});
  }, []);

  async function toggle(id: string, status: string) {
    const next = status === "active" ? "paused" : "active";
    setAds((all) => all.map((a) => (a.id === id ? { ...a, status: next } : a)));
    await fetch("/api/zernio/ads", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: next }),
    }).catch(() => {});
  }

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      platform: String(fd.get("platform")),
      name: String(fd.get("name")),
      budget: Number(fd.get("budget") || 75),
      geo: String(fd.get("geo") || ""),
      cust: String(fd.get("cust")),
    };
    const res = await fetch("/api/zernio/ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.json()).catch(() => ({}));
    const ad = res.ad || { id: `A${ads.length + 1}`, ...body, status: "pending_review", spend: 0, leads: 0, cpl: 0, roas: 0, cust: body.cust };
    setAds((all) => [ad, ...all]);
    setOpen(false);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-end justify-between px-5 pt-5">
        <div>
          <h3 className="m-0 text-[28px]">Zernio · seven networks, one API.</h3>
          <p className="mt-2 max-w-[640px] text-[13.5px]" style={{ color: "var(--text-secondary)" }}>
            Google, Meta, TikTok, LinkedIn, Pinterest, X, OpenAI ads. Each customer is a Zernio profile. Pixels never mix.
          </p>
        </div>
        <button className="btn-os brand" onClick={() => setOpen(true)}>Launch campaign</button>
      </div>
      <div className="grid grid-cols-6 gap-2.5 px-5 py-3">
        {[
          ["Spend (30d)", `$${spend.toLocaleString()}`],
          ["Leads", String(leadsN)],
          ["Blended CPL", `$${Math.round(spend / Math.max(1, leadsN))}`],
          ["Best ROAS", "7.1×"],
          ["Networks live", "4"],
          ["In review", String(ads.filter((a) => a.status === "pending_review").length)],
        ].map(([l, n]) => (
          <div key={l} className="rounded-[14px] border p-4" style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)" }}>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>{l}</div>
            <div className="mt-2 font-mono text-[24px] font-semibold">{n}</div>
          </div>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-5 pb-5">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              {["Campaign", "Book", "Network", "Status", "Spend", "Leads", "CPL", "ROAS", ""].map((h) => (
                <th key={h} className="border-b px-3 py-2.5" style={{ borderColor: "var(--hairline)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ads.map((a) => (
              <tr key={a.id}>
                <td className="border-b px-3 py-2.5" style={{ borderColor: "var(--hairline)" }}><b>{a.name}</b></td>
                <td className="border-b px-3 py-2.5" style={{ borderColor: "var(--hairline)" }}>{customerName(a.cust) || a.cust}</td>
                <td className="border-b px-3 py-2.5" style={{ borderColor: "var(--hairline)" }}>{a.platform}</td>
                <td className="border-b px-3 py-2.5" style={{ borderColor: "var(--hairline)" }}>{a.status}</td>
                <td className="border-b px-3 py-2.5 font-mono" style={{ borderColor: "var(--hairline)" }}>${a.spend}</td>
                <td className="border-b px-3 py-2.5 font-mono" style={{ borderColor: "var(--hairline)" }}>{a.leads}</td>
                <td className="border-b px-3 py-2.5 font-mono" style={{ borderColor: "var(--hairline)" }}>{a.cpl ? `$${a.cpl}` : "—"}</td>
                <td className="border-b px-3 py-2.5 font-mono" style={{ borderColor: "var(--hairline)" }}>{a.roas ? `${a.roas}×` : "—"}</td>
                <td className="border-b px-3 py-2.5" style={{ borderColor: "var(--hairline)" }}>
                  <button className="btn-os" onClick={() => toggle(a.id, a.status)}>{a.status === "active" ? "Pause" : "Resume"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center p-6" style={{ background: "var(--scrim)" }} onClick={() => setOpen(false)}>
          <form className="w-[min(560px,100%)] rounded-2xl border p-5" style={{ background: "var(--surface-raised)", borderColor: "var(--hairline)" }} onClick={(e) => e.stopPropagation()} onSubmit={create}>
            <h3 className="mt-0">Launch via Zernio</h3>
            <label className="mt-3 block text-[11px] uppercase" style={{ color: "var(--text-secondary)" }}>Customer</label>
            <select name="cust" className="btn-os mt-1 w-full">{CUSTOMERS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <label className="mt-3 block text-[11px] uppercase" style={{ color: "var(--text-secondary)" }}>Network</label>
            <select name="platform" className="btn-os mt-1 w-full">
              <option value="google">Google Ads / LSA</option>
              <option value="meta">Meta</option>
              <option value="tiktok">TikTok</option>
              <option value="openai">ChatGPT ads</option>
            </select>
            <label className="mt-3 block text-[11px] uppercase" style={{ color: "var(--text-secondary)" }}>Name</label>
            <input name="name" defaultValue="Emergency — 20mi" className="btn-os mt-1 w-full" required />
            <label className="mt-3 block text-[11px] uppercase" style={{ color: "var(--text-secondary)" }}>Daily budget</label>
            <input name="budget" type="number" defaultValue={75} className="btn-os mt-1 w-full" />
            <label className="mt-3 block text-[11px] uppercase" style={{ color: "var(--text-secondary)" }}>Geo</label>
            <input name="geo" defaultValue="Red Bluff, CA + 20 miles" className="btn-os mt-1 w-full" />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn-os" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn-os brand" type="submit">Create campaign</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
