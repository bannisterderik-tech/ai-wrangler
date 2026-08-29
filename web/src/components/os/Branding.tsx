"use client";

import { useCallback, useEffect, useState } from "react";

type Brand = {
  name: string; logoUrl: string | null; accent: string;
  domain: string | null; fromEmail: string | null; support: string | null; custom: boolean;
};

/**
 * What your clients see.
 *
 * Multi-tenancy without this is a database feature, not a product you can
 * resell — it is the name on the proposal they sign and the logo above the
 * portal they log into.
 */
export function Branding() {
  const [brand, setBrand] = useState<Brand | null>(null);
  const [form, setForm] = useState({ name: "", logoUrl: "", accent: "", domain: "", fromEmail: "", support: "" });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [denied, setDenied] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/brand", { cache: "no-store" });
    if (res.status === 403) return setDenied(true);
    if (!res.ok) return;
    const d = await res.json();
    setBrand(d.brand);
    setForm({
      name: d.brand.custom ? d.brand.name : "",
      logoUrl: d.brand.logoUrl ?? "",
      accent: d.brand.accent ?? "",
      domain: d.brand.domain ?? "",
      fromEmail: d.brand.fromEmail ?? "",
      support: d.brand.support ?? "",
    });
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setBusy(true);
    setError("");
    setNote("");
    const res = await fetch("/api/brand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out.error || "could not save that");
    setBrand(out.brand);
    setNote("Saved. Your clients see this from now on.");
  }

  if (denied || !brand) return null;
  const set = (k: keyof typeof form, v: string) => setForm({ ...form, [k]: v });

  return (
    <div className="rounded-[14px] p-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}>
      <div className="text-[10px] uppercase tracking-[0.6px]" style={{ color: "var(--text-secondary)" }}>
        Your branding
      </div>
      <p className="mt-1.5 mb-3 max-w-[74ch] text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        The name on the proposals your clients sign, and the logo above the portal they log into.
        {brand.custom ? "" : " Nothing set yet, so they see ours."}
      </p>

      <div className="flex flex-wrap items-end gap-2.5">
        <Field label="Name"><input className="btn-os w-[190px]" value={form.name} placeholder="Redwood Digital" onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Accent — hex">
          <div className="flex items-center gap-1.5">
            <input className="btn-os w-[110px] font-mono text-[12px]" value={form.accent} placeholder="#c4491a" onChange={(e) => set("accent", e.target.value)} />
            <span className="inline-block h-[22px] w-[22px] rounded" style={{
              background: /^#[0-9a-fA-F]{6}$/.test(form.accent) ? form.accent : "var(--hairline)",
              border: "1px solid var(--hairline)",
            }} />
          </div>
        </Field>
        <Field label="Support email"><input className="btn-os w-[190px]" value={form.support} placeholder="help@redwood.co" onChange={(e) => set("support", e.target.value)} /></Field>
      </div>
      <div className="mt-2.5 flex flex-col gap-2">
        <Field label="Logo — https only" wide>
          <input className="btn-os w-full" value={form.logoUrl} placeholder="https://redwood.co/logo.svg" onChange={(e) => set("logoUrl", e.target.value)} />
        </Field>
        <Field label="Their domain — where clients sign in" wide>
          <input className="btn-os w-full" value={form.domain} placeholder="app.redwood.co" onChange={(e) => set("domain", e.target.value)} />
        </Field>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button className="btn-os brand" disabled={busy} onClick={save}>Save</button>
        {form.logoUrl && !/^https:\/\//.test(form.logoUrl) ? (
          <span className="text-[12px]" style={{ color: "var(--state-blocked)" }}>
            It has to be https — that logo is rendered into a page your client loads.
          </span>
        ) : null}
        {note ? <span className="text-[12.5px]" style={{ color: "var(--state-go)" }}>{note}</span> : null}
        {error ? <span className="text-[12.5px]" style={{ color: "var(--state-stop)" }}>{error}</span> : null}
      </div>
      <p className="mt-2 max-w-[74ch] text-[11.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        Pointing a domain here records it; the DNS and certificate for it are still a manual step on the host.
      </p>
    </div>
  );
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`flex flex-col gap-1 ${wide ? "w-full" : ""}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>{label}</span>
      {children}
    </label>
  );
}
