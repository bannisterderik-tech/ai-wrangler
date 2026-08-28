"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Conn = {
  id: string; provider: string; name: string; category: string;
  gives: string | null; available: boolean; buildNote: string | null;
  label: string | null; status: string; note: string | null;
};
type Cat = { id: string; label: string };
type CatalogItem = { id: string; name: string; category: string; gives: string; available: boolean; note?: string };

const TONE: Record<string, string> = {
  needed: "var(--state-blocked)",
  connected: "var(--state-go)",
  blocked: "var(--state-stop)",
  dropped: "var(--text-secondary)",
};
const WORD: Record<string, string> = {
  needed: "needed", connected: "connected", blocked: "blocked", dropped: "dropped",
};

/**
 * What one agent has to reach, and what it actually can.
 *
 * A customer running four businesses arrives with a tool sprawl — two mailboxes,
 * three calendars, Teams, WhatsApp, Asana, an ERP — and the first useful thing
 * is the list, not the integrations. So a dependency is recorded whether or not
 * the OS can connect it, and the screen is blunt about which is which: nothing
 * here may claim "connected" for a connector that does not exist.
 */
export function AgentConnections({ personId, agentName }: { personId: string; agentName: string }) {
  const [conns, setConns] = useState<Conn[] | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [pick, setPick] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/people/${personId}/connections`, { cache: "no-store" });
    if (!res.ok) return;
    const d = await res.json();
    setConns(d.connections ?? []);
    setCatalog(d.catalog ?? []);
    setCats(d.categories ?? []);
  }, [personId]);
  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    if (!pick) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/people/${personId}/connections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: pick, label }),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out.error || "could not add it");
    setPick("");
    setLabel("");
    await load();
  }

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/people/${personId}/connections`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out.error || "that did not work");
    await load();
  }

  const grouped = useMemo(() => {
    const by: Record<string, Conn[]> = {};
    for (const c of conns ?? []) (by[c.category] ??= []).push(c);
    return by;
  }, [conns]);

  if (!conns) return <p className="p-4 text-[13px]" style={{ color: "var(--text-secondary)" }}>Reading…</p>;

  const ready = conns.filter((c) => c.status === "connected").length;
  const waiting = conns.filter((c) => c.status === "needed").length;

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="max-w-[64ch] text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        Everything {agentName} has to reach to be useful. List it all first — the map is the scope of the job.
        A row says <strong>needed</strong> until something actually connects it, and the OS will not let a
        connector it does not have mark itself connected.
      </p>

      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Add a dependency</span>
          <select className="btn-os min-w-[230px]" value={pick} onChange={(e) => setPick(e.target.value)}>
            <option value="">Pick a system…</option>
            {cats.map((cat) => (
              <optgroup key={cat.id} label={cat.label}>
                {catalog.filter((c) => c.category === cat.id).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.available ? "" : " (no connector yet)"}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Which account</span>
          <input
            className="btn-os min-w-[170px]" value={label} onChange={(e) => setLabel(e.target.value)}
            placeholder="Synergy Innovation"
          />
        </label>
        <button className="btn-os brand" disabled={busy || !pick} onClick={add}>Add</button>
        <span className="text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
          {ready} connected · {waiting} still needed
        </span>
      </div>
      {error ? <p className="text-[12.5px]" style={{ color: "var(--state-stop)" }}>{error}</p> : null}

      {conns.length === 0 ? (
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Nothing mapped yet. Start with where their work actually arrives — the mailbox and the calendar —
          then the system that holds the money.
        </p>
      ) : (
        cats
          .filter((cat) => grouped[cat.id]?.length)
          .map((cat) => (
            <div key={cat.id}>
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[1.4px]" style={{ color: "var(--text-secondary)" }}>
                {cat.label}
              </div>
              <div className="flex flex-col gap-2">
                {grouped[cat.id].map((c) => (
                  <div key={c.id} className="rounded-lg border p-2.5" style={{ borderColor: "var(--hairline)" }}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[13px] font-semibold">{c.name}</span>
                        {c.label ? (
                          <span className="ml-1.5 text-[12px]" style={{ color: "var(--text-secondary)" }}>· {c.label}</span>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider" style={{ color: TONE[c.status] }}>
                        {WORD[c.status] ?? c.status}
                      </span>
                    </div>
                    {c.gives ? (
                      <p className="mt-0.5 text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{c.gives}</p>
                    ) : null}
                    {!c.available && c.buildNote ? (
                      <p className="mt-1 text-[11.5px] leading-relaxed" style={{ color: "var(--state-blocked)" }}>
                        No connector yet — {c.buildNote}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {["needed", "connected", "blocked", "dropped"].map((st) => (
                        <button
                          key={st}
                          className={`btn-os ${c.status === st ? "brand" : ""}`}
                          disabled={busy}
                          onClick={() =>
                            patch({
                              id: c.id,
                              status: st,
                              // Marking an unbuilt connector "connected" is only
                              // allowed as a deliberate statement that a human
                              // wired it up outside the OS.
                              iConnectedItMyself:
                                st === "connected" && !c.available
                                  ? confirm(
                                      `${c.name} has no connector in the OS. Only say yes if you have wired this up ` +
                                        `yourself outside AI Wrangler — otherwise this screen starts lying about what works.`,
                                    )
                                  : undefined,
                            })
                          }
                        >
                          {st}
                        </button>
                      ))}
                      <button className="btn-os ml-auto" disabled={busy} onClick={() => patch({ id: c.id, remove: true })}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
      )}
    </div>
  );
}
