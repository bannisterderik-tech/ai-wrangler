"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DeskBar, Dossier, Kv, RollItem, Tabs } from "@/components/os/Dossier";

type Step = { kind: string; text: string; actor: string; at: string };
type Gate = {
  id: string; title: string; what: string | null; blast: string | null; cost: string | null;
  guard: string | null; askedBy: string | null; irreversible: boolean; status: string;
};
type Job = {
  id: string; title: string; status: string; customerId: string; customer: string;
  owner: { id: string; handle: string; name: string } | null;
  agent: string | null; repo: string | null; branch: string | null; previewUrl: string | null;
  goal: string | null; scope: string | null; risk: string | null; spent: number; budget: number;
  steps: Step[]; gate: Gate | null;
  change: { id: string; title: string; repo: string | null; branch: string | null; status: string; diff: string | null } | null;
};
type Floor = {
  jobs: Job[];
  people: { id: string; handle: string; name: string; status: string; kind?: string; customerId?: string | null }[];
  customers: { id: string; name: string }[];
};

const WORD: Record<string, string> = {
  working: "working", blocked: "waiting on a human", thinking: "reading",
  queued: "queued", done: "shipped", rolled_back: "rolled back",
};
const TONE: Record<string, string> = {
  working: "var(--state-running)", blocked: "var(--state-stop)", thinking: "var(--state-thinking)",
  done: "var(--state-go)", queued: "var(--text-secondary)",
};

/**
 * The floor. Live work, Needs you and Changes were three views of one object,
 * so a job carries its own gate and its own diff and this is one screen.
 */
