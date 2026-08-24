import { db } from "@/lib/db";
import { customers, jobs } from "@/lib/schema";
import { money } from "@/lib/ui";

export default function SpendingPage() {
  const clientRows = db.select().from(customers).all();
  const allJobs = db.select().from(jobs).all();
  const total = allJobs.reduce((a, j) => a + j.spentCents, 0);
  const per = clientRows.map((c) => ({
    name: c.name,
    cents: allJobs.filter((j) => j.customerId === c.id).reduce((a, j) => a + j.spentCents, 0),
  }));
  const max = Math.max(1, ...per.map((p) => p.cents));
  const byTier = ["Small brain", "Medium brain", "Big brain"].map((t) => ({
    name: t,
    amt: money(allJobs.filter((j) => j.tier === t).reduce((a, j) => a + j.spentCents, 0)),
  }));

  return (
    <div className="flex flex-wrap content-start gap-5 p-5">
      <Box>
        <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Spent today, all AI work</div>
        <div className="mt-0.5 text-[32px] font-semibold tabular-nums">{money(total)}</div>
        <div className="mt-0.5 text-[11.5px]" style={{ color: "var(--state-running)" }}>
          {money(Math.round(total * 0.42))} saved by reusing context between steps
        </div>
      </Box>
      <Box>
        <div className="mb-2.5 text-[10px] uppercase tracking-[0.6px]" style={{ color: "var(--text-secondary)" }}>By customer</div>
        {per.map((p) => (
          <div key={p.name} className="mb-2">
            <div className="mb-1 flex justify-between text-[11.5px]">
              <span>{p.name}</span>
              <span className="tabular-nums" style={{ color: "var(--text-secondary)" }}>{money(p.cents)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-sm" style={{ background: "var(--surface-inset)" }}>
              <div className="h-full rounded-sm" style={{ width: `${Math.max(2, Math.round((p.cents / max) * 100))}%`, background: "var(--brand)" }} />
            </div>
          </div>
        ))}
      </Box>
      <Box>
        <div className="mb-2.5 text-[10px] uppercase tracking-[0.6px]" style={{ color: "var(--text-secondary)" }}>By brain size</div>
        {byTier.map((t) => (
          <div key={t.name} className="mb-1.5 flex justify-between text-[11.5px]">
            <span style={{ color: "var(--text-secondary)" }}>{t.name}</span>
            <span className="tabular-nums">{t.amt}</span>
          </div>
        ))}
        <div className="mt-3 text-[11.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Big questions go to the big (pricier) brain; routine chores go to the cheap one. Routing is per-customer.
        </div>
      </Box>
    </div>
  );
}

function Box({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-[320px] rounded-[14px] p-[18px]" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}>
      {children}
    </div>
  );
}
