"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type KeyField = { id: string; label: string; hint: string };

/**
 * The agency's own keys. One place, stored in the same encrypted vault as every
 * customer credential — so setting one never means opening a hosting dashboard.
 */
function AgencyKeys() {
  const [keys, setKeys] = useState<Record<string, boolean>>({});
  const [fields, setFields] = useState<KeyField[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await fetch("/api/keys", { cache: "no-store" });
    if (!res.ok) return;
    const out = await res.json();
    setKeys(out.keys ?? {});
    setFields(out.fields ?? []);
  };
  useEffect(() => {
    load();
  }, []);

  async function save(id: string) {
    setBusy(true);
    setNote("");
    const res = await fetch("/api/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: id, value: draft[id] ?? "" }),
    });
    const out = await res.json().catch(() => ({}));
    setNote(res.ok ? `${id} key saved.` : out.error || "could not save");
    setDraft((d) => ({ ...d, [id]: "" }));
    setBusy(false);
    await load();
  }

  return (
    <div className="rounded-[14px] p-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}>
      <div className="text-[10px] uppercase tracking-[0.6px]" style={{ color: "var(--text-secondary)" }}>
        Agency keys
      </div>
      <p className="mt-1 mb-3 max-w-[62ch] text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        Ours, not a customer&apos;s. Stored encrypted in the same vault as every customer token, and never
        returned by the API — paste one here rather than setting it on a hosting service.
      </p>
      {fields.map((f) => (
        <div key={f.id} className="flex flex-wrap items-center gap-2 border-b py-2.5" style={{ borderColor: "var(--hairline)" }}>
          <div className="min-w-[110px]">
            <div className="text-[13px]">{f.label}</div>
            <div className="text-[11px]" style={{ color: keys[f.id] ? "var(--state-go)" : "var(--text-secondary)" }}>
              {keys[f.id] ? "saved" : "not set"}
            </div>
          </div>
          <input
            type="password"
            value={draft[f.id] ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, [f.id]: e.target.value }))}
            placeholder={keys[f.id] ? "replace it…" : f.hint}
            className="btn-os min-w-[230px] flex-1"
          />
          <button className="btn-os brand" disabled={busy || !(draft[f.id] ?? "").trim()} onClick={() => save(f.id)}>
            {keys[f.id] ? "Replace" : "Save"}
          </button>
        </div>
      ))}
      {note ? <p className="mt-2 text-[12.5px]" style={{ color: "var(--text-secondary)" }}>{note}</p> : null}
    </div>
  );
}

export default function SettingsPage() {
  const [customers, setCustomers] = useState<{ id: string; name: string; vercel?: { connected: boolean; bound?: number; mode?: string }; github?: { bound: number } }[]>([]);
  const [gh, setGh] = useState<{ connected?: boolean; login?: string; org?: string | null }>({});

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers || []));
    fetch("/api/github/status")
      .then((r) => r.json())
      .then(setGh);
  }, []);

  const connected = customers.filter((c) => c.vercel?.connected).length;
  const ghBound = customers.reduce((a, c) => a + (c.github?.bound || 0), 0);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-y-auto p-5">
      <div className="text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
        Each connection issues the AI its own limited token — never your password. Isolation is per customer.
      </div>
      <AgencyKeys />
      <Row
        name="Vercel"
        desc="Hosting — previews and production deploys."
        detail={
          connected
            ? `isolated tokens · ${connected} customer${connected === 1 ? "" : "s"} · projects bound, never shared`
            : "Not connected — each customer signs into their own Vercel"
        }
        on={connected > 0}
        href="/connect"
      />
      <Row
        name="GitHub"
        desc="Our org. Code lives here. Clients don’t install anything."
        detail={
          gh.connected
            ? `${gh.org || gh.login} · ${ghBound} repo(s) bound across customers`
            : "Add GITHUB_TOKEN in web/.env.local — our org, not the client’s."
        }
        on={!!gh.connected}
        href="/github"
      />
      <Row
        name="Twilio"
        desc="Power dialer, inbound DID, SMS, A2P 10DLC. One number per customer."
        detail="Set TWILIO_ACCOUNT_SID / AUTH_TOKEN / CALLER_ID — demo mode until then."
        on={false}
      />
      <Row
        name="Zernio"
        desc="Ads across Google, Meta, TikTok, LinkedIn, Pinterest, X, OpenAI. One profile per customer."
        detail="Set ZERNIO_API_KEY — the ads desk runs demo campaigns until then."
        on={false}
      />
      <Row name="Supabase" desc="Databases, with row-level walls between customers." detail="Not connected yet." on={false} />
    </div>
  );
}

function Row({
  name,
  desc,
  detail,
  on,
  href,
}: {
  name: string;
  desc: string;
  detail: string;
  on: boolean;
  href?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[10px] px-3.5 py-3" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold">{name}</span>
          {on ? (
            <span className="rounded-[5px] border px-1.5 py-0.5 text-[9.5px] font-semibold" style={{ borderColor: "var(--state-running)", color: "var(--state-running)" }}>
              Connected
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>{desc}</div>
        <div className="font-mono mt-1 text-[10.5px]" style={{ color: "var(--text-secondary)" }}>{detail}</div>
      </div>
      {href ? (
        <Link href={href} className="shrink-0 rounded-[7px] px-3 py-1.5 text-[11.5px] font-semibold text-white no-underline" style={{ background: "var(--brand)" }}>
          {on ? "Manage" : "Connect"}
        </Link>
      ) : (
        <span className="shrink-0 text-[11px]" style={{ color: "var(--text-secondary)" }}>
          Soon
        </span>
      )}
    </div>
  );
}
