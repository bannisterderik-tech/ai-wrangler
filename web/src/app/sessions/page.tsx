"use client";

import { useCallback, useEffect, useState } from "react";
import { DeskBar, Dossier, Kv, RollItem, Tabs } from "@/components/os/Dossier";
import Link from "next/link";
import { AgentConnections } from "@/components/os/AgentConnections";
import { AgentMaintenance } from "@/components/os/AgentMaintenance";
import { AgentTraces } from "@/components/os/AgentTraces";

type Person = {
  id: string; name: string; handle: string; role: string; approver: boolean;
  kind: string; agentKind?: string | null; brief?: string | null; customerId: string | null;
  machine: string | null; status: string; clientVersion: string | null; connectedAt: string | null;
  tokenPrefix: string | null; hasToken: boolean;
  scope: string[]; grants: string[]; claimed: number;
};
type Payload = { people: Person[]; tools: { name: string; description: string }[] };
type Customer = { id: string; name: string };
type Railway = { connected: boolean; serviceId: string | null; blocked?: string; anthropic: boolean };

const TONE: Record<string, string> = {
  connected: "var(--state-go)", idle: "var(--state-thinking)",
  invited: "var(--state-running)", revoked: "var(--state-stop)",
};

/**
 * Sessions. Everyone brings their own Claude Code — their own token, their own
 * customer scope, their own audit trail. Nobody shares a login.
 */