export default function FloorPage() {
  const [floor, setFloor] = useState<Floor | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [tab, setTab] = useState("transcript");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [opening, setOpening] = useState(false);
  const [draft, setDraft] = useState({ title: "", customerId: "", goal: "", budgetDollars: "10", ownerId: "" });
  const [openError, setOpenError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/floor", { cache: "no-store" });
    if (res.ok) setFloor(await res.json());
  }, []);

  useEffect(() => {
    load();
    // The floor moves while you are looking at it — sessions post steps over MCP.
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  const jobs = useMemo(() => floor?.jobs ?? [], [floor]);
  const gated = jobs.filter((j) => j.gate?.status === "pending");
  const me = floor?.people.find((p) => p.handle === "derik") ?? floor?.people[0];

  const buckets: [string, string, Job[]][] = [
    ["gate", "Needs you", gated],
    ["mine", "Mine", jobs.filter((j) => j.owner?.id === me?.id)],
    ["running", "Running", jobs.filter((j) => j.status === "working" || j.status === "thinking")],
    ["free", "Unclaimed", jobs.filter((j) => !j.owner)],
    ["done", "Shipped", jobs.filter((j) => j.status === "done")],
    ["all", "Everything", jobs],
  ];
  const active = filter ?? (gated.length ? "gate" : "all");
  const rows = buckets.find((b) => b[0] === active)?.[2] ?? jobs;
  const job = rows.find((j) => j.id === sel) ?? rows[0] ?? null;

  /** Give an agent a job, with the cap it stops at. */
  async function openJob(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setOpenError("");
    const res = await fetch("/api/floor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, budgetDollars: Number(draft.budgetDollars) }),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setOpenError(out.error || "could not open it");
      return;
    }
    setOpening(false);
    setDraft({ title: "", customerId: "", goal: "", budgetDollars: "10", ownerId: "" });
    await load();
    setSel(out.id);
    setFilter("all");
  }

  async function act(action: string, extra: Record<string, unknown> = {}) {
    if (!job) return;
    setBusy(true);
    setNote("");
    const res = await fetch(`/api/floor/${encodeURIComponent(job.id)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    const body = await res.json().catch(() => ({}));
    setNote(res.ok ? "" : body.error || "that did not work");
    setBusy(false);
    await load();
  }

  if (!floor) return <div className="p-5 text-[13px]" style={{ color: "var(--text-secondary)" }}>Reading the floor…</div>;

  const gate = job?.gate?.status === "pending" ? job.gate : null;
  const tabs: [string, string][] = [["transcript", "Transcript"]];
  if (job?.gate) tabs.push(["gate", gate ? "Needs you ●" : "Decision"]);
  tabs.push(["diff", "Diff"], ["scope", "Scope"], ["walls", "Walls"]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DeskBar>
        {buckets
          .filter(([id, , list]) => list.length || id === "all")
          .map(([id, label, list]) => (
            <button
              key={id}
              className={`btn-os ${active === id ? "brand" : ""}`}
              onClick={() => { setFilter(id); setSel(null); }}
            >
              {label} <span className="tabular-nums opacity-70">{list.length}</span>
            </button>
          ))}
        <button className="btn-os brand" onClick={() => setOpening((v) => !v)}>
          {opening ? "Cancel" : "+ New job"}
        </button>
        <span className="ml-auto text-[11px] tabular-nums" style={{ color: "var(--text-secondary)" }}>
          ${jobs.reduce((a, j) => a + j.spent, 0).toFixed(2)} today
        </span>
      </DeskBar>

      {opening ? (
        <form
          onSubmit={openJob}
          className="flex flex-wrap items-end gap-2 border-b px-4 py-3"
          style={{ borderColor: "var(--hairline)", background: "var(--surface-raised)" }}
        >
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>What to build</span>
            <input
              autoFocus
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Add a booking page"
              className="btn-os min-w-[240px]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Project</span>
            <select className="btn-os" value={draft.customerId} onChange={(e) => setDraft({ ...draft, customerId: e.target.value, ownerId: "" })}>
              <option value="">Pick one…</option>
              {(floor.customers ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Spend cap</span>
            <input
              type="number" min="1" max="500" step="1"
              value={draft.budgetDollars}
              onChange={(e) => setDraft({ ...draft, budgetDollars: e.target.value })}
              className="btn-os w-[90px] tabular-nums"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Give it to</span>
            <select className="btn-os" value={draft.ownerId} onChange={(e) => setDraft({ ...draft, ownerId: e.target.value })}>
              <option value="">Leave on the board</option>
              {floor.people
                .filter((p) => p.kind !== "agent" || p.customerId === draft.customerId)
                .map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>What good looks like</span>
            <input
              value={draft.goal}
              onChange={(e) => setDraft({ ...draft, goal: e.target.value })}
              placeholder="Optional — the agent reads this before it plans"
              className="btn-os min-w-[220px]"
            />
          </label>
          <button className="btn-os brand" type="submit" disabled={busy || !draft.title.trim() || !draft.customerId}>
            Open it
          </button>
          {openError ? <span className="text-[12px]" style={{ color: "var(--state-stop)" }}>{openError}</span> : null}
        </form>
      ) : null}

      <Dossier
        list={rows.map((j) => (
          <RollItem
            key={j.id}
            on={j.id === job?.id}
            title={`${j.gate?.status === "pending" ? "● " : ""}${j.title}`}
            meta={`${j.customer} · ${WORD[j.status] ?? j.status} · ${j.owner?.handle ?? "unclaimed"}`}
            onClick={() => { setSel(j.id); setTab("transcript"); }}
          />
        ))}
        rail={
          job ? (
            <div className="flex flex-col gap-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                Budget
              </div>
              <div className="text-[12.5px] tabular-nums" style={{ color: "var(--text-secondary)" }}>
                ${job.spent.toFixed(2)} of ${job.budget.toFixed(2)}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--surface-inset)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (job.spent / Math.max(job.budget, 0.01)) * 100)}%`,
                    background: job.spent / Math.max(job.budget, 0.01) > 0.8 ? "var(--state-stop)" : "var(--state-go)",
                  }}
                />
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                Session
              </div>
              <p className="text-[12.5px] leading-snug" style={{ color: "var(--text-secondary)" }}>
                {job.owner
                  ? `${job.owner.name} is holding this. Their Claude Code posts every step here over MCP.`
                  : "Nobody owns this. It sits on the board until a session claims it."}
              </p>
            </div>
          ) : null
        }
      >
        {!job ? (
          <div className="p-5 text-[13px]" style={{ color: "var(--text-secondary)" }}>Nothing on the floor in that filter.</div>
        ) : (
          <>
            <div className="border-b px-4 pt-4 pb-2.5" style={{ borderColor: "var(--hairline)" }}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TONE[job.status] ?? "var(--text-secondary)" }}>
                  {WORD[job.status] ?? job.status}
                </span>
                {gate ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--state-stop)" }}>needs you</span>
                ) : null}
              </div>
              <h3 className="mt-1 mb-1 text-[24px] leading-tight">{job.title}</h3>
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {job.customer} · {job.agent ?? "no agent"} · {job.owner ? `claimed by ${job.owner.handle}` : "unclaimed"}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {gate ? <button className="btn-os brand" disabled={busy} onClick={() => setTab("gate")}>Decide it</button> : null}
                {job.owner ? (
                  <button className="btn-os" disabled={busy} onClick={() => act("release")}>Release</button>
                ) : (
                  <button className="btn-os brand" disabled={busy} onClick={() => act("claim", { personId: me?.id })}>Claim</button>
                )}
                {job.status === "working" || job.status === "thinking" ? (
                  <button className="btn-os" disabled={busy} onClick={() => act("stop")}>Stop</button>
                ) : null}
              </div>
              {note ? <p className="mt-2 text-[12px]" style={{ color: "var(--state-stop)" }}>{note}</p> : null}
            </div>

            <Tabs tabs={tabs} tab={tab} onTab={setTab} />

            <div className="min-h-0 flex-1 overflow-auto p-4">
              {tab === "transcript" ? (
                <div className="text-[13px] leading-relaxed">
                  {job.steps.length ? (
                    job.steps.map((s, i) => (
                      <div
                        key={i}
                        className="mb-1.5 border-l-2 py-1 pl-2.5"
                        style={{
                          borderColor:
                            s.kind === "gate" ? "var(--state-stop)" : s.kind === "done" ? "var(--state-go)" : "var(--hairline)",
                          color: s.kind === "think" ? "var(--text-secondary)" : "inherit",
                        }}
                      >
                        <span className="mr-2 text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                          {s.actor}
                        </span>
                        {s.text}
                      </div>
                    ))
                  ) : (
                    <span style={{ color: "var(--text-secondary)" }}>No steps yet.</span>
                  )}
                </div>
              ) : null}

              {tab === "gate" && job.gate ? (
                <div className="text-[13px]">
                  <p className="mb-3 leading-relaxed">{job.gate.what}</p>
                  <Kv
                    rows={[
                      ["Blast radius", job.gate.blast ?? "—"],
                      ["Cost", job.gate.cost ?? "$0"],
                      ["Reversible", job.gate.irreversible ? <b style={{ color: "var(--state-stop)" }}>No</b> : "Yes"],
                      ["Asked by", job.gate.askedBy ?? "—"],
                      ["The wall", job.gate.guard ?? "—"],
                    ]}
                  />
                  {gate ? (
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button className="btn-os brand" disabled={busy} onClick={() => act("approve", { gateId: gate.id })}>
                        Approve{gate.irreversible ? " — I understand it sends" : ""}
                      </button>
                      <button className="btn-os" disabled={busy} onClick={() => act("reject", { gateId: gate.id })}>Reject</button>
                    </div>
                  ) : (
                    <p className="mt-5 text-[12.5px]" style={{ color: "var(--text-secondary)" }}>
                      Decided: {job.gate.status}.
                    </p>
                  )}
                </div>
              ) : null}

              {tab === "diff" ? (
                job.change ? (
                  <div className="text-[13px]">
                    <Kv rows={[["Repo", <span key="r" className="font-mono">{job.change.repo}</span>], ["Branch", <span key="b" className="font-mono">{job.change.branch}</span>], ["State", job.change.status]]} />
                    <pre className="mt-3 overflow-x-auto rounded-lg p-3 font-mono text-[12px]" style={{ background: "var(--surface-inset)" }}>
                      {job.change.diff || "no files recorded"}
                    </pre>
                  </div>
                ) : (
                  <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                    Nothing written yet. A session opens a branch with <span className="font-mono">open_branch</span>.
                  </p>
                )
              ) : null}

              {tab === "scope" ? (
                <Kv
                  rows={[
                    ["Goal", job.goal ?? "—"],
                    ["Scope", job.scope ?? "—"],
                    ["Risk", job.risk ?? "—"],
                    ["Agent", <span key="a" className="font-mono">{job.agent ?? "—"}</span>],
                  ]}
                />
              ) : null}

              {tab === "walls" ? (
                <>
                  <Kv
                    rows={[
                      ["Customer", job.customer],
                      ["Repo", <span key="r" className="font-mono">{job.repo ?? "none bound"}</span>],
                      ["Branch", <span key="b" className="font-mono">{job.branch ?? "—"}</span>],
                      ["Deploy", job.previewUrl ?? "no deploy yet"],
                    ]}
                  />
                  <p className="mt-3 text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    A session that names another customer&apos;s repo gets a 403, not a merge — and so does the human
                    holding the token.
                  </p>
                </>
              ) : null}
            </div>
          </>
        )}
      </Dossier>
    </div>
  );
}
