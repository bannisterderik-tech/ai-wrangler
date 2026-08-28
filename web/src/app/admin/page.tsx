"use client";

import { useCallback, useEffect, useState } from "react";

type Tenant = {
  id: string; name: string; canBuild: boolean; status: string; plan: string | null; note: string | null;
  createdAt: string; isHouse: boolean; staff: number; customers: number; leads: number;
};

/**
 * The owner's panel. Only the house sees it.
 *
 * An agency account here is a whole separate CRM: its own pipeline, its own
 * proposals, its own customers, none of it visible to any other account. The
 * one thing sold separately is the building half — agents, repositories,
 * deploys — which is off unless somebody turns it on.
 */
export default function AdminPage() {
  const [rows, setRows] = useState<Tenant[] | null>(null);
  const [denied, setDenied] = useState(false);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [draft, setDraft] = useState({ name: "", adminName: "", adminEmail: "", plan: "crm", canBuild: false });

  const load = useCallback(async () => {
    const res = await fetch("/api/tenants", { cache: "no-store" });
    if (res.status === 403 || res.status === 401) return setDenied(true);
    if (res.ok) setRows((await res.json()).tenants ?? []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNote("");
    const res = await fetch("/api/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out.error || "could not open that account");
    setNote(`${draft.name} is open. ${draft.adminEmail} can sign in at /login and gets their own CRM.`);
    setDraft({ name: "", adminName: "", adminEmail: "", plan: "crm", canBuild: false });
    setAdding(false);
    await load();
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    const res = await fetch("/api/tenants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out.error || "that did not work");
    await load();
  }

  if (denied) {
    return (
      <div className="max-w-[62ch] p-5 text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        This panel belongs to the owner of the platform. Your account is not it.
      </div>
    );
  }
  if (!rows) return <div className="p-5 text-[13px]" style={{ color: "var(--text-secondary)" }}>Reading the accounts…</div>;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-5">
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn-os brand" onClick={() => setAdding((v) => !v)}>
          {adding ? "Cancel" : "+ New agency account"}
        </button>
        <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
          {rows.length} account{rows.length === 1 ? "" : "s"} ·{" "}
          {rows.filter((r) => r.canBuild).length} with the build side
        </span>
      </div>
      {note ? <p className="text-[12.5px]" style={{ color: "var(--state-go)" }}>{note}</p> : null}
      {error ? <p className="text-[12.5px]" style={{ color: "var(--state-stop)" }}>{error}</p> : null}

      {adding ? (
        <form onSubmit={create} className="flex flex-col gap-3 rounded-[14px] p-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}>
          <p className="max-w-[68ch] text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            They get the whole CRM — their own leads, proposals, dialer, inbox and customers — and see nothing
            of anyone else&apos;s, enforced by the database rather than by the screen.
          </p>
          <div className="flex flex-wrap gap-3">
            <Field label="Agency name">
              <input autoFocus className="btn-os min-w-[200px]" value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Redwood Digital" />
            </Field>
            <Field label="Who runs it">
              <input className="btn-os min-w-[170px]" value={draft.adminName}
                onChange={(e) => setDraft({ ...draft, adminName: e.target.value })} placeholder="Sam Reed" />
            </Field>
            <Field label="Their email">
              <input className="btn-os min-w-[210px]" value={draft.adminEmail}
                onChange={(e) => setDraft({ ...draft, adminEmail: e.target.value })} placeholder="sam@redwood.co" />
            </Field>
            <Field label="Plan">
              <input className="btn-os w-[110px]" value={draft.plan}
                onChange={(e) => setDraft({ ...draft, plan: e.target.value })} />
            </Field>
          </div>
          <label className="flex items-start gap-2.5 text-[13px] leading-relaxed">
            <input type="checkbox" className="mt-1" checked={draft.canBuild}
              onChange={(e) => setDraft({ ...draft, canBuild: e.target.checked })} />
            <span>
              Include the build side — AI agents, repositories and deploys.{" "}
              <span style={{ color: "var(--text-secondary)" }}>
                Off by default. A CRM account never sees the floor at all, and that is usually what was sold.
              </span>
            </span>
          </label>
          <div>
            <button className="btn-os brand" type="submit" disabled={busy || !draft.name.trim() || !draft.adminEmail.trim()}>
              Open the account
            </button>
          </div>
        </form>
      ) : null}

      <div className="flex flex-col gap-2">
        {rows.map((t) => (
          <div key={t.id} className="rounded-[14px] p-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[15px] font-semibold">{t.name}</span>
                {t.isHouse ? (
                  <span className="ml-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--brand-text)" }}>
                    the house
                  </span>
                ) : null}
                <div className="font-mono text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
                  {t.id} · {t.plan ?? "no plan"}
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: t.status === "active" ? "var(--state-go)" : "var(--state-stop)" }}>
                {t.status}
              </span>
            </div>
            <div className="mt-2 text-[12.5px]" style={{ color: "var(--text-secondary)" }}>
              {t.staff} staff · {t.customers} customers · {t.leads} leads ·{" "}
              {t.canBuild ? "CRM and build" : "CRM only"}
            </div>
            {t.isHouse ? null : (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <button className="btn-os" disabled={busy} onClick={() => patch(t.id, { canBuild: !t.canBuild })}>
                  {t.canBuild ? "Remove the build side" : "Add the build side"}
                </button>
                <button className={`btn-os ${t.status === "active" ? "stop" : ""}`} disabled={busy}
                  onClick={() => patch(t.id, { status: t.status === "active" ? "suspended" : "active" })}>
                  {t.status === "active" ? "Suspend" : "Reactivate"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
