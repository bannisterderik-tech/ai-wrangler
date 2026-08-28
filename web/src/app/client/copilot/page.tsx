"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Msg = { id: string; who: string; body: string; lookedAt: string | null; at: string };
type Payload = {
  copilot: { name: string; brief: string | null } | null;
  ready: boolean;
  why: string | null;
  messages: Msg[];
};

/**
 * The customer's side. No agency chrome, no nav, no floor — a page belonging to
 * a business owner, not to us.
 *
 * The copilot answers from what it can see and holds no ability to send, spend
 * or change anything. That is stated on the page rather than buried, because a
 * person is about to ask it to do things and should know before they ask, not
 * after.
 */
export default function CopilotPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [said, setSaid] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/client/copilot", { cache: "no-store" });
    if (res.ok) setData(await res.json());
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    // Assigned rather than smooth-scrolled: smooth is a silent no-op in some
    // engines, and rAF does not run in a backgrounded tab.
    if (endRef.current) endRef.current.scrollIntoView({ block: "end" });
  }, [data?.messages.length, busy]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = said.trim();
    if (!body || busy) return;
    setBusy(true);
    setError("");
    setSaid("");
    // Show it immediately; the reply takes a moment and an empty box in the
    // meantime reads as though nothing happened.
    setData((d) =>
      d ? { ...d, messages: [...d.messages, { id: `local-${Date.now()}`, who: "them", body, lookedAt: null, at: new Date().toISOString() }] } : d,
    );
    const res = await fetch("/api/client/copilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) setError(out.error || "That did not go through. Try again?");
    await load();
  }

  return (
    <div className="flex h-[100dvh] w-full flex-col" style={{ background: "var(--surface)", color: "var(--text)" }}>
      <header
        className="flex shrink-0 flex-wrap items-center gap-3 border-b px-5 py-3.5"
        style={{ borderColor: "var(--hairline)" }}
      >
        <div className="brand-mark" role="img" aria-label="AI Wrangler" />
        <div className="min-w-0">
          <div className="text-[13.5px] font-semibold">{data?.copilot?.name ?? "Your copilot"}</div>
          <div className="truncate text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
            {data?.copilot?.brief ?? "Ask it anything about your business."}
          </div>
        </div>
        <Link href="/client" className="btn-os ml-auto no-underline">Your leads</Link>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="mx-auto flex w-full max-w-[680px] flex-col gap-4">
          {data && !data.ready ? (
            <div className="rounded-xl p-4 text-[13.5px] leading-relaxed" style={{ background: "var(--surface-raised)" }}>
              {data.why ?? "Your copilot is not ready yet."} We will let you know the moment it is.
            </div>
          ) : null}

          {data && data.messages.length === 0 && data.ready ? (
            <div className="rounded-xl p-4" style={{ background: "var(--surface-raised)" }}>
              <p className="text-[14px] leading-relaxed">
                Ask me anything about what is going on. I can see your enquiries, what has happened with them,
                anything you have asked us for, and any errors on your site.
              </p>
              <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                I read and I answer. I cannot send anything, spend anything or change anything — when something
                needs doing, I pass it to your team and a person picks it up.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["Who is waiting on me?", "What came in this week?", "Is anything broken on my site?"].map((q) => (
                  <button key={q} className="btn-os" onClick={() => setSaid(q)}>{q}</button>
                ))}
              </div>
            </div>
          ) : null}

          {data?.messages.map((m) => {
            const mine = m.who === "them";
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[86%] rounded-2xl px-4 py-2.5"
                  style={{
                    background: mine ? "var(--brand)" : "var(--surface-raised)",
                    color: mine ? "var(--brand-on, #150800)" : "var(--text)",
                  }}
                >
                  <p className="whitespace-pre-wrap text-[14.5px] leading-relaxed">{m.body}</p>
                  {m.lookedAt ? (
                    <p className="mt-1.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                      Read: {m.lookedAt}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}

          {busy ? (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-2.5" style={{ background: "var(--surface-raised)" }}>
                <span className="text-[14px]" style={{ color: "var(--text-secondary)" }}>Reading…</span>
              </div>
            </div>
          ) : null}
          <div ref={endRef} />
        </div>
      </div>

      <form onSubmit={send} className="shrink-0 border-t px-5 py-3.5" style={{ borderColor: "var(--hairline)" }}>
        <div className="mx-auto flex w-full max-w-[680px] flex-col gap-2">
          {error ? <p className="text-[12.5px]" style={{ color: "var(--state-stop)" }}>{error}</p> : null}
          <div className="flex gap-2">
            <input
              className="btn-os flex-1"
              value={said}
              onChange={(e) => setSaid(e.target.value)}
              placeholder={data?.ready ? "Ask about your business…" : "Not ready yet"}
              disabled={!data?.ready || busy}
            />
            <button className="btn-os brand" type="submit" disabled={!data?.ready || busy || !said.trim()}>
              Send
            </button>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            It answers from what it can see. It cannot send, spend or change anything — anything that needs
            doing goes to your team.
          </p>
        </div>
      </form>
    </div>
  );
}
