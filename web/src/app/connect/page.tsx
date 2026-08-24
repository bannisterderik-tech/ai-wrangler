"use client";

import { useEffect, useState } from "react";

type Customer = {
  id: string;
  name: string;
  vercel?: { connected: boolean; mode?: string; bound?: number };
};

export default function ConnectPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [teamId, setTeamId] = useState("");
  const [selected, setSelected] = useState("");
  const [error, setError] = useState(
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("error") || "" : "",
  );
  const [health, setHealth] = useState<{ integration?: boolean }>({});

  async function refresh() {
    const h = await fetch("/api/health").then((r) => r.json());
    setHealth(h);
    const data = await fetch("/api/customers").then((r) => r.json());
    setCustomers(data.customers || []);
    if (!selected && data.customers?.[0]) setSelected(data.customers[0].id);
  }

  useEffect(() => {
    refresh().catch((e) => setError(String(e.message || e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createCustomer() {
    if (!name.trim()) return;
    const row = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    }).then((r) => r.json());
    setName("");
    setSelected(row.id);
    await refresh();
  }

  async function saveToken() {
    setError("");
    const res = await fetch(`/api/customers/${selected}/vercel/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, teamId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "failed");
      return;
    }
    setToken("");
    await refresh();
  }

  const current = customers.find((c) => c.id === selected);

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-3.5 p-7">
      <div>
        <div className="text-[22px] font-semibold">Connect a customer’s Vercel</div>
        <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          One login, one token, one customer. Bound projects are the only things this workspace can
          deploy. Tokens never leak across customers.
        </p>
      </div>
      {error ? (
        <div className="rounded-[14px] border p-4 text-[13px]" style={{ borderColor: "var(--state-failed)", color: "var(--state-failed)" }}>
          {error}
        </div>
      ) : null}
      <section className="rounded-[14px] p-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}>
        <div className="mb-1.5 text-[11px] uppercase tracking-[0.6px]" style={{ color: "var(--text-secondary)" }}>
          Customer
        </div>
        <div className="mb-2.5 flex gap-2">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="flex-1 rounded-lg border px-2.5 py-2 text-[13px] outline-none"
            style={{ background: "var(--surface-inset)", borderColor: "var(--hairline)" }}
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New customer name"
            className="flex-1 rounded-lg border px-2.5 py-2 text-[13px] outline-none"
            style={{ background: "var(--surface-inset)", borderColor: "var(--hairline)" }}
          />
          <button
            onClick={createCustomer}
            className="cursor-pointer rounded-lg px-3.5 text-xs font-semibold text-white"
            style={{ background: "var(--brand)" }}
          >
            ＋ New
          </button>
        </div>
        <div className="mt-3 text-xs" style={{ color: "var(--text-secondary)" }}>
          {current?.vercel?.connected
            ? `Connected · ${current.vercel.mode} · ${current.vercel.bound ?? 0} projects bound`
            : "Not connected — this customer cannot deploy anything until a token is bound."}
        </div>
      </section>

      <section className="rounded-[14px] p-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}>
        <div className="text-[14px] font-semibold">Sign in with Vercel (Integration)</div>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {health.integration
            ? "Opens Vercel so this customer can pick which projects Wrangler may touch."
            : "Integration OAuth is not configured yet (VERCEL_INTEGRATION_CLIENT_ID / SLUG). Paste a project-scoped token below — one token, one project, one customer."}
        </p>
        <a
          href={selected ? `/api/auth/vercel/start?customerId=${encodeURIComponent(selected)}` : "#"}
          className="mt-3 inline-block rounded-lg px-3.5 py-2 text-xs font-semibold text-white no-underline"
          style={{ background: "var(--brand)" }}
        >
          Connect Vercel
        </a>
      </section>

      <section className="rounded-[14px] p-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}>
        <div className="text-[14px] font-semibold">Or paste a project-scoped token</div>
        <p className="mt-1 mb-3 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Vercel → Account Settings → Tokens, scoped to a single project.
        </p>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="vcp_…"
          className="mb-2 w-full rounded-lg border px-2.5 py-2 text-[13px] outline-none"
          style={{ background: "var(--surface-inset)", borderColor: "var(--hairline)" }}
        />
        <input
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          placeholder="team_… (optional)"
          className="mb-3 w-full rounded-lg border px-2.5 py-2 text-[13px] outline-none"
          style={{ background: "var(--surface-inset)", borderColor: "var(--hairline)" }}
        />
        <button
          onClick={saveToken}
          className="cursor-pointer rounded-lg px-3.5 py-2 text-xs font-semibold text-white"
          style={{ background: "var(--brand)" }}
        >
          Save token for this customer
        </button>
      </section>
    </div>
  );
}
