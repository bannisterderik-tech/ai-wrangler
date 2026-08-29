"use client";

import { useCallback, useEffect, useState } from "react";

type Row = {
  customerId: string; enabled: boolean; mode: string; businessName: string | null;
  greeting: string | null; brief: string | null; hoursJson: string | null;
  forwardTo: string | null; urgentWords: string | null; maxTurns: number; monthlyCapCents: number;
};
type Call = {
  id: string; customerId: string | null; from: string | null; outcome: string; turns: number;
  callerName: string | null; jobSummary: string | null; callback: string | null;
  urgent: boolean; leadId: string | null; cost: number; at: string;
};
type Payload = {
  ready: boolean;
  modes: string[];
  receptionists: Row[];
  numbers: { customerId: string; customerName: string; number: string }[];
  calls: Call[];
};

const MODE_SAYS: Record<string, string> = {
  on_no_answer: "Rings your people first. Picks up whatever they miss.",
  after_hours: "Your people in the day. It takes nights and weekends.",
  always: "It answers every call before anyone else does.",
};
const DEFAULT_HOURS = { tz: "America/Los_Angeles", open: 8, close: 17, days: [1, 2, 3, 4, 5] };
const money = (n: number) => "$" + n.toFixed(2);

/**
 * Who answers the phone.
 *
 * A contractor missing five to ten calls a week loses more than anything else
 * in this product can win back, and about five in six people who reach
 * voicemail never ring back. This is the screen that turns that off.
 */
