"use client";

import { useEffect, useState } from "react";
import { statusDot, statusLabel } from "@/lib/ui";

type Job = { id: string; title: string; customerId: string; customerName: string; status: string };

export default function OrgPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    Promise.all([fetch("/api/jobs").then((r) => r.json()), fetch("/api/customers").then((r) => r.json())]).then(
      ([j, c]) => {
        setJobs(j.jobs || []);
        setCustomers(c.customers || []);
      },
    );
  }, []);

  const nodes = customers.map((c, i) => {
    const act = jobs.find((j) => j.customerId === c.id && (j.status === "working" || j.status === "thinking" || j.status === "blocked"));
    return { ...c, act, x: ((i + 0.5) / Math.max(customers.length, 1)) * 100 };
  });

  const headLine = jobs.some((j) => j.status === "blocked")
    ? "A sub-agent is waiting on you."
    : jobs.some((j) => j.status === "working" || j.status === "thinking")
      ? "Work is moving. Isolation walls are up."
      : "Watching every workspace. All quiet.";

  return (
    <div className="relative h-full overflow-hidden">
      <svg className="absolute inset-0 h-full w-full">
        {nodes.map((n) => (
          <line
            key={n.id}
            x1="50%"
            y1="22%"
            x2={`${n.x}%`}
            y2="58%"
            stroke={n.act ? (n.act.status === "blocked" ? "var(--state-blocked)" : "var(--state-running)") : "var(--hairline)"}
            strokeWidth={n.act ? 1.6 : 1}
            strokeDasharray={n.act ? "6 6" : "none"}
            style={{ animation: n.act ? "dashmove 0.8s linear infinite" : "none" }}
          />
        ))}
      </svg>
      <div
        className="absolute left-1/2 top-[16%] w-[230px] -translate-x-1/2 -translate-y-1/2 rounded-xl px-3.5 py-3"
        style={{ background: "var(--surface-raised)", border: "1.5px solid var(--brand)", boxShadow: "0 12px 36px rgba(0,0,0,0.3)" }}
      >
        <div className="flex items-center gap-1.5 text-[13px] font-semibold">
          <span style={{ color: "var(--brand-text)" }}>✛</span>Head Wrangler
        </div>
        <div className="font-mono mt-1 text-[10.5px]" style={{ color: "var(--text-secondary)" }}>
          claude-code · via MCP · this laptop
        </div>
        <div className="mt-1.5 text-[11.5px] leading-snug">{headLine}</div>
      </div>
      <div className="absolute left-0 right-0 top-[66%] flex -translate-y-1/2 px-2">
        {nodes.map((n) => (
          <div key={n.id} className="flex min-w-0 flex-1 justify-center px-1.5">
            <div
              className="w-full max-w-[190px] rounded-xl p-3"
              style={{
                background: "var(--surface-raised)",
                border: `1px solid ${n.act?.status === "blocked" ? "var(--state-blocked)" : "var(--hairline)"}`,
              }}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    background: n.act ? statusDot(n.act.status) : "var(--text-secondary)",
                    animation: n.act ? "pulse 2.4s ease-in-out infinite" : "none",
                  }}
                />
                <span className="truncate text-xs font-semibold">{n.name}</span>
              </div>
              <div className="font-mono mt-1 truncate text-[10px]" style={{ color: "var(--text-secondary)" }}>
                {n.id}-builder
              </div>
              <div
                className="mt-1.5 text-[11px] leading-snug"
                style={{ color: n.act?.status === "blocked" ? "var(--state-blocked)" : "var(--text-primary)" }}
              >
                {n.act
                  ? n.act.status === "blocked"
                    ? `Waiting on you: ${n.act.title}`
                    : `Now: ${n.act.title}`
                  : "Idle — ready for a task."}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-3.5 left-0 right-0 text-center text-[11px]" style={{ color: "var(--text-secondary)" }}>
        Work flows down from the Head Wrangler; results and questions flow back up. Amber means a sub-agent is waiting on you.
      </div>
    </div>
  );
}
