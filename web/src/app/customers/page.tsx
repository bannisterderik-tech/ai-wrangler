"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DeskBar, Dossier, Kv, RollItem, Tabs } from "@/components/os/Dossier";
import { CustomerWork } from "@/components/os/CustomerWork";

type Customer = {
  id: string; name: string;
  vercel?: { connected: boolean; mode?: string; bound?: number };
  github?: { bound: number; repos: string[] };
};

/** Who we run. Real rows — bindings and all — not a mockup. */
export default function CustomersPage() {
  const [rows, setRows] = useState<Customer[] | null>(null);
  const [id, setId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"overview" | "work">("overview");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/customers", { cache: "no-store" });
    if (res.ok) setRows((await res.json()).customers ?? []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out.error || "could not add them");
    setAdding(false);
    setName("");
    await load();
    setId(out.id ?? out.customer?.id ?? null);
  }

  if (!rows) return <div className="p-5 text-[13px]" style={{ color: "var(--text-secondary)" }}>Reading the book…</div>;

  const shown = rows.filter((c) => !q.trim() || c.name.toLowerCase().includes(q.trim().toLowerCase()));
  const open = Boolean(id && shown.some((c) => c.id === id));
  const c = shown.find((x) => x.id === id) ?? shown[0] ?? null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DeskBar>
        <input className="btn-os min-w-[200px]" placeholder="Search customers…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn-os brand" onClick={() => setAdding((v) => !v)}>{adding ? "Cancel" : "+ New customer"}</button>
        <span className="ml-auto text-[11px]" style={{ color: "var(--text-secondary)" }}>
          {rows.length} on the books · {rows.filter((x) => (x.github?.bound ?? 0) > 0).length} with a repo bound
        </span>
      </DeskBar>

      {adding ? (
        <form onSubmit={add} className="flex flex-wrap items-end gap-2 border-b px-4 py-3" style={{ borderColor: "var(--hairline)", background: "var(--surface-raised)" }}>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Their name</span>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Red Bank Outfitters" className="btn-os min-w-[240px]" />
          </label>
          <button className="btn-os brand" type="submit" disabled={busy || !name.trim()}>Add</button>
          {error ? <span className="text-[12px]" style={{ color: "var(--state-stop)" }}>{error}</span> : null}
        </form>
      ) : null}

      <Dossier
        onClose={() => setId(null)}
        list={
          shown.length === 0 ? (
            <div className="p-5 text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {rows.length === 0 ? "Nobody on the books yet." : "Nothing matches that."}
            </div>
          ) : (
            shown.map((x) => (
              <RollItem
                key={x.id}
                on={open && x.id === c?.id}
                title={x.name}
                meta={`${x.github?.bound ? `${x.github.bound} repo${x.github.bound > 1 ? "s" : ""}` : "no repo bound"} · ${x.vercel?.connected ? "Vercel connected" : "no Vercel"}`}
                onClick={() => { setId(x.id); setTab("overview"); }}
              />
            ))
          )
        }
        rail={
          c ? (
            <div className="flex flex-col gap-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Next move</div>
              <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {!c.github?.bound
                  ? "No repo is bound, so an agent cannot touch their code. Bind one on Our GitHub."
                  : !c.vercel?.connected
                    ? "No Vercel yet. They authorise us on their own account, from Connect Vercel."
                    : "Bound and connected. Open a job on the floor."}
              </p>
              <Link href={!c.github?.bound ? "/github" : !c.vercel?.connected ? "/connect" : "/work"} className="btn-os brand no-underline text-center">
                {!c.github?.bound ? "Bind a repo" : !c.vercel?.connected ? "Connect their Vercel" : "Open a job"}
              </Link>
            </div>
          ) : null
        }
      >
        {open && c ? (
          <>
            <div className="border-b px-4 pt-4 pb-2.5" style={{ borderColor: "var(--hairline)" }}>
              <h3 className="mt-1 mb-1 text-[24px] leading-tight">{c.name}</h3>
              <div className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>{c.id}</div>
            </div>
            <Tabs
              tabs={[["overview", "Overview"], ["work", "Work"]]}
              tab={tab}
              onTab={(t) => setTab(t as "overview" | "work")}
            />
            <div className="min-h-0 flex-1 overflow-auto">
              {tab === "work" ? (
                <CustomerWork customerId={c.id} customerName={c.name} />
              ) : (
                <div className="p-4">
                  <Kv
                    rows={[
                      ["Repos", c.github?.repos?.length ? <span key="r" className="font-mono">{c.github.repos.join(", ")}</span> : "none bound"],
                      ["Vercel", c.vercel?.connected ? `connected (${c.vercel.mode ?? "token"})${c.vercel.bound ? ` · ${c.vercel.bound} project` : ""}` : "not connected"],
                    ]}
                  />
                  <p className="mt-4 max-w-[62ch] text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    A repo belongs to exactly one customer and the database refuses a second claim on it. An agent for
                    this project can read what is bound here and nothing else.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : null}
      </Dossier>
    </div>
  );
}