export function Receptionist() {
  const [data, setData] = useState<Payload | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [form, setForm] = useState({
    enabled: false, mode: "on_no_answer", businessName: "", greeting: "", brief: "",
    forwardTo: "", urgentWords: "", maxTurns: 8, monthlyCap: 20,
    hours: DEFAULT_HOURS,
  });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/receptionist", { cache: "no-store" });
    if (!res.ok) return;
    const d: Payload = await res.json();
    setData(d);
    if (!customerId && d.numbers.length) setCustomerId(d.numbers[0].customerId);
  }, [customerId]);
  useEffect(() => {
    load();
  }, [load]);

  // Load whichever customer is selected into the form.
  useEffect(() => {
    if (!data || !customerId) return;
    const r = data.receptionists.find((x) => x.customerId === customerId);
    const who = data.numbers.find((n) => n.customerId === customerId);
    let hours = DEFAULT_HOURS;
    try {
      if (r?.hoursJson) hours = { ...DEFAULT_HOURS, ...JSON.parse(r.hoursJson) };
    } catch {
      /* keep the default */
    }
    setForm({
      enabled: r?.enabled ?? false,
      mode: r?.mode ?? "on_no_answer",
      businessName: r?.businessName ?? who?.customerName ?? "",
      greeting: r?.greeting ?? "",
      brief: r?.brief ?? "",
      forwardTo: r?.forwardTo ?? "",
      urgentWords: r?.urgentWords ?? "",
      maxTurns: r?.maxTurns ?? 8,
      monthlyCap: (r?.monthlyCapCents ?? 2000) / 100,
      hours,
    });
  }, [data, customerId]);

  async function save() {
    setBusy(true);
    setError("");
    setNote("");
    const res = await fetch("/api/receptionist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, ...form }),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out.error || "could not save that");
    setNote(form.enabled ? "It is answering." : "Switched off. Calls ring your people as before.");
    await load();
  }

  if (!data) return null;
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm({ ...form, [k]: v });
  const calls = data.calls.filter((c) => c.customerId === customerId);

  return (
    <div className="rounded-[14px] p-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}>
      <div className="text-[10px] uppercase tracking-[0.6px]" style={{ color: "var(--text-secondary)" }}>
        Who answers the phone
      </div>
      <p className="mt-1.5 mb-3 max-w-[74ch] text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        It takes a name, what they need, and a number to ring back — then puts it on the board as a lead. It
        never quotes a price or promises a time, and anything urgent goes straight to a person without waiting
        to be told. It always says it is an automated assistant; that part is not adjustable.
        {data.ready ? "" : " No model is configured, so every call would be handed to a person."}
      </p>

      {data.numbers.length === 0 ? (
        <p className="text-[12.5px]" style={{ color: "var(--state-blocked)" }}>
          Nobody has a number yet. Buy one above first — there is no phone for it to answer.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-2">
            <Field label="For">
              <select className="btn-os min-w-[170px]" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                {data.numbers.map((n) => (
                  <option key={n.customerId} value={n.customerId}>{n.customerName} — {n.number}</option>
                ))}
              </select>
            </Field>
            <label className="flex items-center gap-2 pb-1.5 text-[13px]">
              <input type="checkbox" checked={form.enabled} onChange={(e) => set("enabled", e.target.checked)} />
              Answer their calls
            </label>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {data.modes.map((m) => (
              <button key={m} className={`btn-os ${form.mode === m ? "brand" : ""}`} onClick={() => set("mode", m)}
                title={MODE_SAYS[m]}>
                {m.replace(/_/g, " ")}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[12px]" style={{ color: "var(--text-secondary)" }}>{MODE_SAYS[form.mode]}</p>

          <div className="mt-3 flex flex-wrap items-end gap-2.5">
            <Field label="Business name"><input className="btn-os w-[180px]" value={form.businessName} onChange={(e) => set("businessName", e.target.value)} /></Field>
            <Field label="Transfer urgent calls to"><input className="btn-os w-[150px]" value={form.forwardTo} placeholder="+1530…" onChange={(e) => set("forwardTo", e.target.value)} /></Field>
            <Field label="Max turns"><input type="number" min="2" max="20" className="btn-os w-[80px] tabular-nums" value={form.maxTurns} onChange={(e) => set("maxTurns", Number(e.target.value))} /></Field>
            <Field label="Cap $/mo"><input type="number" min="0" className="btn-os w-[90px] tabular-nums" value={form.monthlyCap} onChange={(e) => set("monthlyCap", Number(e.target.value))} /></Field>
          </div>

          {form.mode === "after_hours" ? (
            <div className="mt-2.5 flex flex-wrap items-end gap-2.5">
              <Field label="Timezone"><input className="btn-os w-[190px]" value={form.hours.tz} onChange={(e) => set("hours", { ...form.hours, tz: e.target.value })} /></Field>
              <Field label="Open"><input type="number" min="0" max="23" className="btn-os w-[70px] tabular-nums" value={form.hours.open} onChange={(e) => set("hours", { ...form.hours, open: Number(e.target.value) })} /></Field>
              <Field label="Close"><input type="number" min="0" max="24" className="btn-os w-[70px] tabular-nums" value={form.hours.close} onChange={(e) => set("hours", { ...form.hours, close: Number(e.target.value) })} /></Field>
              <div className="flex gap-1">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                  <button key={d} className={`btn-os ${form.hours.days.includes(i) ? "brand" : ""}`}
                    onClick={() => set("hours", {
                      ...form.hours,
                      days: form.hours.days.includes(i) ? form.hours.days.filter((x) => x !== i) : [...form.hours.days, i],
                    })}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-2.5 flex flex-col gap-2">
            <Field label="Greeting — the disclosure is added after it" wide>
              <input className="btn-os w-full" value={form.greeting} placeholder="Thanks for calling Rec Plumbing."
                onChange={(e) => set("greeting", e.target.value)} />
            </Field>
            <Field label="What they do — trades, area, anything it should know" wide>
              <textarea className="btn-os h-[64px] w-full text-[12.5px]" value={form.brief}
                placeholder="Plumbing and drains across Sacramento. No gas fitting."
                onChange={(e) => set("brief", e.target.value)} />
            </Field>
            <Field label="Straight to a person if they say — comma separated" wide>
              <input className="btn-os w-full" value={form.urgentWords} placeholder="no hot water, sewage, backed up"
                onChange={(e) => set("urgentWords", e.target.value)} />
            </Field>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button className="btn-os brand" disabled={busy || !customerId} onClick={save}>Save</button>
            {note ? <span className="text-[12.5px]" style={{ color: "var(--state-go)" }}>{note}</span> : null}
            {error ? <span className="text-[12.5px]" style={{ color: "var(--state-stop)" }}>{error}</span> : null}
          </div>

          {calls.length ? (
            <div className="mt-4">
              <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[1.4px]" style={{ color: "var(--text-secondary)" }}>
                Calls it took
              </div>
              <div className="flex flex-col gap-1.5">
                {calls.map((c) => (
                  <div key={c.id} className="flex flex-wrap items-baseline gap-2 border-b pb-1.5 text-[12px]" style={{ borderColor: "var(--hairline)" }}>
                    {c.urgent ? <span className="font-bold" style={{ color: "var(--state-stop)" }}>URGENT</span> : null}
                    <span className="font-semibold">{c.callerName ?? c.from ?? "Unknown"}</span>
                    <span className="min-w-[160px] flex-1" style={{ color: "var(--text-secondary)" }}>
                      {c.jobSummary ?? "—"}
                    </span>
                    <span style={{ color: "var(--text-secondary)" }}>{c.outcome}</span>
                    <span className="tabular-nums" style={{ color: "var(--text-secondary)" }}>{money(c.cost)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`flex flex-col gap-1 ${wide ? "w-full" : ""}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
