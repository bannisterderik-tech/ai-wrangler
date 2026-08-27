"use client";

import { useCallback, useEffect, useState } from "react";
import { DeskBar, Dossier, Kv, RollItem, Tabs } from "@/components/os/Dossier";

type Person = {
  id: string; name: string; handle: string; role: string; approver: boolean;
  machine: string | null; status: string; clientVersion: string | null; connectedAt: string | null;
  tokenPrefix: string | null; hasToken: boolean;
  scope: string[]; grants: string[]; claimed: number;
};
type Payload = { people: Person[]; tools: { name: string; description: string }[] };
type Customer = { id: string; name: string };

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

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([
      fetch("/api/people", { cache: "no-store" }),
      fetch("/api/floor", { cache: "no-store" }),
    ]);
    if (a.ok) setData(await a.json());
    if (b.ok) setCustomers((await b.json()).customers ?? []);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  async function post(id: string, body: Record<string, unknown>) {
    setBusy(true);
    const res = await fetch(`/api/people/${encodeURIComponent(id)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const out = await res.json().catch(() => ({}));
    if (out.token) setRevealed((r) => ({ ...r, [id]: out.token }));
    setBusy(false);
    await load();
  }

  if (!data) return <div className="p-5 text-[13px]" style={{ color: "var(--text-secondary)" }}>Reading sessions…</div>;

  const who = data.people.find((p) => p.id === sel) ?? data.people[0];
  if (!who) return <div className="p-5 text-[13px]">Nobody on the floor yet.</div>;

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
        <span className="ml-auto text-[11px]" style={{ color: "var(--text-secondary)" }}>
          Everyone brings their own Claude Code. Nobody shares a login.
        </span>
      </DeskBar>

      <Dossier
        list={data.people.map((p) => (
          <RollItem
            key={p.id}
            on={p.id === who.id}
            title={p.name}
            meta={`${p.role} · ${p.status} · ${p.claimed} claimed`}
            onClick={() => { setSel(p.id); setTab("connect"); }}
          />
        ))}
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
          </div>
        </div>

        <Tabs
          tabs={[["connect", "Connect"], ["tools", "Tools"], ["scope", "Scope"]]}
          tab={tab}
          onTab={setTab}
        />

        <div className="min-h-0 flex-1 overflow-auto p-4">
          {tab === "connect" ? (
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

          {tab === "scope" ? (
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
