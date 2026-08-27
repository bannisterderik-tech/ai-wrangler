"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PLAYBOOKS = [
  {
    name: "Storm 90",
    desc: "Hail hits. LSA + Meta + Twilio 60s SLA + tarp landing page before the national chains pick up.",
    steps: ["Spin Zernio Google + Meta geo 20mi", "Twilio SMS the storm list in 60s", "Ship tarp-today landing page", "Power-dial new LSA leads", "Book estimates onto today's board"],
  },
  {
    name: "Speed-to-lead",
    desc: "Missed call → SMS in 20s → dialer queue → voicemail drop. The local shop that answers wins.",
    steps: ["Missed-call webhook → SMS template T1", "Push lead onto power-dial list", "AMD + voicemail drop", "Advance pipeline to Speed-to-lead"],
  },
  {
    name: "New e-commerce client setup",
    desc: "Repo, store scaffold, checkout, analytics — ready in a day.",
    steps: ["Create repo + environments", "Scaffold the storefront", "Wire payments (test mode)", "Analytics + uptime checks", "Draft the launch checklist"],
  },
  {
    name: "Monthly SEO sweep",
    desc: "Rankings, site health, broken links, quick wins.",
    steps: ["Crawl the site", "Compare rankings vs last month", "Fix broken links + metadata", "File tasks for bigger wins"],
  },
  {
    name: "Repo health audit",
    desc: "Updates, stale reviews, security patches.",
    steps: ["Scan dependencies", "Flag stale reviews", "Apply safe updates on a branch"],
  },
  {
    name: "Website launch checklist",
    desc: "Everything verified before a site goes live.",
    steps: ["All checks green", "Client approved the preview", "Domain + SSL verified", "Rollback plan written"],
  },
];

export default function PlaybooksPage() {
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers || []));
  }, []);

  async function run(name: string, customerId: string) {
    await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `Playbook: ${name}`, customerId, tier: "Medium brain" }),
    });
    router.push("/work");
  }

  return (
    <div className="overflow-y-auto px-[18px] py-4">
      <div className="mb-3 text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
        Repeatable recipes. Pick a customer and the Head Wrangler runs every step — asking for your OK at the sensitive ones.
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
        {PLAYBOOKS.map((pb) => (
          <div key={pb.name} className="rounded-xl p-[15px]" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}>
            <div className="text-[13px] font-semibold">{pb.name}</div>
            <div className="mt-1 text-[11.5px] leading-snug" style={{ color: "var(--text-secondary)" }}>{pb.desc}</div>
            <div className="mt-2.5 flex flex-col gap-1">
              {pb.steps.map((t, i) => (
                <div key={t} className="flex gap-1.5 text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--brand-text)" }}>{i + 1}</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1">
              <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>Run for:</span>
              {customers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => run(pb.name, c.id)}
                  className="cursor-pointer rounded-[7px] border px-2 py-1 text-[11px] font-semibold"
                  style={{ background: "none", borderColor: "var(--brand)", color: "var(--brand-text)" }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
