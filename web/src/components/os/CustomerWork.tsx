"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Job = {
  id: string; title: string; status: string; customer: string; customerId?: string;
  owner: { id: string; handle: string; name: string } | null;
  goal: string | null; repo: string | null; branch: string | null;
  spent: number; budget: number; tier?: string; brain?: string;
  steps: { kind: string; text: string; actor: string; at: string }[];
};
type Person = { id: string; handle: string; name: string; kind?: string; customerId?: string | null; status: string };
type Brain = { id: string; label: string; rate: string; good: string; bad: string };

const money = (n: number) => "$" + n.toFixed(2);
const TONE: Record<string, string> = {
  working: "var(--state-running)", thinking: "var(--state-thinking)", blocked: "var(--state-blocked)",
  queued: "var(--text-secondary)", done: "var(--state-go)", rolled_back: "var(--state-stop)",
};
const WORD: Record<string, string> = {
  working: "working", thinking: "reading", blocked: "waiting on you",
  queued: "on the board", done: "shipped", rolled_back: "rolled back",
};

/**
 * The work for one customer, and a way to start more of it.
 *
 * Opening a job from here is the same call the floor makes, with the customer
 * already decided — which is the point: from a customer's record you never have
 * to pick them out of a list, and you cannot pick the wrong one.
 */
export function CustomerWork({ customerId, customerName }: { customerId: string; customerName: string }) {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [brains, setBrains] = useState<Brain[]>([]);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({ title: "", goal: "", budgetDollars: "10", tier: "sonnet", ownerId: "" });

  const load = useCallback(async () => {
    const res = await fetch("/api/floor", { cache: "no-store" });
    if (!res.ok) return;
    const d = await res.json();
    setJobs((d.jobs ?? []).filter((j: Job) => j.customer === customerName || j.customerId === customerId));
    setPeople(d.people ?? []);
    setBrains(d.brains ?? []);
  }, [customerId, customerName]);
  useEffect(() => {
    load();
  }, [load]);

  // A teammate can be given anything; an agent belongs to one project and may
  // only be handed that project's work, so the list refuses to offer the rest.
  const assignable = useMemo(
    () => people.filter((p) => p.kind !== "agent" || p.customerId === customerId),
    [people, customerId],
  );
  const projectAgents = assignable.filter((p) => p.kind === "agent");

  async function open(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/floor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, customerId, budgetDollars: Number(draft.budgetDollars) }),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out.error || "could not open it");
    setAdding(false);
    setDraft({ title: "", goal: "", budgetDollars: "10", tier: "sonnet", ownerId: "" });
    await load();
  }

  if (!jobs) return <p className="p-4 text-[13px]" style={{ color: "var(--text-secondary)" }}>Reading the floor…</p>;

  const live = jobs.filter((j) => j.status !== "done");
  const chosen = brains.find((b) => b.id === draft.tier);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn-os brand" onClick={() => setAdding((v) => !v)}>
          {adding ? "Cancel" : "+ New job"}
        </button>
        <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
          {live.length} in flight · {money(jobs.reduce((a, j) => a + j.spent, 0))} spent on {customerName}
        </span>
      </div>

      {adding ? (
        <form onSubmit={open} className="flex flex-col gap-3 rounded-lg p-3" style={{ background: "var(--surface-raised)" }}>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>What to build</span>
            <input autoFocus className="btn-os w-full" value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Add a booking page" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>What good looks like</span>
            <input className="btn-os w-full" value={draft.goal}
              onChange={(e) => setDraft({ ...draft, goal: e.target.value })}
              placeholder="Optional — whoever picks this up reads it before they plan" />
          </label>
          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Spend cap</span>
              <input className="btn-os w-[90px] tabular-nums" type="number" min="1" max="500"
                value={draft.budgetDollars} onChange={(e) => setDraft({ ...draft, budgetDollars: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Brain</span>
              <select className="btn-os" value={draft.tier} onChange={(e) => setDraft({ ...draft, tier: e.target.value })}>
                {brains.map((b) => <option key={b.id} value={b.id}>{b.label} · {b.rate}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Give it to</span>
              <select className="btn-os min-w-[180px]" value={draft.ownerId}
                onChange={(e) => setDraft({ ...draft, ownerId: e.target.value })}>
                <option value="">Leave on the board</option>
                {projectAgents.length ? (
                  <optgroup label="AI agents on this project">
                    {projectAgents.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </optgroup>
                ) : null}
                <optgroup label="People">
                  {assignable.filter((p) => p.kind !== "agent").map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </optgroup>
              </select>
            </label>
          </div>
          {chosen ? (
            <p className="max-w-[68ch] text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              <strong>{chosen.label}</strong> — {chosen.good}{" "}
              <span style={{ color: "var(--state-blocked)" }}>{chosen.bad}</span>
            </p>
          ) : null}
          {!projectAgents.length ? (
            <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
              No AI agent on this project yet. Mint one on{" "}
              <Link href="/sessions" className="underline">Sessions</Link> and it can pick this up itself.
            </p>
          ) : null}
          {error ? <p className="text-[12.5px]" style={{ color: "var(--state-stop)" }}>{error}</p> : null}
          <div>
            <button className="btn-os brand" type="submit" disabled={busy || !draft.title.trim()}>Open it</button>
          </div>
        </form>
      ) : null}

      {jobs.length === 0 ? (
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Nothing has been built for {customerName} yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {jobs.map((j) => {
            const over = j.budget > 0 && j.spent >= j.budget;
            return (
              <div key={j.id} className="rounded-lg border p-3" style={{ borderColor: "var(--hairline)" }}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-semibold">{j.title}</div>
                    <div className="text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
                      {j.owner ? j.owner.name : "unclaimed"}
                      {j.brain ? ` · ${j.brain}` : ""}
                      {j.branch ? ` · ${j.branch}` : ""}
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider" style={{ color: TONE[j.status] }}>
                    {WORD[j.status] ?? j.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--hairline)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, j.budget ? (j.spent / j.budget) * 100 : 0)}%`,
                        background: over ? "var(--state-stop)" : "var(--brand)",
                      }}
                    />
                  </div>
                  <span className="shrink-0 tabular-nums text-[11.5px]" style={{ color: over ? "var(--state-stop)" : "var(--text-secondary)" }}>
                    {money(j.spent)} / {money(j.budget)}
                  </span>
                </div>
                {j.steps.length ? (
                  <p className="mt-2 truncate text-[12px]" style={{ color: "var(--text-secondary)" }}>
                    {j.steps[j.steps.length - 1].text}
                  </p>
                ) : null}
                <div className="mt-2">
                  <Link href="/work" className="btn-os no-underline">Open on the floor</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
