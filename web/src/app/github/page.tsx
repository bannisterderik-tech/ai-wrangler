"use client";

import { useEffect, useState } from "react";

type Repo = {
  fullName: string;
  name: string;
  private: boolean;
  url: string;
  boundTo: { customerId: string; customerName: string } | null;
};
type Customer = { id: string; name: string; github?: { bound: number; repos: string[] } };
type Status = {
  connected?: boolean;
  login?: string;
  org?: string | null;
  orgs?: string[];
  mode?: string;
  oauthReady?: boolean;
  cli?: { present: boolean; login?: string };
  hint?: string;
  error?: string;
};

export default function GithubPage() {
  const [status, setStatus] = useState<Status>({});
  const [repos, setRepos] = useState<Repo[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState("");
  const [creating, setCreating] = useState("");
  const [pat, setPat] = useState("");

  async function load() {
    const [s, c] = await Promise.all([
      fetch("/api/github/status").then((x) => x.json()),
      fetch("/api/customers").then((x) => x.json()),
    ]);
    setStatus(s);
    setCustomers(c.customers || []);
    setCustomerId((id) => id || c.customers?.[0]?.id || "");
    if (s.connected) {
      const r = await fetch("/api/github/repos").then((x) => x.json());
      if (r.error) setError(r.error);
      setRepos(r.repos || []);
    } else {
      setRepos([]);
    }
  }

  useEffect(() => {
    // Read the URL after mount so the server and client render the same first pass.
    setOrigin(window.location.origin);
    const fromUrl = new URLSearchParams(window.location.search).get("error");
    if (fromUrl) setError(fromUrl);
    load().catch((e) => setError(String(e.message || e)));
  }, []);

  useEffect(() => {
    const mine = customers.find((c) => c.id === customerId);
    setPicked(mine?.github?.repos || []);
  }, [customerId, customers]);

  function toggle(fullName: string, boundTo: Repo["boundTo"]) {
    if (boundTo && boundTo.customerId !== customerId) return;
    setPicked((p) => (p.includes(fullName) ? p.filter((x) => x !== fullName) : [...p, fullName]));
  }

  async function save() {
    setError("");
    const res = await fetch(`/api/customers/${customerId}/github`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repos: picked }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "failed");
      return;
    }
    await load();
  }

  async function createRepo() {
    if (!creating.trim()) return;
    setError("");
    const res = await fetch(`/api/customers/${customerId}/github`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ create: true, name: creating.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "failed");
      return;
    }
    setCreating("");
    await load();
  }

  async function connectPat() {
    setError("");
    const res = await fetch("/api/github/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: pat }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "failed");
      return;
    }
    setPat("");
    await load();
  }

  async function connectCli() {
    setError("");
    const res = await fetch("/api/github/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ useGhCli: true }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "failed");
      return;
    }
    await load();
  }

  async function disconnect() {
    await fetch("/api/github/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disconnect: true }),
    });
    await load();
  }

  async function pickOrg(org: string) {
    await fetch("/api/github/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ org }),
    });
    await load();
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3.5 overflow-auto p-6">
      <div>
        <div className="text-[22px] font-semibold">Our GitHub</div>
        <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Connect whichever GitHub account should own client repos. Nothing is hard-wired. Sign in as the main agency account, then bind repos to customers. Deploy still uses their Vercel.
        </p>
      </div>

      {error || status.error ? (
        <div className="rounded-[14px] border p-4 text-[13px]" style={{ borderColor: "var(--state-failed)", color: "var(--state-failed)" }}>
          {error || status.error}
        </div>
      ) : null}

      <section className="rounded-[14px] p-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}>
        {status.connected ? (
          <div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="rounded-[5px] border px-1.5 py-0.5 text-[9.5px] font-semibold" style={{ borderColor: "var(--state-running)", color: "var(--state-running)" }}>
                  Connected
                </span>
                <span className="ml-2 font-mono text-[13px]">@{status.login}</span>
                <span className="ml-2 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                  {status.mode}
                </span>
              </div>
              <button
                onClick={disconnect}
                className="cursor-pointer rounded-lg border px-3 py-1.5 text-[11.5px]"
                style={{ background: "var(--btn)", borderColor: "var(--hairline)" }}
              >
                Disconnect / switch
              </button>
            </div>
            {(status.orgs || []).length ? (
              <div className="mt-3">
                <div className="mb-1.5 text-[10px] uppercase tracking-[0.6px]" style={{ color: "var(--text-secondary)" }}>
                  List repos from
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => pickOrg("")}
                    className="cursor-pointer rounded-lg border px-2.5 py-1 text-[11.5px]"
                    style={{
                      background: !status.org ? "var(--surface-inset)" : "transparent",
                      borderColor: !status.org ? "var(--brand)" : "var(--hairline)",
                    }}
                  >
                    @{status.login} (personal)
                  </button>
                  {(status.orgs || []).map((o) => (
                    <button
                      key={o}
                      onClick={() => pickOrg(o)}
                      className="cursor-pointer rounded-lg border px-2.5 py-1 text-[11.5px]"
                      style={{
                        background: status.org === o ? "var(--surface-inset)" : "transparent",
                        borderColor: status.org === o ? "var(--brand)" : "var(--hairline)",
                      }}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {status.hint}
            </div>
            <a
              href="/api/auth/github/start"
              className="inline-block w-fit rounded-lg px-3.5 py-2 text-xs font-semibold text-white no-underline"
              style={{ background: "var(--brand)" }}
            >
              Sign in with GitHub
            </a>
            <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
              GitHub will ask which account. Pick the main agency account. (Needs an OAuth App: github.com/settings/developers → callback {origin}/api/auth/github/callback, then GITHUB_OAUTH_CLIENT_ID / SECRET in web/.env.local.)
            </div>
            {status.cli?.present ? (
              <button
                onClick={connectCli}
                className="w-fit cursor-pointer rounded-lg border px-3.5 py-2 text-xs"
                style={{ background: "var(--btn)", borderColor: "var(--hairline)" }}
              >
                Use this machine’s gh login (@{status.cli.login})
              </button>
            ) : null}
            <div>
              <div className="mb-1.5 text-[10px] uppercase tracking-[0.6px]" style={{ color: "var(--text-secondary)" }}>
                Or paste a token
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={pat}
                  onChange={(e) => setPat(e.target.value)}
                  placeholder="github_pat_… or gho_…"
                  className="flex-1 rounded-lg border px-2.5 py-2 text-[13px] outline-none"
                  style={{ background: "var(--surface-inset)", borderColor: "var(--hairline)" }}
                />
                <button
                  onClick={connectPat}
                  className="cursor-pointer rounded-lg px-3 text-xs font-semibold text-white"
                  style={{ background: "var(--brand)" }}
                >
                  Connect
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {status.connected ? (
        <section className="rounded-[14px] p-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}>
          <div className="mb-2 text-[11px] uppercase tracking-[0.6px]" style={{ color: "var(--text-secondary)" }}>
            Bind repos to customer
          </div>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="mb-3 w-full rounded-lg border px-2.5 py-2 text-[13px] outline-none"
            style={{ background: "var(--surface-inset)", borderColor: "var(--hairline)" }}
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.github?.bound ? ` · ${c.github.bound} repo(s)` : ""}
              </option>
            ))}
          </select>

          <div className="mb-3 flex gap-2">
            <input
              value={creating}
              onChange={(e) => setCreating(e.target.value)}
              placeholder="new private repo name, e.g. brightline-portal"
              className="flex-1 rounded-lg border px-2.5 py-2 text-[13px] outline-none"
              style={{ background: "var(--surface-inset)", borderColor: "var(--hairline)" }}
            />
            <button
              onClick={createRepo}
              className="cursor-pointer rounded-lg px-3 text-xs font-semibold text-white"
              style={{ background: "var(--brand)" }}
            >
              Create in this account
            </button>
          </div>

          <div className="max-h-[320px] overflow-y-auto">
            {repos.map((r) => {
              const blocked = r.boundTo && r.boundTo.customerId !== customerId;
              const on = picked.includes(r.fullName);
              return (
                <label
                  key={r.fullName}
                  className="flex items-center gap-2.5 border-t py-2 text-[12.5px]"
                  style={{ borderColor: "var(--hairline)", opacity: blocked ? 0.45 : 1 }}
                >
                  <input
                    type="checkbox"
                    disabled={!!blocked}
                    checked={on}
                    onChange={() => toggle(r.fullName, r.boundTo)}
                  />
                  <span className="font-mono flex-1">{r.fullName}</span>
                  {r.private ? (
                    <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                      private
                    </span>
                  ) : null}
                  {r.boundTo ? (
                    <span className="text-[10px]" style={{ color: "var(--state-running)" }}>
                      {r.boundTo.customerName}
                    </span>
                  ) : null}
                </label>
              );
            })}
            {status.connected && !repos.length ? (
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                No repos visible on this account.
              </div>
            ) : null}
          </div>
          <button
            onClick={save}
            className="mt-3 cursor-pointer rounded-lg px-3.5 py-2 text-xs font-semibold text-white"
            style={{ background: "var(--brand)" }}
          >
            Save bindings for this customer
          </button>
        </section>
      ) : null}
    </div>
  );
}
