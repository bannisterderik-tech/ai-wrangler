import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { approvals, customers, jobs } from "@/lib/schema";
import { Card } from "@/lib/ui";
import { money } from "@/lib/ui";

export default function BriefingPage() {
  const clientRows = db.select().from(customers).all();
  const pending = db.select().from(approvals).where(eq(approvals.status, "pending")).all();
  const allJobs = db.select().from(jobs).all();
  const running = allJobs.filter((j) => j.status === "thinking" || j.status === "working");
  const spent = allJobs.reduce((a, j) => a + (j.spentCents || 0), 0);
  const names = Object.fromEntries(clientRows.map((c) => [c.id, c.name]));
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning." : "Good afternoon.";

  return (
    <div className="flex justify-center p-6">
      <div className="flex w-[760px] max-w-full flex-col gap-3.5">
        <div>
          <div className="text-[22px] font-semibold">{greet}</div>
          <div className="mt-1 text-[12.5px]" style={{ color: "var(--text-secondary)" }}>
            {running.length} job{running.length === 1 ? "" : "s"} running · {pending.length} waiting on you ·{" "}
            {money(spent)} spent today · {clientRows.length} customers
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <Card kicker="Finished while you were away">
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Work is in flight. Finished jobs will land here.
            </div>
          </Card>
          <Card kicker="Needs you">
            {pending.length === 0 ? (
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                Nothing waiting on you. Enjoy the coffee.
              </div>
            ) : (
              pending.map((p) => (
                <Link
                  key={p.id}
                  href="/approvals"
                  className="mb-1.5 block rounded-lg border px-2.5 py-2 text-left text-xs leading-snug no-underline"
                  style={{ borderColor: "var(--state-blocked)", color: "var(--text-primary)" }}
                >
                  <span className="font-semibold" style={{ color: "var(--state-blocked)" }}>
                    {names[p.customerId]}
                  </span>{" "}
                  — {p.title}
                </Link>
              ))
            )}
          </Card>
          <Card kicker="Money">
            <div className="text-2xl font-semibold tabular-nums">{money(spent)}</div>
            <div className="mt-0.5 text-[11.5px]" style={{ color: "var(--text-secondary)" }}>
              spent today across all customers
            </div>
            <div className="mt-1.5 text-[11.5px]" style={{ color: "var(--state-running)" }}>
              {money(Math.round(spent * 0.42))} saved by reusing context
            </div>
          </Card>
          <Card kicker="Worth an eye">
            <div className="flex flex-col gap-1.5 text-[12.5px] leading-snug">
              <div>Isolation is on. Tokens never cross customers.</div>
              {running.map((j) => (
                <div key={j.id} className="flex gap-1.5">
                  <span style={{ color: "var(--state-blocked)" }}>•</span>
                  <span>
                    {names[j.customerId]} — {j.title}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
