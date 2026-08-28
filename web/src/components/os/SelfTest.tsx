"use client";

import { useCallback, useEffect, useState } from "react";

type Check = { id: string; label: string; state: "ok" | "off" | "fail"; detail: string; costs: string };

const TONE = { ok: "var(--state-go)", off: "var(--text-secondary)", fail: "var(--state-stop)" };
const WORD = { ok: "works", off: "not set up", fail: "broken" };

/**
 * Ask every vendor, rather than infer from an environment variable.
 *
 * "The key is set" and "the key works" are different claims, and the gap
 * between them is where a deploy quietly does nothing — a wrong Stripe mode, a
 * Resend domain that was never verified, a GitHub App key that does not sign.
 * Every line here is a real request to the real service, showing the service's
 * own answer.
 */
export function SelfTest() {
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [ran, setRan] = useState(false);

  const run = useCallback(async () => {
    setBusy(true);
    const res = await fetch("/api/selftest", { cache: "no-store" });
    if (res.ok) setChecks((await res.json()).checks ?? []);
    setBusy(false);
    setRan(true);
  }, []);
  useEffect(() => {
    run();
  }, [run]);

  const broken = (checks ?? []).filter((c) => c.state === "fail");

  return (
    <div className="rounded-[14px] p-4" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-[10px] uppercase tracking-[0.6px]" style={{ color: "var(--text-secondary)" }}>
          What actually works
        </div>
        <button className="btn-os ml-auto" disabled={busy} onClick={run}>
          {busy ? "Asking…" : "Re-check"}
        </button>
      </div>
      <p className="mt-1 mb-3 max-w-[64ch] text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        Each line is a real request to that service, showing its own answer. Nothing here is inferred from a
        key being present — a key that is set and a key that works are different things, and the difference is
        where a deploy quietly does nothing.
      </p>

      {broken.length ? (
        <div
          className="mb-3 rounded-lg p-2.5 text-[12.5px] leading-relaxed"
          style={{ background: "color-mix(in srgb, var(--state-stop) 14%, transparent)" }}
        >
          <strong>{broken.length} configured and not working.</strong> That is worse than not set up: the OS
          will try and fail rather than telling you it cannot.
        </div>
      ) : null}

      {!checks ? (
        <p className="text-[12.5px]" style={{ color: "var(--text-secondary)" }}>Asking each service…</p>
      ) : (
        <div className="flex flex-col gap-2">
          {checks.map((c) => (
            <div key={c.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-b pb-2" style={{ borderColor: "var(--hairline)" }}>
              <span className="w-[110px] shrink-0 text-[13px] font-semibold">{c.label}</span>
              <span className="w-[74px] shrink-0 text-[10px] font-bold uppercase tracking-wider" style={{ color: TONE[c.state] }}>
                {WORD[c.state]}
              </span>
              <span className="min-w-[200px] flex-1 text-[12.5px] leading-relaxed">{c.detail}</span>
              {c.state !== "ok" ? (
                <span className="w-full text-[11.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Without it: {c.costs.replace(/[.]$/, "")}.
                </span>
              ) : null}
            </div>
          ))}
        </div>
      )}
      {ran ? (
        <p className="mt-3 text-[11.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          These checks are free and change nothing — they read an account, list models, fetch a balance.
          None of them sends a message, places a call, charges a card or writes to a repository. The one thing
          no screen can prove is a worker pass: deploy it once with RUN_ONCE=1 and read the log.
        </p>
      ) : null}
    </div>
  );
}
