#!/usr/bin/env node
/**
 * Bring a CRM export into the OS.
 *
 * Dry run by default. Nothing is written until you pass --write, and running it
 * twice writes nothing the second time — every record is keyed on the source
 * system's own Record ID, so a re-export with new rows imports only the new rows.
 *
 * What goes where, and why:
 *
 *   Won            -> a customer. Money changed hands; that is the same rule the
 *                     deposit webhook uses to convert a lead.
 *   Partners       -> the partners table. They are not leads and putting them in
 *                     the pipeline would inflate it with people who are not buying.
 *   Everything else-> a lead, at the matching stage.
 *   Deal money     -> a DRAFT proposal on that lead, with the one-time and monthly
 *                     split the export already carries. Draft, never sent: sending
 *                     is a decision, and a link nobody meant to create is worse
 *                     than no link.
 *
 * What it deliberately does NOT do: create jobs. A job has a spend cap and an
 * agent can claim it. Importing twenty-five of them would put real money on the
 * floor because a spreadsheet had twenty-five rows in it.
 *
 *   node scripts/import-deals.mjs scripts/import/deals.csv
 *   node scripts/import-deals.mjs scripts/import/deals.csv --write
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";

const file = process.argv[2];
const WRITE = process.argv.includes("--write");
if (!file) {
  console.error("usage: node scripts/import-deals.mjs <deals.csv> [--write] [--people people.csv]");
  process.exit(1);
}
const peopleArg = process.argv.indexOf("--people");
const peopleFile = peopleArg > -1 ? process.argv[peopleArg + 1] : null;

const DB = process.env.DATABASE_URL;
if (!DB) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

/** A CSV reader that handles quoted fields and embedded commas. */
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim()));
}

/**
 * Their stages to ours. Anything unrecognised becomes a plain lead rather than
 * being dropped: losing a row silently is worse than filing it imprecisely.
 */
const STAGE = {
  "lead": "new",
  "prospects": "prospect",
  "book discovery meeting": "talking",
  "booked discovery meeting": "talking",
  "create offer": "proposal",
  "offer ready": "proposal",
  "offer sent": "proposal",
  "offer negotiation": "proposal",
  "won": "won",
  "lost": "lost",
};
const stageOf = (raw) => {
  const k = String(raw || "").toLowerCase().replace(/[^a-z ]/g, "").trim();
  return STAGE[k] ?? (k.includes("won") ? "won" : k.includes("partner") ? "partner" : "new");
};

