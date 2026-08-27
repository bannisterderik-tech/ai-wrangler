import { db } from "@/lib/db";
import { customers, jobs } from "@/lib/schema";

/** Live control plane: never prerender a customer’s numbers at build time. */
export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const [names, allJobs] = await Promise.all([
    db.select().from(customers),
    db.select().from(jobs),
  ]);
  const retainers: Record<string, [number, number]> = {
    brightline: [4500, 1800],
    "harbor-and-co": [3200, 1400],
    "atlas-labs": [6800, 2600],
  };
  const rows = names.map((n) => {
    const rt = retainers[n.id] || [1500, 600];
    const ai = allJobs.filter((j) => j.customerId === n.id).reduce((a, j) => a + j.spentCents, 0) / 100;
    const margin = Math.round((1 - (rt[1] + ai) / rt[0]) * 100);
    return { name: n.name, retainer: rt[0], ai, human: rt[1], margin };
  });
  const ret = rows.reduce((a, r) => a + r.retainer, 0);
  const cost = rows.reduce((a, r) => a + r.human + r.ai, 0);

  return (
    <div className="flex flex-col gap-3 overflow-y-auto px-[18px] py-4">
      <div className="flex flex-wrap gap-3">
        <Stat k="Monthly retainers" v={`$${ret.toLocaleString()}/mo`} />
        <Stat k="Cost to deliver (AI + humans)" v={`$${Math.round(cost).toLocaleString()}/mo`} />
        <Stat k="Margin" v={`${Math.round((1 - cost / ret) * 100)}%`} brand />
      </div>
      <div className="text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
        The pitch in one row: cents of AI doing hundreds of dollars of agency work.
      </div>
      {rows.map((br) => (
        <div key={br.name} className="flex items-center gap-3.5 rounded-[10px] px-3.5 py-3" style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}>
          <span className="w-[110px] shrink-0 text-[12.5px] font-semibold">{br.name}</span>
          <span className="w-[90px] shrink-0 text-[11.5px] tabular-nums" style={{ color: "var(--text-secondary)" }}>
            ${br.retainer.toLocaleString()}/mo
          </span>
          <span className="w-[140px] shrink-0 text-[11.5px] tabular-nums" style={{ color: "var(--text-secondary)" }}>
            AI: ${br.ai.toFixed(2)} · ppl: ${br.human.toLocaleString()}
          </span>
          <div className="min-w-[80px] flex-1">
            <div className="h-1.5 overflow-hidden rounded-sm" style={{ background: "var(--surface-inset)" }}>
              <div className="h-full rounded-sm" style={{ width: `${Math.max(4, br.margin)}%`, background: "var(--state-running)" }} />
            </div>
          </div>
          <span className="w-[70px] shrink-0 text-right text-xs font-semibold tabular-nums" style={{ color: "var(--state-running)" }}>
            {br.margin}%
          </span>
        </div>
      ))}
    </div>
  );
}

function Stat({ k, v, brand }: { k: string; v: string; brand?: boolean }) {
  return (
    <div className="rounded-xl px-[18px] py-3.5" style={{ background: "var(--surface-raised)", border: `1px solid ${brand ? "var(--brand)" : "var(--hairline)"}` }}>
      <div className="text-[10.5px]" style={{ color: "var(--text-secondary)" }}>{k}</div>
      <div className="mt-0.5 text-[22px] font-semibold tabular-nums" style={{ color: brand ? "var(--brand-text)" : undefined }}>
        {v}
      </div>
    </div>
  );
}
