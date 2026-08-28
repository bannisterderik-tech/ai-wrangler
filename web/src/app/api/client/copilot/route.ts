import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clientSession, fail } from "@/lib/api";
import { people } from "@/lib/schema";
import { aiConfigured } from "@/lib/ai";
import { replyTo, saveMessage, thread } from "@/lib/copilot";

/** Is there a copilot for this customer, and does it have a brain to think with? */
async function theirCopilot(customerId: string) {
  // Filtered in the query, not after it. Selecting any one person for this
  // customer and then asking whether it happened to be a copilot returns
  // nothing whenever a client user or a build agent sorts first.
  const [row] = await db
    .select()
    .from(people)
    .where(
      and(
        eq(people.customerId, customerId),
        eq(people.kind, "agent"),
        eq(people.agentKind, "copilot"),
      ),
    )
    .orderBy(asc(people.id))
    .limit(1);
  return row ?? null;
}

export async function GET() {
  const who = await clientSession();
  if (!who) return NextResponse.json({ error: "not yours" }, { status: 403 });
  try {
    const copilot = await theirCopilot(who.customerId);
    const messages = await thread(who.customerId);
    return NextResponse.json({
      copilot: copilot ? { name: copilot.name, brief: copilot.brief } : null,
      // Said plainly rather than discovered by sending a message into silence.
      ready: Boolean(copilot) && aiConfigured(),
      why: !copilot
        ? "No copilot has been set up for you yet."
        : !aiConfigured()
          ? "Your copilot is set up but has no model key yet, so it cannot answer."
          : null,
      messages: messages.map((m) => ({ id: m.id, who: m.who, body: m.body, lookedAt: m.lookedAt, at: m.at })),
    });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  const who = await clientSession();
  if (!who) return NextResponse.json({ error: "not yours" }, { status: 403 });
  try {
    const copilot = await theirCopilot(who.customerId);
    if (!copilot) return NextResponse.json({ error: "No copilot has been set up for you yet." }, { status: 409 });
    if (!aiConfigured()) {
      return NextResponse.json(
        { error: "Your copilot has no model key yet, so it cannot answer. We are on it." },
        { status: 503 },
      );
    }
    const body = await req.json().catch(() => ({}));
    const said = String(body.body || "").trim().slice(0, 4000);
    if (!said) return NextResponse.json({ error: "say something first" }, { status: 400 });

    await saveMessage(who.customerId, "them", said);
    // Their question is answered from their own rows, read inside their own
    // transaction. The copilot has no tools, so there is nothing for it to do
    // beyond answer — which is the whole safety model, not a limitation of it.
    const reply = await replyTo(who.customerId, said);
    await saveMessage(who.customerId, "copilot", reply.body, reply);
    return NextResponse.json({ ok: true, reply: { body: reply.body, lookedAt: reply.lookedAt } });
  } catch (e) {
    return fail(e);
  }
}
