"use client";

import { useCallback, useEffect, useState } from "react";

type Bound = { customerId: string; customerName: string; number: string; label: string; sid: string };
type Available = { phoneNumber: string; friendlyName: string; locality: string | null; region: string | null };
type Payload = {
  configured: boolean;
  from: string | null;
  bound: Bound[];
  available: Available[];
  problem: string;
  customers: { id: string; name: string; number: string | null }[];
  sharing: number;
};

/**
 * One number per customer.
 *
 * Until a customer has their own, their texts and calls go out from the shared
 * caller id — so a shop's customer ringing back reaches a number that answers
 * for five other shops. The count of who is still sharing is shown rather than
 * hidden, because it is the thing this screen exists to get to zero.
 */
export function PhoneNumbers() {
  const [data, setData] = useState<Payload | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [areaCode, setAreaCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async (search?: string) => {
    const q = search ? `?areaCode=${encodeURIComponent(search)}` : "";
    const res = await fetch(`/api/twilio/numbers${q}`, { cache: "no-store" });
    if (!res.ok) return;
    const d = await res.json();
    setData(d);
    if (d.problem) setError(d.problem);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function search() {
    setBusy(true);
    setError("");
    await load(areaCode.trim());
    setBusy(false);
  }

  async function buy(phoneNumber: string) {
    const who = data?.customers.find((c) => c.id === customerId);
    if (!who) return setError("Pick which customer this number is for.");
    if (!confirm(`Buy ${phoneNumber} for ${who.name}?\n\nThis is a real purchase and Twilio bills for it monthly.`)) return;
    setBusy(true);
    setError("");
    setNote("");
    const res = await fetch("/api/twilio/numbers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, phoneNumber }),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out.error || "could not buy that");
    setNote(`${who.name} answers on ${out.number} now. Inbound calls and texts reach them.`);
    await load();
  }

  async function release(b: Bound) {
    if (
      !confirm(
        `Release ${b.number} from ${b.customerName}?\n\n` +
          `Twilio gives it up for good — you cannot get the same number back, and anyone who ` +
          `already has it reaches nobody.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/twilio/numbers?customerId=${encodeURIComponent(b.customerId)}`, { method: "DELETE" });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out.error || "could not release it");
    await load();
  }

  if (!data) return null;

  return (
    <div className="rounded-[14px] p-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}>
      <div className="text-[10px] uppercase tracking-[0.6px]" style={{ color: "var(--text-secondary)" }}>
        Phone numbers
      </div>
      <p className="mt-1.5 mb-3 max-w-[74ch] text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        A number each. It is the identity their own customers see and ring back, so one number belongs to one
        customer — enforced by the database, the same wall as a repository.
        {data.configured ? "" : " Twilio is not configured, so nothing can be bought yet."}
      </p>

      {data.sharing > 0 ? (
        <p className="mb-3 text-[12.5px]" style={{ color: "var(--state-blocked)" }}>
          {data.sharing} customer{data.sharing === 1 ? "" : "s"} still share {data.from ?? "one caller id"}. Their
          calls and texts all come from the same number.
        </p>
      ) : null}

      {data.bound.length ? (
        <div className="mb-3 flex flex-col gap-1.5">
          {data.bound.map((b) => (
            <div key={b.customerId} className="flex flex-wrap items-baseline gap-2 border-b pb-1.5 text-[12.5px]" style={{ borderColor: "var(--hairline)" }}>
              <span className="font-semibold">{b.customerName}</span>
              <span className="font-mono text-[12px]">{b.number}</span>
              <button className="btn-os stop ml-auto" disabled={busy} onClick={() => release(b)}>Release</button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
            For
          </span>
          <select className="btn-os min-w-[170px]" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Pick a customer…</option>
            {data.customers.map((c) => (
              <option key={c.id} value={c.id} disabled={Boolean(c.number)}>
                {c.name}{c.number ? ` — has ${c.number}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
            Area code
          </span>
          <input className="btn-os w-[100px] tabular-nums" value={areaCode} placeholder="530"
            onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, "").slice(0, 3))} />
        </label>
        <button className="btn-os" disabled={busy || !data.configured} onClick={search}>
          {busy ? "Looking…" : "Find numbers"}
        </button>
        <span className="text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
          Local to where they work — a plumber answering on the wrong area code loses the call.
        </span>
      </div>

      {data.available.length ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {data.available.map((a) => (
            <button key={a.phoneNumber} className="btn-os" disabled={busy || !customerId} onClick={() => buy(a.phoneNumber)}>
              {a.friendlyName}{a.locality ? ` · ${a.locality}` : ""}
            </button>
          ))}
        </div>
      ) : null}

      {note ? <p className="mt-2 text-[12.5px]" style={{ color: "var(--state-go)" }}>{note}</p> : null}
      {error ? <p className="mt-2 text-[12.5px]" style={{ color: "var(--state-stop)" }}>{error}</p> : null}
    </div>
  );
}
