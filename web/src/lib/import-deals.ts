/**
 * A CRM export, turned into rows this OS understands.
 *
 * The mapping lives here rather than in a script so the OS itself can do the
 * import — pasting a file into a screen beats holding a production connection
 * string and a shell.
 *
 * Idempotent on the source system's own Record ID, so re-importing a fresh
 * export brings in the new rows and touches nothing else.
 */
import { stageFrom } from "./stages";

export type Row = {
  srcId: string; name: string; stage: string; product: string; owner: string;
  once: number; monthly: number; total: number; email: string | null;
};
export type Plan = {
  customers: Row[]; leads: Row[]; partners: Row[]; proposals: Row[];
  skipped: { name: string; why: string }[];
  total: number;
};

/** Handles quoted fields and embedded commas, which every CRM export has. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false;
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
 * Their stage names to ours — now one-to-one.
 *
 * This used to collapse four offer stages into a single `proposal`, which threw
 * away the only thing anybody reads a stage for. The pipeline carries all
 * twelve now, so the mapping lives in one place and this just calls it.
 */
export const stageOf = (raw: string) => stageFrom(raw);

const money = (v: string) => {
  const n = Number(String(v ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};

export function slugName(s: string) {
  return (
    String(s).toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim()
      .replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 60) || "customer"
  );
}

/**
 * Read the file and say what would happen. Nothing is written here — the
 * preview and the import run the same function, so what you approve is what
 * you get.
 */
export function planImport(csv: string, peopleCsv?: string): Plan | { error: string } {
  const rows = parseCsv(csv);
  if (rows.length < 2) return { error: "That file has no rows in it." };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (...names: string[]) => {
    for (const n of names) {
      const i = header.indexOf(n.toLowerCase());
      if (i > -1) return i;
    }
    return -1;
  };
  const iId = col("record id", "id");
  const iName = col("record", "name", "company", "deal name");
  const iStage = col("deal stage", "stage", "status");
  if (iId < 0 || iName < 0 || iStage < 0) {
    return {
      error:
        "That does not look like a deals export. It needs a Record ID column, a name column and a stage column. " +
        `Found: ${rows[0].filter(Boolean).join(", ").slice(0, 200)}`,
    };
  }
  const iValue = col("deal value", "value", "amount");
  const iMrr = col("deal mrr value", "mrr", "monthly");
  const iOnce = col("deal one-time value", "one-time", "one time");
  const iProduct = col("product", "products");
  const iOwner = col("deal owner", "owner");

  // Emails from a contacts export, matched to a deal by domain. Most will not
  // match — this enriches, it does not import.
  const emails = new Map<string, string>();
  if (peopleCsv) {
    for (const r of parseCsv(peopleCsv).slice(1)) {
      const v = (r[1] || "").trim();
      if (!v.includes("@")) continue;
      const domain = v.split("@")[1]?.split(".")[0]?.toLowerCase();
      if (domain && domain.length >= 4 && !emails.has(domain)) emails.set(domain, v);
    }
  }
  const emailFor = (name: string) => {
    const n = name.toLowerCase();
    for (const [domain, addr] of emails) if (n.includes(domain)) return addr;
    return null;
  };

  const plan: Plan = { customers: [], leads: [], partners: [], proposals: [], skipped: [], total: rows.length - 1 };

  for (const r of rows.slice(1)) {
    const srcId = (r[iId] || "").trim();
    const name = (r[iName] || "").trim();
    if (!srcId || !name) { plan.skipped.push({ name: name || "(blank)", why: "no id or no name" }); continue; }
    const monthly = iMrr > -1 ? money(r[iMrr]) : 0;
    const total = iValue > -1 ? money(r[iValue]) : 0;
    let once = iOnce > -1 ? money(r[iOnce]) : 0;
    // A row with only a total: treat it as one-time rather than inventing a
    // split the export never stated.
    if (!once && !monthly && total) once = total;

    const row: Row = {
      srcId, name,
      stage: stageOf(r[iStage]),
      product: iProduct > -1 ? (r[iProduct] || "").trim() : "",
      owner: iOwner > -1 ? (r[iOwner] || "").trim() : "",
      once, monthly, total,
      email: emailFor(name),
    };
    if (row.stage === "partners") plan.partners.push(row);
    else if (row.stage === "won") plan.customers.push(row);
    else {
      plan.leads.push(row);
      if (once || monthly) plan.proposals.push(row);
    }
  }
  return plan;
}
