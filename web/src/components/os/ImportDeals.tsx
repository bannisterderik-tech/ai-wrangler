"use client";

import { useState } from "react";

type Preview = {
  total: number; customers: number; leads: number; proposals: number; partners: number;
  skipped: { name: string; why: string }[];
  samples: { customers: string[]; leads: string[]; partners: string[] };
};
type Wrote = { customers: number; leads: number; proposals: number; partners: number; already: number };

/**
 * Drop a CRM export in and watch what it would do before it does it.
 *
 * The preview and the import run the same planning function on the server, so
 * what you approve is exactly what gets written — a preview that is a separate
 * code path is a preview that can lie.
 */
export function ImportDeals({ onDone }: { onDone: () => void }) {
  const [deals, setDeals] = useState("");
  const [dealsName, setDealsName] = useState("");
  const [people, setPeople] = useState("");
  const [peopleName, setPeopleName] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [wrote, setWrote] = useState<Wrote | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function read(file: File | undefined, set: (s: string) => void, setName: (s: string) => void) {
    if (!file) return;
    setError("");
    setPreview(null);
    setWrote(null);
    set(await file.text());
    setName(file.name);
  }

  async function send(write: boolean) {
    setBusy(true);
    setError("");
    const res = await fetch("/api/import/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: deals, peopleCsv: people || undefined, write }),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out.error || "could not read that file");
    setPreview(out.preview);
    if (out.wrote) {
      setWrote(out.wrote);
      onDone();
    }
  }

  return (
    <div className="flex flex-col gap-3 border-b px-4 py-3" style={{ borderColor: "var(--hairline)", background: "var(--surface-raised)" }}>
      <p className="max-w-[70ch] text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        A deals export from your old CRM, as CSV. Won deals become customers, partners go to Partners, and
        everything else becomes a lead with a draft proposal for whatever it was worth. Nothing is sent, and no
        jobs are created — a spreadsheet row is not a decision to spend money.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
            Deals export (required)
          </span>
          <input
            type="file" accept=".csv,text/csv"
            className="btn-os max-w-[260px] text-[12px]"
            onChange={(e) => read(e.target.files?.[0], setDeals, setDealsName)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
            Contacts export (optional)
          </span>
          <input
            type="file" accept=".csv,text/csv"
            className="btn-os max-w-[260px] text-[12px]"
            onChange={(e) => read(e.target.files?.[0], setPeople, setPeopleName)}
          />
        </label>
        <button className="btn-os" disabled={busy || !deals} onClick={() => send(false)}>
          {busy ? "Reading…" : "Show me what it would do"}
        </button>
      </div>
      {peopleName ? (
        <p className="text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
          {peopleName} is used only to find an email address for a deal it matches. Contacts are not imported as
          leads — a contact log is not a pipeline.
        </p>
      ) : null}
      {dealsName && !preview ? (
        <p className="text-[11.5px]" style={{ color: "var(--text-secondary)" }}>{dealsName} ready.</p>
      ) : null}
      {error ? <p className="text-[12.5px]" style={{ color: "var(--state-stop)" }}>{error}</p> : null}

      {preview ? (
        <div className="rounded-lg p-3" style={{ background: "var(--surface)" }}>
          <div className="text-[13px] font-semibold">
            {preview.total} rows: {preview.customers} customers, {preview.leads} leads,{" "}
            {preview.proposals} draft proposals, {preview.partners} partners
          </div>
          <div className="mt-2 grid gap-3 md:grid-cols-3">
            {([["Customers", preview.samples.customers], ["Leads", preview.samples.leads], ["Partners", preview.samples.partners]] as const).map(
              ([label, list]) =>
                list.length ? (
                  <div key={label}>
                    <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                      {label}
                    </div>
                    {list.map((s) => (
                      <div key={s} className="truncate text-[12px]">{s}</div>
                    ))}
                  </div>
                ) : null,
            )}
          </div>
          {preview.skipped.length ? (
            <p className="mt-2 text-[12px]" style={{ color: "var(--state-blocked)" }}>
              {preview.skipped.length} row(s) skipped: {preview.skipped.slice(0, 3).map((s) => `${s.name} (${s.why})`).join(", ")}
            </p>
          ) : null}

          {wrote ? (
            <p className="mt-3 text-[13px]" style={{ color: "var(--state-go)" }}>
              Imported {wrote.customers} customers, {wrote.leads} leads, {wrote.proposals} proposals,{" "}
              {wrote.partners} partners.{" "}
              {wrote.already ? `${wrote.already} were already here and were left alone.` : ""}
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button className="btn-os brand" disabled={busy} onClick={() => send(true)}>
                {busy ? "Importing…" : "Import them"}
              </button>
              <span className="text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
                Safe to run twice — anything already here is left alone.
              </span>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
