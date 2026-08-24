"use client";

import { useEffect, useState } from "react";

const colors: Record<string, string> = {
  mcp: "var(--state-thinking)",
  plan: "var(--accent-ink)",
  assign: "var(--state-thinking)",
  github: "var(--state-running)",
  vercel: "var(--state-running)",
  paused: "var(--state-blocked)",
  you: "var(--state-blocked)",
  done: "var(--state-running)",
  provision: "var(--state-running)",
};

export default function ManagerPage() {
  const [log, setLog] = useState<{ tag: string; text: string; customerId: string | null }[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [client, setClient] = useState("");
  const [goal, setGoal] = useState("");

  async function load() {
    const [o, c] = await Promise.all([fetch("/api/orch").then((r) => r.json()), fetch("/api/customers").then((r) => r.json())]);
    setLog(o.log || []);
    setCustomers(c.customers || []);
    setClient((id) => id || c.customers?.[0]?.id || "");
  }
  useEffect(() => {
    load();
  }, []);

  async function send() {
    if (!goal.trim()) return;
    await fetch("/api/orch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal, customerId: client }),
    });
    await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: goal, customerId: client, tier: "Medium brain" }),
    });
    setGoal("");
    await load();
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 px-[18px] py-3" style={{ borderBottom: "1px solid var(--hairline)" }}>
        <span className="h-2 w-2 rounded-full" style={{ background: "var(--state-running)", animation: "pulse 2.4s ease-in-out infinite" }} />
        <span className="text-[13px] font-semibold">Claude Code — the Head Wrangler</span>
        <span className="font-mono text-[11px]" style={{ color: "var(--text-secondary)" }}>
          connected via MCP · this laptop
        </span>
      </div>
      <div className="px-[18px] py-2.5 text-[11.5px] leading-relaxed" style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--hairline)" }}>
        One brain oversees every customer workspace. Hand it a goal in plain words — it assigns work only inside that customer’s bound GitHub and Vercel.
      </div>
      <div className="font-mono flex flex-1 flex-col gap-1 overflow-y-auto px-[18px] py-3 text-[11.5px] leading-relaxed">
        {log.map((l, i) => (
          <div key={i} className="flex gap-2.5">
            <span className="w-[82px] shrink-0" style={{ color: colors[l.tag] || "var(--text-secondary)" }}>
              {l.tag}
            </span>
            <span>{l.text}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 px-[18px] py-3" style={{ borderTop: "1px solid var(--hairline)" }}>
        <div className="flex gap-1">
          {customers.map((c) => (
            <button
              key={c.id}
              onClick={() => setClient(c.id)}
              className="cursor-pointer whitespace-nowrap rounded-[7px] border px-2.5 py-1.5 text-[11.5px]"
              style={{
                background: client === c.id ? "var(--surface-inset)" : "transparent",
                borderColor: client === c.id ? "var(--brand)" : "var(--hairline)",
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Give the Head Wrangler a goal in plain words"
          className="flex-1 rounded-lg border px-2.5 py-2 text-[12.5px] outline-none"
          style={{ background: "var(--surface-inset)", borderColor: "var(--hairline)" }}
        />
        <button onClick={send} className="shrink-0 cursor-pointer rounded-lg px-4 py-2 text-[12.5px] font-semibold text-white" style={{ background: "var(--brand)" }}>
          Wrangle it
        </button>
      </div>
    </div>
  );
}
