export default function TeamPage() {
  return (
    <div className="overflow-y-auto px-[18px] py-4">
      <div className="mb-3.5 max-w-[560px] text-[11.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        Every teammate connects their own Claude Code over MCP. Whoever is in charge of a customer, it’s <em>their</em> Claude Code that plans and instructs the sub-agents for that customer.
      </div>
      <div className="w-[290px] rounded-xl p-3.5" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold" style={{ background: "var(--surface-inset)", border: "1px solid var(--hairline)", color: "var(--brand-text)" }}>
            YO
          </div>
          <div>
            <div className="text-[13px] font-semibold">You</div>
            <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Owner</div>
          </div>
        </div>
        <div className="font-mono mt-2.5 flex items-center gap-1.5 text-[10.5px]" style={{ color: "var(--state-running)" }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--state-running)" }} />
          claude-code connected · this laptop
        </div>
        <div className="mt-3 text-[10px] uppercase tracking-[0.6px]" style={{ color: "var(--text-secondary)" }}>In charge of</div>
        <div className="mt-1.5 text-[11.5px]">All customers until you invite a teammate.</div>
      </div>
    </div>
  );
}
