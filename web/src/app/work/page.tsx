"use client";

import { useEffect, useMemo, useState } from "react";
import { money, statusDot, statusLabel } from "@/lib/ui";

type Line = { kind: string; text?: string; label?: string };
type Job = {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  status: string;
  tier: string;
  spentCents: number;
  budgetCents: number;
  cache: number;
  transcript: Line[];
};

export default function WorkPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [sel, setSel] = useState("");
  const [taskOpen, setTaskOpen] = useState(false);

  async function load() {
    const data = await fetch("/api/jobs").then((r) => r.json());
    setJobs(data.jobs || []);
    setSel((s) => s || data.jobs?.[0]?.id || "");
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, []);

  const current = jobs.find((j) => j.id === sel) || jobs[0];
  const left = current ? Math.max(0, current.budgetCents - current.spentCents) : 0;
  const pct = current ? Math.max(0, Math.round((left / current.budgetCents) * 100)) : 0;

  return (
    <div className="grid h-full min-h-0 grid-cols-[230px_1fr]">
      <div className="flex flex-col gap-1.5 overflow-y-auto p-2.5" style={{ borderRight: "1px solid var(--hairline)" }}>
        {jobs.map((j) => (
          <button
            key={j.id}
            onClick={() => setSel(j.id)}
            className="cursor-pointer rounded-lg border px-2.5 py-2 text-left"
            style={{
              background: current?.id === j.id ? "var(--surface-inset)" : "transparent",
              borderColor: current?.id === j.id ? "var(--brand)" : "var(--hairline)",
            }}
          >
            <span className="flex items-center gap-1.5 text-[12.5px] font-medium">
              <span
                className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                style={{
                  background: statusDot(j.status),
                  animation: j.status === "working" || j.status === "thinking" ? "pulse 2.4s ease-in-out infinite" : "none",
                }}
              />
              {j.title}
            </span>
            <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
              {j.customerName} · {statusLabel(j.status)}
            </span>
          </button>
        ))}
        <button
          onClick={() => setTaskOpen(true)}
          className="mt-2 cursor-pointer rounded-lg border py-2 text-xs"
          style={{ background: "var(--btn)", borderColor: "var(--hairline)" }}
        >
          ＋ Give the AI a task
        </button>
      </div>
      {current ? (
        <div className="flex min-h-0 flex-col">
          <div className="px-[18px] py-3" style={{ borderBottom: "1px solid var(--hairline)" }}>
            <div className="text-[15px] font-semibold">{current.title}</div>
            <div className="mt-0.5 text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
              {current.customerName} · {current.tier} · {statusLabel(current.status)}
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-[18px] py-3.5">
            {current.transcript.length === 0 ? (
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Waiting to start — Claude Code on this laptop will pick it up.
              </div>
            ) : null}
            {current.transcript.map((m, i) => (
              <TranscriptLine key={i} m={m} />
            ))}
          </div>
          <div
            className="flex flex-wrap items-center gap-5 px-[18px] py-2.5"
            style={{ borderTop: "1px solid var(--hairline)" }}
          >
            <Stat k="Spent so far" v={money(current.spentCents)} />
            <Stat k="Reused context" v={`${current.cache}% reused`} />
            <div className="min-w-[150px] flex-1">
              <div className="flex justify-between text-[10px]" style={{ color: "var(--text-secondary)" }}>
                <span>Budget left</span>
                <span className="tabular-nums">
                  {money(left)} of {money(current.budgetCents)}
                </span>
              </div>
              <div className="mt-1 h-[5px] overflow-hidden rounded-sm" style={{ background: "var(--surface-inset)" }}>
                <div
                  className="h-full rounded-sm"
                  style={{
                    width: `${pct}%`,
                    background: pct < 25 ? "var(--state-failed)" : "var(--state-running)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center text-xs" style={{ color: "var(--text-secondary)" }}>
          No runs yet.
        </div>
      )}
      {taskOpen ? <TaskModal onClose={() => setTaskOpen(false)} onCreated={() => { setTaskOpen(false); load(); }} /> : null}
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="whitespace-nowrap text-[10px]" style={{ color: "var(--text-secondary)" }}>
        {k}
      </div>
      <div className="whitespace-nowrap text-sm font-semibold tabular-nums">{v}</div>
    </div>
  );
}

function TranscriptLine({ m }: { m: Line }) {
  if (m.kind === "think") {
    return (
      <div className="border-l-2 py-1 pl-2.5 text-xs leading-relaxed" style={{ borderColor: "var(--state-thinking)", color: "var(--text-secondary)" }}>
        {m.text}
      </div>
    );
  }
  if (m.kind === "tool") {
    return (
      <div className="rounded-lg border p-2" style={{ background: "var(--surface-inset)", borderColor: "var(--hairline)", borderLeft: "2px solid var(--state-running)" }}>
        <div className="text-[11px] font-semibold" style={{ color: "var(--state-running)" }}>{m.label}</div>
        <div className="font-mono mt-1 text-[11px] leading-relaxed">{m.text}</div>
      </div>
    );
  }
  if (m.kind === "gate") {
    return (
      <div className="rounded-lg border p-2 text-xs font-medium" style={{ background: "var(--surface-inset)", borderColor: "var(--state-blocked)", color: "var(--state-blocked)" }}>
        {m.text}
      </div>
    );
  }
  if (m.kind === "you") {
    return (
      <div className="border-l-2 py-1 pl-2.5 text-xs font-medium" style={{ borderColor: "var(--state-blocked)" }}>
        {m.text}
      </div>
    );
  }
  if (m.kind === "fail") {
    return (
      <div className="rounded-lg border p-2" style={{ background: "var(--surface-inset)", borderColor: "var(--state-failed)", borderLeft: "2px solid var(--state-failed)" }}>
        <div className="text-[11px] font-semibold" style={{ color: "var(--state-failed)" }}>{m.label || "Failed"}</div>
        <div className="font-mono mt-1 text-[11px]">{m.text}</div>
      </div>
    );
  }
  return (
    <div className="py-0.5 text-center text-[11px]" style={{ color: "var(--text-secondary)" }}>
      {m.text}
    </div>
  );
}

function TaskModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [title, setTitle] = useState("");
  const [tier, setTier] = useState("Medium brain");

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((d) => {
        setCustomers(d.customers || []);
        setCustomerId(d.customers?.[0]?.id || "");
      });
  }, []);

  const tiers = useMemo(
    () => [
      ["Small brain", "chores · $3 cap"],
      ["Medium brain", "building · $10 cap"],
      ["Big brain", "hard stuff · $20 cap"],
    ],
    [],
  );

  async function start() {
    if (!title.trim() || !customerId) return;
    await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, customerId, tier }),
    });
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-[9900] flex items-center justify-center" style={{ background: "var(--scrim)" }}>
      <div className="flex w-[480px] flex-col gap-3.5 rounded-[14px] p-[18px]" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}>
        <div>
          <div className="text-[15px] font-semibold">Give the AI a task</div>
          <div className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Describe it in plain words. It stays on a safe copy until you approve anything sensitive.
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-[10px] uppercase tracking-[0.6px]" style={{ color: "var(--text-secondary)" }}>For which customer</div>
          <div className="flex flex-wrap gap-1.5">
            {customers.map((c) => (
              <button
                key={c.id}
                onClick={() => setCustomerId(c.id)}
                className="cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs"
                style={{
                  background: customerId === c.id ? "var(--surface-inset)" : "transparent",
                  borderColor: customerId === c.id ? "var(--brand)" : "var(--hairline)",
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Add a dark mode to the customer dashboard"
          className="h-[70px] resize-none rounded-lg border p-2.5 text-[13px] outline-none"
          style={{ background: "var(--surface-inset)", borderColor: "var(--hairline)" }}
        />
        <div className="flex gap-1.5">
          {tiers.map(([label, sub]) => (
            <button
              key={label}
              onClick={() => setTier(label)}
              className="flex flex-1 cursor-pointer flex-col items-center rounded-lg border py-2 text-xs"
              style={{
                background: tier === label ? "var(--surface-inset)" : "transparent",
                borderColor: tier === label ? "var(--brand)" : "var(--hairline)",
              }}
            >
              <span className="font-semibold">{label}</span>
              <span className="text-[10.5px]" style={{ color: "var(--text-secondary)" }}>{sub}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={start} className="flex-1 cursor-pointer rounded-lg py-2.5 text-[13px] font-semibold" style={{ background: "var(--state-running)", color: "#0B0C0E" }}>
            Start the work
          </button>
          <button onClick={onClose} className="cursor-pointer rounded-lg border px-4 py-2.5 text-[13px]" style={{ background: "var(--btn)", borderColor: "var(--hairline)" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
