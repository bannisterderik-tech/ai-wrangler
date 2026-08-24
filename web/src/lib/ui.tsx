export function Card({
  kicker,
  children,
  className = "",
}: {
  kicker?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[14px] p-4 ${className}`}
      style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}
    >
      {kicker ? (
        <div
          className="mb-2 text-[10px] uppercase tracking-[0.6px]"
          style={{ color: "var(--text-secondary)" }}
        >
          {kicker}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function statusDot(status: string) {
  if (status === "thinking") return "var(--state-thinking)";
  if (status === "working") return "var(--state-running)";
  if (status === "blocked") return "var(--state-blocked)";
  if (status === "done" || status === "done-cycle") return "var(--state-running)";
  return "var(--text-secondary)";
}

export function statusLabel(status: string) {
  return (
    {
      queued: "Waiting to start",
      thinking: "Thinking",
      working: "Doing work",
      blocked: "Needs your OK",
      done: "Finished",
      "done-cycle": "Resting until next round",
    }[status] || status
  );
}

export function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}
