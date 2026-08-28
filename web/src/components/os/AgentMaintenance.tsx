"use client";

import { useCallback, useEffect, useState } from "react";

type Verb = { id: string; what: string };
type Cmd = {
  id: string; command: string; args: string | null; issuedBy: string;
  issuedAt: string; status: string; result: string | null;
};
type Health = {
  id: string; name: string; state: string; secondsAgo: number | null;
  host: string | null; cliVersion: string | null; passes: number;
  lastCostUsd: number | null; spentUsd: number; ceilingUsd: number | null;
  detail: string | null; bare: boolean | null; resuming: boolean | null;
};

const TONE: Record<string, string> = {
  ok: "var(--state-go)", idle: "var(--text-secondary)", stuck: "var(--state-blocked)",
  unbilled: "var(--state-stop)", stopped: "var(--state-stop)",
  silent: "var(--state-stop)", never: "var(--text-secondary)",
};
const SAYS: Record<string, string> = {
  ok: "working", idle: "nothing to do", stuck: "a pass hit the time limit",
  unbilled: "spending without recording it", stopped: "stopped",
  silent: "has not reported in", never: "has never reported",
};

const ago = (s: number | null) =>
  s === null ? "never" : s < 90 ? `${s}s ago` : s < 5400 ? `${Math.round(s / 60)}m ago` : `${Math.round(s / 3600)}h ago`;

/**
 * Keeping a client's agent alive, without a terminal.
 *
 * A managed agent runs on somebody else's behalf on a box the client never
 * sees, so the work of maintaining it is ours. These are the same verbs an SSH
 * session would use, as a fixed list — a channel that runs arbitrary shell on a
 * client's machine is a backdoor that keeps a nice log.
 *
 * Health is what the agent says about itself rather than what a provider says
 * about the box. A provider's uptime graph was green throughout the incident
 * that cost $20.
 */
export function AgentMaintenance({ personId, agentName }: { personId: string; agentName: string }) {
  const [health, setHealth] = useState<Health | null>(null);
  const [verbs, setVerbs] = useState<Verb[]>([]);
  const [cmds, setCmds] = useState<Cmd[]>([]);
  const [version, setVersion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [h, c] = await Promise.all([
      fetch("/api/agent/heartbeat", { cache: "no-store" }),
      fetch(`/api/agent/commands?agent=${encodeURIComponent(personId)}`, { cache: "no-store" }),
    ]);
    if (h.ok) setHealth(((await h.json()).agents ?? []).find((a: Health) => a.id === personId) ?? null);
    if (c.ok) {
      const d = await c.json();
      setVerbs(d.verbs ?? []);
      setCmds(d.commands ?? []);
    }
  }, [personId]);
  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  async function send(command: string, args?: string) {
    setBusy(true);
    setError("");
    const res = await fetch("/api/agent/commands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent: personId, command, args }),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out.error || "could not queue that");
    await load();
  }

  const state = health?.state ?? "never";

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-lg p-3" style={{ background: "var(--surface-raised)" }}>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TONE[state] }}>
            {SAYS[state] ?? state}
          </span>
          <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
            heard {ago(health?.secondsAgo ?? null)}
            {health?.host ? ` · ${health.host}` : ""}
            {health?.cliVersion ? ` · claude ${health.cliVersion}` : ""}
          </span>
        </div>
        {health ? (
          <>
            <div className="mt-1.5 text-[12.5px]">
              {health.passes} pass{health.passes === 1 ? "" : "es"}
              {health.lastCostUsd !== null ? ` · last $${health.lastCostUsd.toFixed(2)}` : ""}
              {health.ceilingUsd
                ? ` · $${health.spentUsd.toFixed(2)} of its $${health.ceilingUsd.toFixed(2)} ceiling`
                : ""}
            </div>
            {health.detail ? (
              <div className="mt-0.5 text-[12px]" style={{ color: "var(--text-secondary)" }}>{health.detail}</div>
            ) : null}
            {health.bare === false ? (
              <div className="mt-1.5 text-[12px]" style={{ color: "var(--state-blocked)" }}>
                Running without --bare: the checkout&apos;s own hooks and CLAUDE.md load into this agent.
              </div>
            ) : null}
          </>
        ) : (
          <p className="mt-1.5 max-w-[62ch] text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {agentName} has never reported in. Either it is not deployed, or it is running a build too old to
            report — a box being powered on is not the same as an agent working.
          </p>
        )}
      </div>

      <div>
        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[1.4px]" style={{ color: "var(--text-secondary)" }}>
          Maintenance
        </div>
        <p className="mb-2 max-w-[66ch] text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Picked up on its next cycle. These are the only things it will do — there is no arbitrary command,
          on purpose, because this runs on a client&apos;s machine.
        </p>
        <div className="flex flex-wrap items-end gap-1.5">
          {verbs
            .filter((v) => v.id !== "update")
            .map((v) => (
              <button key={v.id} className="btn-os" disabled={busy} title={v.what} onClick={() => send(v.id)}>
                {v.id.replace("_", " ")}
              </button>
            ))}
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              Update to
            </span>
            <div className="flex gap-1.5">
              <input className="btn-os w-[110px]" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="2.1.236" />
              <button className="btn-os" disabled={busy || !/^\d+\.\d+\.\d+$/.test(version)} onClick={() => send("update", version)}>
                Update
              </button>
            </div>
          </label>
        </div>
        {error ? <p className="mt-2 text-[12.5px]" style={{ color: "var(--state-stop)" }}>{error}</p> : null}
      </div>

      {cmds.length ? (
        <div>
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[1.4px]" style={{ color: "var(--text-secondary)" }}>
            Lately
          </div>
          <div className="flex flex-col gap-1.5">
            {cmds.slice(0, 8).map((c) => (
              <div key={c.id} className="flex flex-wrap items-baseline gap-2 border-b pb-1.5 text-[12px]" style={{ borderColor: "var(--hairline)" }}>
                <span className="w-[78px] shrink-0 font-semibold">{c.command.replace("_", " ")}</span>
                <span className="w-[58px] shrink-0" style={{ color: c.status === "failed" ? "var(--state-stop)" : "var(--text-secondary)" }}>
                  {c.status}
                </span>
                <span className="min-w-[160px] flex-1" style={{ color: "var(--text-secondary)" }}>
                  {c.result ?? `by ${c.issuedBy}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
