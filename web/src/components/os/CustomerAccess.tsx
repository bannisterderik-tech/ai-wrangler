"use client";

import { useCallback, useEffect, useState } from "react";

type Person = { id: string; name: string; email?: string | null; kind: string; customerId: string | null; status: string };

/**
 * Who at this customer can sign in, and how they get there.
 *
 * The client desk and the copilot both existed before this did, which meant a
 * customer-facing product no customer could reach: the only way to create a
 * client was raw SQL. This is the missing half.
 *
 * They sign in by magic link and by nothing else — no password to set, forget,
 * reuse or leak.
 */
export function CustomerAccess({ customerId, customerName }: { customerId: string; customerName: string }) {
  const [people, setPeople] = useState<Person[] | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/people", { cache: "no-store" });
    if (!res.ok) return;
    const d = await res.json();
    setPeople((d.people ?? []).filter((p: Person) => p.kind === "client" && p.customerId === customerId));
  }, [customerId]);
  useEffect(() => {
    load();
  }, [load]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNote("");
    const res = await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, kind: "client", customerId }),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out.error || "could not add them");
    setName("");
    setEmail("");
    setNote(`${email} can now sign in. Send them the link below.`);
    await load();
  }

  async function remove(id: string, who: string) {
    if (!confirm(`Remove ${who}? They lose access on their very next request — not when their session expires.`)) return;
    setBusy(true);
    await fetch(`/api/people/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
    setBusy(false);
    await load();
  }

  const origin = typeof window === "undefined" ? "" : window.location.origin;

  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="max-w-[64ch] text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        Who at {customerName} can sign in. They get their own leads and their copilot, and nothing of ours —
        no floor, no other customers, enforced by the database and not by the screen.
      </p>

      <form onSubmit={invite} className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Their name</span>
          <input className="btn-os min-w-[160px]" value={name} onChange={(e) => setName(e.target.value)} placeholder="Casey Boyd" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Their email</span>
          <input className="btn-os min-w-[210px]" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="casey@theirbusiness.com" />
        </label>
        <button className="btn-os brand" type="submit" disabled={busy || !name.trim() || !email.trim()}>
          Give them access
        </button>
      </form>
      {error ? <p className="text-[12.5px]" style={{ color: "var(--state-stop)" }}>{error}</p> : null}
      {note ? <p className="text-[12.5px]" style={{ color: "var(--state-go)" }}>{note}</p> : null}

      {people === null ? null : people.length === 0 ? (
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Nobody from {customerName} can sign in yet, so their desk and their copilot are unreachable to them.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {people.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2" style={{ borderColor: "var(--hairline)" }}>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold">{p.name}</div>
                <div className="truncate font-mono text-[11.5px]" style={{ color: "var(--text-secondary)" }}>{p.email}</div>
              </div>
              <button className="btn-os" disabled={busy} onClick={() => remove(p.id, p.name)}>Remove</button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg p-3" style={{ background: "var(--surface-raised)" }}>
        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
          Where to send them
        </div>
        <p className="mt-1 text-[12.5px] leading-relaxed">
          <span className="font-mono">{origin}/login</span> — they enter the address above and get a sign-in
          link by email. It lands them on their leads; their copilot is one click from there.
        </p>
        <p className="mt-1.5 text-[11.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          The link is single use and expires in fifteen minutes, and no password exists to be reused or leaked.
          Sending it needs a working Resend key — check Settings if nothing arrives.
        </p>
      </div>
    </div>
  );
}
