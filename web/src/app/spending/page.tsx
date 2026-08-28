import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, jobs } from "@/lib/schema";
import { BRAINS, brainFromTier, modelName } from "@/lib/brains";
import { money } from "@/lib/ui";

/** Live control plane: never prerender a customer's numbers at build time. */
export const dynamic = "force-dynamic";

/**
 * Where the money went.
 *
 * This page previously claimed `money(total * 0.42)` "saved by reusing context
 * between steps" — a number nobody measured, describing a thing that did not
 * exist, printed on a screen about money. It is gone. Everything here is a sum
 * of rows, and where a number cannot be known it says so rather than estimating.
 *
 * The grouping by tier was also always zero: it matched on "Small brain" while
 * the column stores ids like "haiku".
 */
export default async function SpendingPage() {
  const [clientRows, allJobs] = await Promise.all([
    db.select().from(customers),
    db.select().from(jobs).orderBy(desc(jobs.spentCents)),
  ]);

  const total = allJobs.reduce((a, j) => a + j.spentCents, 0);
  const capped = allJobs.filter((j) => j.budgetCents > 0 && j.spentCents >= j.budgetCents);
  const live = allJobs.filter((j) => !["done", "rolled_back"].includes(j.status));
  const committed = live.reduce((a, j) => a + Math.max(0, j.budgetCents - j.spentCents), 0);

  const per = clientRows
    .map((c) => ({
      name: c.name,
      cents: allJobs.filter((j) => j.customerId === c.id).reduce((a, j) => a + j.spentCents, 0),
    }))
    .sort((a, b) => b.cents - a.cents);
  const max = Math.max(1, ...per.map((p) => p.cents));

  const byTier = BRAINS.map((b) => {
    const mine = allJobs.filter((j) => brainFromTier(j.tier).id === b.id);
    return {
      id: b.id,
      name: modelName(b.model),
      label: b.label,
      cents: mine.reduce((a, j) => a + j.spentCents, 0),
      jobs: mine.length,
    };
  });

  const dearest = allJobs.filter((j) => j.spentCents > 0).slice(0, 6);
  const name = (id: string) => clientRows.find((c) => c.id === id)?.name ?? id;

  return (
    <div className="flex flex-wrap content-start gap-5 p-5">
      <Box>
        <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Spent on AI work, all time</div>
        <div className="mt-0.5 text-[32px] font-semibold tabular-nums">{money(total)}</div>
        <div className="mt-1.5 text-[11.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Only what a worker reported after a pass. Work done before spend reporting existed is not in this
          number and cannot be recovered — the passes that finished were recorded as free.
        </div>
      </Box>

      <Box>
        <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Still authorised</div>
        <div className="mt-0.5 text-[32px] font-semibold tabular-nums">{money(committed)}</div>
        <div className="mt-1.5 text-[11.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          What the caps on {live.length} unfinished job{live.length === 1 ? "" : "s"} would still allow.
          This is the most the agents can spend without you raising anything.
        </div>
        {capped.length ? (
          <div className="mt-2.5 text-[11.5px]" style={{ color: "var(--state-blocked)" }}>
            {capped.length} job{capped.length === 1 ? " is" : "s are"} held at their cap.{" "}
            <Link href="/work" className="underline">Raise or close them</Link>.
          </div>
        ) : null}
      </Box>

      <Box>
        <div className="mb-2.5 text-[10px] uppercase tracking-[0.6px]" style={{ color: "var(--text-secondary)" }}>By customer</div>
        {per.length === 0 ? (
          <p className="text-[11.5px]" style={{ color: "var(--text-secondary)" }}>Nobody on the books yet.</p>
        ) : (
          per.map((p) => (
            <div key={p.name} className="mb-2">
              <div className="mb-1 flex justify-between text-[11.5px]">
                <span>{p.name}</span>
                <span className="tabular-nums" style={{ color: "var(--text-secondary)" }}>{money(p.cents)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-sm" style={{ background: "var(--surface-inset)" }}>
                <div
                  className="h-full rounded-sm"
                  style={{ width: `${Math.max(2, Math.round((p.cents / max) * 100))}%`, background: "var(--brand)" }}
                />
              </div>
            </div>
          ))
        )}
      </Box>

      <Box>
        <div className="mb-2.5 text-[10px] uppercase tracking-[0.6px]" style={{ color: "var(--text-secondary)" }}>By model</div>
        {byTier.map((t) => (
          <div key={t.id} className="mb-1.5 flex items-baseline justify-between gap-2 text-[11.5px]">
            <span>
              {t.name}{" "}
              <span style={{ color: "var(--text-secondary)" }}>
                {t.label} · {t.jobs} job{t.jobs === 1 ? "" : "s"}
              </span>
            </span>
            <span className="tabular-nums">{money(t.cents)}</span>
          </div>
        ))}
        <div className="mt-3 text-[11.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {modelName(BRAINS[2].model)} costs about five times {modelName(BRAINS[0].model)} for the same tokens.
          The tier is chosen per job when you open it — a heading change on the big brain is the fastest way
          to lose a cap.
        </div>
      </Box>

      <Box wide>
        <div className="mb-2.5 text-[10px] uppercase tracking-[0.6px]" style={{ color: "var(--text-secondary)" }}>
          What actually cost money
        </div>
        {dearest.length === 0 ? (
          <p className="text-[11.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            No job has recorded any spend. If agents have been running, that means the worker is not reporting
            what its passes cost — which is the state that let $20 disappear against a counter reading zero.
            Check the worker log for &ldquo;SPEND NOT RECORDED&rdquo;.
          </p>
        ) : (
          dearest.map((j) => {
            const over = j.budgetCents > 0 && j.spentCents >= j.budgetCents;
            return (
              <div key={j.id} className="mb-2.5">
                <div className="flex items-baseline justify-between gap-3 text-[12px]">
                  <span className="truncate">
                    {j.title}{" "}
                    <span style={{ color: "var(--text-secondary)" }}>
                      · {name(j.customerId)} · {modelName(brainFromTier(j.tier).model)}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums" style={{ color: over ? "var(--state-stop)" : undefined }}>
                    {money(j.spentCents)} / {money(j.budgetCents)}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-sm" style={{ background: "var(--surface-inset)" }}>
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: `${Math.min(100, j.budgetCents ? Math.round((j.spentCents / j.budgetCents) * 100) : 0)}%`,
                      background: over ? "var(--state-stop)" : "var(--brand)",
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </Box>
    </div>
  );
}

function Box({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div
      className={`${wide ? "w-full max-w-[664px]" : "w-[320px]"} rounded-[14px] p-[18px]`}
      style={{ background: "var(--surface-raised)", border: "1px solid var(--hairline)" }}
    >
      {children}
    </div>
  );
}