const money = (v) => {
  const n = Number(String(v ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};
const slug = (s) =>
  String(s).toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 60) || "customer";

const sql = postgres(DB, { max: 3, prepare: false, onnotice: () => {} });

async function main() {
  const rows = parseCsv(readFileSync(file, "utf8"));
  const header = rows[0].map((h) => h.trim());
  const col = (name) => header.findIndex((h) => h.toLowerCase() === name.toLowerCase());
  const iId = col("Record ID"), iName = col("record"), iStage = col("Deal stage");
  const iValue = col("Deal value"), iMrr = col("Deal MRR Value"), iOnce = col("Deal One-Time Value");
  const iProduct = col("Product"), iOwner = col("Deal owner");
  if (iId < 0 || iName < 0 || iStage < 0) {
    console.error("That file does not look like a deals export — expected Record ID, record and Deal stage.");
    process.exit(1);
  }

  // Emails from the contacts export, matched to a deal by domain. Most deals
  // will not match, which is why this enriches rather than imports.
  const emails = new Map();
  if (peopleFile) {
    for (const r of parseCsv(readFileSync(peopleFile, "utf8")).slice(1)) {
      const v = (r[1] || "").trim();
      if (!v.includes("@")) continue;
      const domain = v.split("@")[1]?.split(".")[0]?.toLowerCase();
      if (domain && domain.length >= 4 && !emails.has(domain)) emails.set(domain, v);
    }
  }
  const emailFor = (name) => {
    const n = String(name).toLowerCase();
    for (const [domain, addr] of emails) if (n.includes(domain)) return addr;
    return null;
  };

  const plan = { customers: [], leads: [], partners: [], proposals: [], skipped: [] };

  for (const r of rows.slice(1)) {
    const srcId = (r[iId] || "").trim();
    const name = (r[iName] || "").trim();
    if (!srcId || !name) { plan.skipped.push({ name, why: "no id or no name" }); continue; }
    const stage = stageOf(r[iStage]);
    const product = (r[iProduct] || "").trim();
    const owner = (r[iOwner] || "").trim();
    const monthly = money(r[iMrr]);
    let once = money(r[iOnce]);
    const total = money(r[iValue]);
    // Some rows carry only a total. Treat it as one-time rather than inventing a
    // split the export did not state.
    if (!once && !monthly && total) once = total;

    const rec = { srcId, name, stage, product, owner, once, monthly, total, email: emailFor(name) };
    if (stage === "partner") plan.partners.push(rec);
    else if (stage === "won") plan.customers.push(rec);
    else {
      plan.leads.push(rec);
      if (once || monthly) plan.proposals.push(rec);
    }
  }

  console.log(`\nRead ${rows.length - 1} deals from ${file}\n`);
  const show = (label, list, fmt) => {
    console.log(`${label}: ${list.length}`);
    for (const x of list.slice(0, 5)) console.log(`   ${fmt(x)}`);
    if (list.length > 5) console.log(`   … and ${list.length - 5} more`);
    console.log();
  };
  const cash = (c) => `$${(c / 100).toLocaleString()}`;
  show("Customers (won deals)", plan.customers, (x) => `${x.name} — ${x.product || "no product recorded"} · ${cash(x.total)}`);
  show("Leads", plan.leads, (x) => `${x.name} — ${x.stage}${x.total ? ` · ${cash(x.total)}` : ""}${x.email ? ` · ${x.email}` : ""}`);
  show("Draft proposals", plan.proposals, (x) => `${x.name} — ${cash(x.once)} once${x.monthly ? ` + ${cash(x.monthly)}/mo` : ""}`);
  show("Partners", plan.partners, (x) => `${x.name}`);
  if (plan.skipped.length) show("Skipped", plan.skipped, (x) => `${x.name || "(blank)"} — ${x.why}`);

  if (!WRITE) {
    console.log("Dry run. Nothing was written. Pass --write to import.\n");
    await sql.end();
    return;
  }

  let made = { customers: 0, leads: 0, partners: 0, proposals: 0, already: 0 };

  for (const x of plan.partners) {
    const id = `P_${x.srcId.slice(0, 8)}`;
    const [seen] = await sql`SELECT id FROM partners WHERE id = ${id}`;
    if (seen) { made.already++; continue; }
    await sql`
      INSERT INTO partners (id, name, operator_name, tier, status, note)
      VALUES (${id}, ${x.name}, ${x.owner || null}, 'operator', 'applied', ${"Imported from the deals export."})
      ON CONFLICT DO NOTHING`;
    made.partners++;
  }

  for (const x of plan.customers) {
    const id = slug(x.name);
    const [seen] = await sql`SELECT id FROM customers WHERE id = ${id}`;
    if (!seen) { await sql`INSERT INTO customers (id, name) VALUES (${id}, ${x.name}) ON CONFLICT DO NOTHING`; made.customers++; }
    else made.already++;
    // What we sold them, where read_project will show it to an agent. This is
    // the closest thing to "their project" that does not put money on the floor.
    if (x.product) {
      const memId = `M_${x.srcId.slice(0, 8)}`;
      await sql`
        INSERT INTO memories (id, customer_id, text, kind, source)
        VALUES (${memId}, ${id},
                ${`We sold them: ${x.product}${x.total ? ` (${cash(x.total)}${x.monthly ? `, ${cash(x.monthly)}/mo` : ""})` : ""}.`},
                'note', 'deals import')
        ON CONFLICT (id) DO NOTHING`;
    }
  }

  for (const x of plan.leads) {
    const id = `L_${x.srcId.slice(0, 8)}`;
    const [seen] = await sql`SELECT id FROM agency_leads WHERE id = ${id}`;
    if (seen) { made.already++; continue; }
    await sql`
      INSERT INTO agency_leads (id, company, contact, email, stage, value_cents, trade, source, note)
      VALUES (${id}, ${x.name}, ${x.owner || null}, ${x.email}, ${x.stage}, ${x.monthly || x.once},
              ${x.product || null}, 'deals import', ${x.product ? `Interested in: ${x.product}` : null})`;
    made.leads++;

    if (x.once || x.monthly) {
      const qId = `Q_${x.srcId.slice(0, 8)}`;
      const [q] = await sql`SELECT id FROM proposals WHERE id = ${qId}`;
      if (!q) {
        await sql`
          INSERT INTO proposals (id, lead_id, title, status, once_cents, monthly_cents, created_by)
          VALUES (${qId}, ${id}, ${`${x.product || "Proposal"} for ${x.name}`}, 'draft', ${x.once}, ${x.monthly}, 'deals import')`;
        let sort = 0;
        if (x.once)
          await sql`
            INSERT INTO proposal_items (id, proposal_id, name, cadence, qty, unit_cents, sort)
            VALUES (${`I_${x.srcId.slice(0, 6)}o`}, ${qId}, ${x.product || "One-time work"}, 'once', 1, ${x.once}, ${sort++})`;
        if (x.monthly)
          await sql`
            INSERT INTO proposal_items (id, proposal_id, name, cadence, qty, unit_cents, sort)
            VALUES (${`I_${x.srcId.slice(0, 6)}m`}, ${qId}, ${x.product || "Retainer"}, 'monthly', 1, ${x.monthly}, ${sort++})`;
        made.proposals++;
      }
    }
  }

  console.log(
    `Wrote: ${made.customers} customers, ${made.leads} leads, ${made.proposals} draft proposals, ` +
      `${made.partners} partners. ${made.already} already existed and were left alone.\n`,
  );
  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  await sql.end();
  process.exit(1);
});