export default function SessionsPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [tab, setTab] = useState("connect");
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState<"operator" | "agent" | null>(null);
  const [newName, setNewName] = useState("");
  const [newCustomer, setNewCustomer] = useState("");
  const [newAgentKind, setNewAgentKind] = useState<"build" | "copilot">("build");
  const [newBrief, setNewBrief] = useState("");
  const [addError, setAddError] = useState("");
  const [railway, setRailway] = useState<Railway | null>(null);
  const [rwToken, setRwToken] = useState("");
  const [aiKey, setAiKey] = useState("");
  const [deployNote, setDeployNote] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [a, b, r] = await Promise.all([
      fetch("/api/people", { cache: "no-store" }),
      fetch("/api/floor", { cache: "no-store" }),
      fetch("/api/railway", { cache: "no-store" }),
    ]);
    if (a.ok) setData(await a.json());
    if (b.ok) setCustomers((await b.json()).customers ?? []);
    if (r.ok) setRailway(await r.json());
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  /** A teammate, or an agent — an agent is just a person row nobody logs in as. */
  async function addPerson(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setAddError("");
    const res = await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        kind: adding,
        customerId: adding === "agent" ? newCustomer : undefined,
        agentKind: adding === "agent" ? newAgentKind : undefined,
        brief: newAgentKind === "copilot" ? newBrief : undefined,
      }),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setAddError(out.error || "could not add them");
      return;
    }
    setNewName("");
    setNewBrief("");
    setAdding(null);
    await load();
    setSel(out.id);
    setTab("connect");
  }

  /**
   * Delete an agent.
   *
   * The confirmation names it and says what goes with it, because a revoked
   * agent and a deleted one look identical in a list and only one comes back.
   */
  async function remove(who: { id: string; name: string; hasToken?: boolean }) {
    if (
      !confirm(
        `Delete ${who.name}?\n\nIts session, its queued commands and anything it had not read go with it. ` +
          `Jobs it worked stay, and keep its name in their history.\n\nThis cannot be undone.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/people/${encodeURIComponent(who.id)}`, { method: "DELETE" });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out.error || "could not delete that");
    setSel(null);
    await load();
  }

  async function post(id: string, body: Record<string, unknown>) {
    setBusy(true);
    const res = await fetch(`/api/people/${encodeURIComponent(id)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const out = await res.json().catch(() => ({}));
    if (out.token) setRevealed((r) => ({ ...r, [id]: out.token }));
    if (out.deploy) {
      setDeployNote(
        out.deploy.deployed
          ? out.deploy.created
            ? out.deploy.rebuilt
              ? "The old worker was gone, so a new one was created and is deploying now."
              : "Worker service created on Railway and deploying now."
            : `Handed to the worker — ${out.deploy.agents} agent(s) running. Redeploying.`
          : `Not deployed: ${out.deploy.why}`,
      );
    }
    setBusy(false);
    await load();
  }

  if (!data) return <div className="p-5 text-[13px]" style={{ color: "var(--text-secondary)" }}>Reading sessions…</div>;

  // This screen is agents only, so the fallback selection has to be an agent
  // too. It used to be data.people[0], which is whoever was created first —
  // usually a human, shown in full on a page that no longer lists humans.
  const agents = data.people.filter((p) => p.kind === "agent");
  const who = agents.find((p) => p.id === sel) ?? agents[0];
  if (!who) {
    return (
      <div className="max-w-[62ch] p-5 text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        No agents yet. A <strong>build agent</strong> works the code we run for a customer. A{" "}
        <strong>customer copilot</strong> works alongside their own business — their mail, calendar, chat and
        books — and answers to them rather than to the floor. Add one above.
      </div>
    );
  }

  const origin = typeof window === "undefined" ? "https://your-host" : window.location.origin;
  const token = revealed[who.id];
  const cmd = [
    "claude mcp add wrangler \\",
    `  --transport http ${origin}/api/mcp \\`,
    `  --header "Authorization: Bearer ${token ?? (who.tokenPrefix ? who.tokenPrefix + "…" : "<mint a token first>")}"`,
  ].join("\n");

  const live = data.people.filter((p) => p.status === "connected").length;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DeskBar>
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--state-go)" }}>
          {live} connected
        </span>
        <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
          {data.people.reduce((a, p) => a + p.claimed, 0)} jobs claimed
        </span>
        {adding ? (
          <form onSubmit={addPerson} className="flex items-center gap-1.5">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={newAgentKind === "copilot" ? "Copilot name, e.g. van-copilot" : "Agent name, e.g. apex-builder"}
              className="btn-os min-w-[190px]"
            />
            {adding === "agent" ? (
              <>
              <select className="btn-os" value={newAgentKind} onChange={(e) => setNewAgentKind(e.target.value as "build" | "copilot")}>
                <option value="build">Build agent — works their code</option>
                <option value="copilot">Customer copilot — works their business</option>
              </select>
              <select className="btn-os" value={newCustomer} onChange={(e) => setNewCustomer(e.target.value)}>
                <option value="">Which customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {newAgentKind === "copilot" ? (
                <input
                  className="btn-os min-w-[240px]"
                  value={newBrief}
                  onChange={(e) => setNewBrief(e.target.value)}
                  placeholder="What it is for — e.g. run four businesses out of one inbox"
                />
              ) : null}
              </>
            ) : null}
            <button
              className="btn-os brand"
              type="submit"
              disabled={busy || !newName.trim() || (adding === "agent" && !newCustomer)}
            >
              Add {adding === "agent" ? "agent" : "teammate"}
            </button>
            <button className="btn-os" type="button" onClick={() => { setAdding(null); setAddError(""); }}>Cancel</button>
          </form>
        ) : (
          <>
            <button className="btn-os brand" onClick={() => { setAdding("agent"); setNewAgentKind("build"); }}>
              + Build agent
            </button>
            <button className="btn-os" onClick={() => { setAdding("agent"); setNewAgentKind("copilot"); }}>
              + Customer copilot
            </button>
          </>
        )}
        {addError ? <span className="text-[11px]" style={{ color: "var(--state-stop)" }}>{addError}</span> : null}
        <span className="ml-auto text-[11px]" style={{ color: "var(--text-secondary)" }}>
          One agent per project. Teammates and their own Claude Code live on{" "}
          <Link href="/team" className="underline">The team</Link>.
        </span>
      </DeskBar>

      <Dossier
        list={
          <>
            {([["build", "Build agents — they work the code"], ["copilot", "Customer copilots — they work the business"]] as const).map(([kindId, label]) => {
              const group = data.people.filter(
                (p) => p.kind === "agent" && (p.agentKind ?? "build") === kindId,
              );
              if (!group.length) return null;
              return (
                <div key={kindId}>
                  <div
                    className="border-b px-3 py-2 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ borderColor: "var(--hairline)", color: "var(--text-secondary)" }}
                  >
                    {label}
                  </div>
                  {group.map((p) => (
                    <RollItem
                      key={p.id}
                      on={p.id === who.id}
                      title={p.name}
                      meta={`${customers.find((c) => c.id === p.customerId)?.name ?? p.customerId} · ${p.status}${
                        kindId === "build" ? ` · ${p.claimed} claimed` : ""
                      }`}
                      onClick={() => { setSel(p.id); setTab("connect"); }}
                    />
                  ))}
                </div>
              );
            })}
          </>
        }
        rail={
          <div className="flex flex-col gap-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              Why their own Claude Code
            </div>
            <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              One shared agent account means one blast radius. Each session carries its own token, its own customer
              scope and its own audit trail, so &ldquo;who told it to do that&rdquo; always has an answer.
            </p>
            <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              The token
            </div>
            <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Stored as a SHA-256, never in the clear. It is shown once when you mint it. If they lose it, rotate —
              there is no way to read it back, including for us.
            </p>
          </div>
        }
      >
        <div className="border-b px-4 pt-4 pb-2.5" style={{ borderColor: "var(--hairline)" }}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TONE[who.status] }}>
              {who.status}
            </span>
            {who.approver ? (
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--brand-text)" }}>approver</span>
            ) : null}
          </div>
          <h3 className="mt-1 mb-1 text-[24px] leading-tight">{who.name}</h3>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
            <span className="font-mono">{who.handle}</span> · {who.role} · {who.machine ?? "—"}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button className="btn-os brand" disabled={busy} onClick={() => post(who.id, { action: "token" })}>
              {who.hasToken ? "Rotate token" : "Mint token"}
            </button>
            {who.hasToken ? (
              <button className="btn-os" disabled={busy} onClick={() => post(who.id, { action: "revoke" })}>
                Revoke session
              </button>
            ) : null}
            <button className="btn-os stop ml-auto" disabled={busy} onClick={() => remove(who)}>
              Delete
            </button>
          </div>
          {error ? (
            <div className="mt-2 text-[12.5px]" style={{ color: "var(--state-stop)" }}>{error}</div>
          ) : null}
        </div>

        <Tabs
          tabs={
            (who.agentKind ?? "build") === "copilot"
              ? [["reach", "What it can reach"], ["why", "Why it did that"], ["health", "Health"], ["connect", "Connect"], ["tools", "Tools"], ["scope", "Scope"]]
              : [["health", "Health"], ["why", "Why it did that"], ["connect", "Connect"], ["reach", "What it can reach"], ["tools", "Tools"], ["scope", "Scope"]]
          }
          tab={tab}
          onTab={setTab}
        />

        <div className="min-h-0 flex-1 overflow-auto p-4">
          {tab === "why" ? (
            <div className="-m-4"><AgentTraces personId={who.id} /></div>
          ) : tab === "health" ? (
            <div className="-m-4">
              <AgentMaintenance personId={who.id} agentName={who.name} />
            </div>
          ) : null}
          {tab === "reach" ? (
            <div className="-m-4">
              {who.brief ? (
                <p className="border-b px-4 py-3 text-[13px] leading-relaxed" style={{ borderColor: "var(--hairline)" }}>
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    What it is for
                  </span>
                  <br />
                  {who.brief}
                </p>
              ) : null}
              <AgentConnections personId={who.id} agentName={who.name} />
            </div>
          ) : null}
          {tab === "connect" && who.kind === "agent" ? (
            <>
              <p className="mb-3 max-w-[62ch] text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                An agent has no laptop. Minting its token hands it straight to the worker on Railway and
                redeploys — you do not open that dashboard.
              </p>
              {railway?.connected ? (
                <div
                  className="rounded-lg border px-3 py-2.5 text-[12.5px] leading-relaxed"
                  style={{ borderColor: "color-mix(in srgb, var(--state-go) 40%, var(--hairline))" }}
                >
                  Railway is connected{railway.serviceId ? " and the worker exists" : " — the worker will be created on the first agent"}.
                  {railway.anthropic ? null : (
                    <div className="mt-2" style={{ color: "var(--state-blocked)" }}>
                      No Anthropic key yet — the agent would have nothing to think with.
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div
                    className="rounded-lg border px-3 py-2.5 text-[12.5px] leading-relaxed"
                    style={{ borderColor: "color-mix(in srgb, var(--state-blocked) 40%, var(--hairline))" }}
                  >
                    {railway?.blocked ?? "Railway is not connected."} Paste a Railway API token once
                    (railway.com → Account → Tokens) and agents deploy themselves from here after that.
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="password"
                      value={rwToken}
                      onChange={(e) => setRwToken(e.target.value)}
                      placeholder="Railway API token"
                      className="btn-os min-w-[240px]"
                    />
                    <button
                      className="btn-os brand"
                      disabled={busy || !rwToken.trim()}
                      onClick={async () => {
                        setBusy(true);
                        const res = await fetch("/api/railway", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ token: rwToken }),
                        });
                        const out = await res.json().catch(() => ({}));
                        setDeployNote(res.ok ? "Railway connected." : out.error || "could not connect");
                        setRwToken("");
                        setBusy(false);
                        await load();
                      }}
                    >
                      Connect Railway
                    </button>
                  </div>
                </div>
              )}
              {railway && !railway.anthropic ? (
                <div className="mt-2 flex gap-1.5">
                  <input
                    type="password"
                    value={aiKey}
                    onChange={(e) => setAiKey(e.target.value)}
                    placeholder="Anthropic API key (sk-ant-…)"
                    className="btn-os min-w-[240px]"
                  />
                  <button
                    className="btn-os brand"
                    disabled={busy || !aiKey.trim()}
                    onClick={async () => {
                      setBusy(true);
                      const res = await fetch("/api/railway", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ anthropicKey: aiKey }),
                      });
                      const out = await res.json().catch(() => ({}));
                      setDeployNote(res.ok ? "Anthropic key saved. Agents get it from here." : out.error || "could not save");
                      setAiKey("");
                      setBusy(false);
                      await load();
                    }}
                  >
                    Save key
                  </button>
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  className="btn-os"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setDeployNote("Redeploying the worker…");
                    const res = await fetch("/api/railway", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "redeploy" }),
                    });
                    const out = await res.json().catch(() => ({}));
                    setDeployNote(
                      res.ok
                        ? "Worker redeploying. It picks up the newest image; give it a minute, then watch the floor."
                        : out.error || "could not redeploy",
                    );
                    setBusy(false);
                    await load();
                  }}
                >
                  Redeploy the worker
                </button>
                <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                  Pulls the latest build. Use it after a worker fix lands — no Railway tab.
                </span>
              </div>
              {deployNote ? (
                <p className="mt-3 text-[12.5px]" style={{ color: "var(--text-secondary)" }}>{deployNote}</p>
              ) : null}
              <div className="mt-5">
                <Kv
                  rows={[
                    ["Project", customers.find((c) => c.id === who.customerId)?.name ?? who.customerId ?? "—"],
                    ["Token", who.hasToken ? "installed on the worker" : "not minted yet"],
                    ["Last seen", who.connectedAt ? new Date(who.connectedAt).toLocaleString() : "never"],
                    ["Claimed", `${who.claimed} job${who.claimed === 1 ? "" : "s"}`],
                  ]}
                />
              </div>
            </>
          ) : null}

          {tab === "connect" && who.kind !== "agent" ? (
            <>
              <p className="mb-3 max-w-[62ch] text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {who.name.split(" ")[0]} runs this once on their own laptop. Their Claude Code then sees the board,
                claims work, and streams every step back here — scoped to the customers below and nothing else.
              </p>
              <pre
                className="overflow-x-auto rounded-lg border-l-2 p-3.5 font-mono text-[12.5px] leading-relaxed"
                style={{ background: "var(--surface-inset)", borderColor: "var(--brand)" }}
              >
                {cmd}
              </pre>
              {token ? (
                <p className="mt-2 text-[12.5px]" style={{ color: "var(--state-go)" }}>
                  Copy it now — this is the only time it is shown. It is stored as a hash.
                </p>
              ) : (
                <p className="mt-2 text-[12.5px]" style={{ color: "var(--text-secondary)" }}>
                  {who.hasToken
                    ? "A token is installed. It cannot be read back — rotate to issue a new one."
                    : "No token yet. Mint one to give them a session."}
                </p>
              )}
              <div className="mt-5">
                <Kv
                  rows={[
                    ["Client", who.clientVersion ?? "not connected yet"],
                    ["Last seen", who.connectedAt ? new Date(who.connectedAt).toLocaleString() : "never"],
                    ["Claimed", `${who.claimed} job${who.claimed === 1 ? "" : "s"}`],
                    ["Can approve", who.approver ? "Yes — irreversible things stop here" : "No — their gates route to you"],
                  ]}
                />
              </div>
            </>
          ) : null}

          {tab === "tools" ? (
            <>
              {data.tools.map((t) => {
                const on = who.grants.includes(t.name);
                return (
                  <div
                    key={t.name}
                    className="flex items-start justify-between gap-3 border-b py-3"
                    style={{ borderColor: "var(--hairline)" }}
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-[13px]" style={{ color: on ? "var(--brand-text)" : "var(--text-secondary)" }}>
                        {t.name}
                      </div>
                      <div className="mt-1 text-[12px]" style={{ color: "var(--text-secondary)" }}>{t.description}</div>
                    </div>
                    <button
                      className={`btn-os shrink-0 ${on ? "" : "brand"}`}
                      disabled={busy}
                      onClick={() => post(who.id, { action: "tool", tool: t.name })}
                    >
                      {on ? "Granted" : "Grant"}
                    </button>
                  </div>
                );
              })}
              <p className="mt-4 max-w-[62ch] text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                A tool that is not granted is not in their <span className="font-mono">tools/list</span> at all, and
                calling it by name is refused. This is enforced in the server, not asked for in a prompt.
              </p>
            </>
          ) : null}

          {tab === "scope" && who.kind === "agent" ? (
            <>
              <Kv rows={[["Project", customers.find((c) => c.id === who.customerId)?.name ?? who.customerId ?? "—"]]} />
              <p className="mt-4 max-w-[62ch] text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                An agent belongs to one project. Its scope is a column on the row, not a list somebody
                maintains — there is no second customer to grant it, and no toggle to forget. If you need an
                agent on another project, make another agent.
              </p>
            </>
          ) : null}

          {tab === "scope" && who.kind !== "agent" ? (
            <>
              {customers.map((c) => {
                const on = who.scope.includes(c.id);
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 border-b py-3"
                    style={{ borderColor: "var(--hairline)" }}
                  >
                    <div>
                      <div className="text-[13px]">{c.name}</div>
                      <div className="font-mono text-[11px]" style={{ color: "var(--text-secondary)" }}>{c.id}</div>
                    </div>
                    <button
                      className={`btn-os shrink-0 ${on ? "" : "brand"}`}
                      disabled={busy}
                      onClick={() => post(who.id, { action: "scope", customerId: c.id })}
                    >
                      {on ? "Scoped" : "Grant"}
                    </button>
                  </div>
                );
              })}
              <p className="mt-4 max-w-[62ch] text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Scope is checked on every tool call. <span className="font-mono">read_bound_repo</span> on a customer
                outside this list returns the same refusal an agent gets. Asking nicely does not change it.
              </p>
            </>
          ) : null}
        </div>
      </Dossier>
    </div>
  );
}
