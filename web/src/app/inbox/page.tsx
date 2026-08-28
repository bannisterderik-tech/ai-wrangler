"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DeskBar } from "@/components/os/Dossier";

type Msg = { direction: string; channel: string; body: string; actor: string; at: string };
type Thread = {
  id: string; who: string; subject: string | null; channel: string;
  phone: string | null; email: string | null; customer: string | null; lead: string | null;
  unread: boolean; lastAt: string; messages: Msg[];
};

/** Every conversation, whoever it is with. */
export default function InboxPage() {
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [channels, setChannels] = useState<string[]>([]);
  const [leads, setLeads] = useState<{ id: string; company: string; phone: string | null }[]>([]);
  const [id, setId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [body, setBody] = useState("");
  const [starting, setStarting] = useState(false);
  const [draft, setDraft] = useState({ who: "", phone: "", email: "", channel: "sms", leadId: "", body: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/threads", { cache: "no-store" });
    if (!res.ok) return;
    const out = await res.json();
    setThreads(out.threads ?? []);
    setChannels(out.channels ?? []);
    setLeads(out.leads ?? []);
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const shown = useMemo(
    () => (threads ?? []).filter((t) => filter === "all" || (filter === "unread" ? t.unread : t.channel === filter)),
    [threads, filter],
  );
  const cur = shown.find((t) => t.id === id) ?? shown[0] ?? null;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!cur || !body.trim()) return;
    setBusy(true);
    await fetch("/api/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId: cur.id, body, channel: cur.channel }),
    });
    setBody("");
    setBusy(false);
    await load();
  }

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/threads", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft),
    });
    const out = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(out.error || "could not start it");
    setStarting(false);
    setDraft({ who: "", phone: "", email: "", channel: "sms", leadId: "", body: "" });
    await load();
    setId(out.threadId);
  }

  if (!threads) return <div className="p-5 text-[13px]" style={{ color: "var(--text-secondary)" }}>Reading the inbox…</div>;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DeskBar>
        {["all", "unread", ...channels].map((f) => (
          <button key={f} className={`btn-os ${filter === f ? "brand" : ""}`} onClick={() => { setFilter(f); setId(null); }}>
            {f}{" "}
            <span className="tabular-nums opacity-70">
              {f === "all" ? threads.length : f === "unread" ? threads.filter((t) => t.unread).length : threads.filter((t) => t.channel === f).length}
            </span>
          </button>
        ))}
        <button className="btn-os brand" onClick={() => setStarting((v) => !v)}>{starting ? "Cancel" : "+ New conversation"}</button>
      </DeskBar>

      {starting ? (
        <form onSubmit={start} className="flex flex-wrap items-end gap-2 border-b px-4 py-3" style={{ borderColor: "var(--hairline)", background: "var(--surface-raised)" }}>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>With</span>
            <input autoFocus value={draft.who} onChange={(e) => setDraft({ ...draft, who: e.target.value })} className="btn-os min-w-[160px]" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>About a lead</span>
            <select className="btn-os" value={draft.leadId} onChange={(e) => {
              const l = leads.find((x) => x.id === e.target.value);
              setDraft({ ...draft, leadId: e.target.value, who: draft.who || (l?.company ?? ""), phone: draft.phone || (l?.phone ?? "") });
            }}>
              <option value="">Not about one</option>
              {leads.map((l) => <option key={l.id} value={l.id}>{l.company}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Channel</span>
            <select className="btn-os" value={draft.channel} onChange={(e) => setDraft({ ...draft, channel: e.target.value })}>
              {channels.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>First message</span>
            <input value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} className="btn-os min-w-[200px]" />
          </label>
          <button className="btn-os brand" type="submit" disabled={busy || !draft.who.trim() || !draft.body.trim()}>Start</button>
          {error ? <span className="text-[12px]" style={{ color: "var(--state-stop)" }}>{error}</span> : null}
        </form>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(260px,340px)_1fr]">
        <div className="min-h-0 overflow-auto border-r" style={{ borderColor: "var(--hairline)" }}>
          {shown.length === 0 ? (
            <div className="p-5 text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {threads.length === 0
                ? "No conversations yet. Every text, email and note with a lead or a customer lands here."
                : "Nothing in that filter."}
            </div>
          ) : (
            shown.map((t) => (
              <button
                key={t.id}
                onClick={() => setId(t.id)}
                className="block w-full border-b px-4 py-3 text-left"
                style={{ borderColor: "var(--hairline)", background: t.id === cur?.id ? "var(--brand-dim, rgba(255,77,24,0.12))" : "transparent" }}
              >
                <div className="text-[14px] font-semibold">{t.unread ? "● " : ""}{t.who}</div>
                <div className="mt-1 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                  {[t.channel, t.customer ?? t.lead].filter(Boolean).join(" · ")}
                </div>
                <div className="mt-1 truncate text-[12px]" style={{ color: "var(--text-secondary)" }}>
                  {t.messages[t.messages.length - 1]?.body ?? "no messages"}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="flex min-h-0 flex-col">
          {!cur ? (
            <div className="p-5 text-[13px]" style={{ color: "var(--text-secondary)" }}>Pick a conversation.</div>
          ) : (
            <>
              <div className="border-b px-4 py-3" style={{ borderColor: "var(--hairline)" }}>
                <b className="text-[15px]">{cur.who}</b>
                <div className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                  {[cur.phone, cur.email, cur.customer ?? cur.lead].filter(Boolean).join(" · ") || cur.channel}
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-auto p-4">
                {cur.messages.map((m, i) => (
                  <div
                    key={i}
                    className="mb-2 max-w-[70%] rounded-xl px-3 py-2 text-[13px]"
                    style={{
                      background: m.direction === "out" ? "var(--brand-dim, rgba(255,77,24,0.14))" : "var(--surface-inset)",
                      marginLeft: m.direction === "out" ? "auto" : 0,
                    }}
                  >
                    <span className="mr-2 text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                      {m.channel} · {m.actor}
                    </span>
                    {m.body}
                  </div>
                ))}
              </div>
              <form onSubmit={send} className="flex gap-2 border-t p-3" style={{ borderColor: "var(--hairline)" }}>
                <input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={cur.channel === "email" ? "Reply by email…" : cur.channel === "note" ? "Add a note…" : "Reply…"}
                  className="btn-os flex-1"
                />
                <button className="btn-os brand" type="submit" disabled={busy || !body.trim()}>Send</button>
              </form>
              <p className="px-3 pb-3 text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
                Recorded here, not delivered — outbound SMS still runs on one shared Twilio number, and sending a
                customer&apos;s message from another customer&apos;s line is the one thing this OS will not do.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
