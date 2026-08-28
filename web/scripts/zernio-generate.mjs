#!/usr/bin/env node
/**
 * Generate the Zernio client from Zernio's own OpenAPI spec.
 *
 * Why this is generated and not written by hand: the hand-written version had
 * three calls in it, and every one of them was wrong. It sent a `platform`
 * field the endpoint does not have, nested the budget, and invented a name for
 * geo targeting. Nobody noticed for months because nothing ever called it.
 *
 * A generator cannot make that mistake. Every operation, path parameter, query
 * parameter and required-body flag below comes out of the spec, so the client
 * either matches Zernio or the diff shows you it stopped matching.
 *
 *   npm run zernio:pull   — fetch the spec and regenerate
 *   npm run zernio:gen    — regenerate from the spec already on disk
 *
 * Re-run it when Zernio ships something. Commit the diff: an endpoint appearing
 * or a required parameter changing is news, and it should be readable in review
 * rather than discovered by a 400 in production.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const here = dirname(fileURLToPath(import.meta.url));
const web = join(here, "..");
const yaml = createRequire(import.meta.url)("js-yaml");

const SPEC = join(web, "vendor", "zernio-openapi.yaml");
const OUT = join(web, "src", "lib", "zernio-generated.ts");

const spec = yaml.load(readFileSync(SPEC, "utf8"));
const paths = spec.paths ?? {};
const METHODS = ["get", "post", "put", "patch", "delete"];

/** A JSON Schema type, rendered as the nearest honest TypeScript. */
function tsType(s, depth = 0) {
  if (!s || depth > 4) return "unknown";
  if (s.$ref) return "unknown"; // Deliberate: see the note in the header comment below.
  if (s.enum) return s.enum.map((v) => (typeof v === "string" ? JSON.stringify(v) : String(v))).join(" | ");
  if (s.allOf || s.anyOf || s.oneOf) return "unknown";
  switch (s.type) {
    case "string": return "string";
    case "number":
    case "integer": return "number";
    case "boolean": return "boolean";
    case "array": return `${wrap(tsType(s.items, depth + 1))}[]`;
    case "object": {
      const props = s.properties ?? {};
      const keys = Object.keys(props);
      if (!keys.length) return "Record<string, unknown>";
      const req = new Set(s.required ?? []);
      return `{ ${keys.map((k) => `${safeKey(k)}${req.has(k) ? "" : "?"}: ${tsType(props[k], depth + 1)}`).join("; ")} }`;
    }
    default: return "unknown";
  }
}
const wrap = (t) => (/[|&]/.test(t) ? `(${t})` : t);
const safeKey = (k) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k));

const camel = (s) =>
  s.replace(/[^A-Za-z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : "")).replace(/^(.)/, (c) => c.toLowerCase());

const doc = (lines, indent = " ") =>
  [`${indent}/**`, ...lines.filter(Boolean).flatMap((l) => String(l).split("\n").map((x) => `${indent} * ${x}`.trimEnd())), `${indent} */`].join("\n");

const clip = (s, n = 300) => {
  const t = String(s ?? "").trim().replace(/\s+/g, " ");
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
};

const ops = [];
for (const [path, item] of Object.entries(paths)) {
  for (const method of METHODS) {
    const op = item?.[method];
    if (!op?.operationId) continue;
    const params = [...(item.parameters ?? []), ...(op.parameters ?? [])];
    // The spec repeats some parameters; last definition wins, as it would on the wire.
    const byName = new Map();
    for (const p of params) if (p?.name) byName.set(`${p.in}:${p.name}`, p);
    const all = [...byName.values()];
    const bodySchema = op.requestBody?.content?.["application/json"]?.schema;
    ops.push({
      id: op.operationId,
      name: camel(op.operationId),
      method: method.toUpperCase(),
      path,
      group: op["x-resource-group"] ?? "other",
      platforms: op["x-platforms"] ?? null,
      summary: op.summary ?? "",
      description: op.description ?? "",
      pathParams: all.filter((p) => p.in === "path"),
      queryParams: all.filter((p) => p.in === "query"),
      body: bodySchema,
      bodyRequired: Boolean(op.requestBody?.required),
      multipart: Boolean(op.requestBody?.content?.["multipart/form-data"]),
    });
  }
}
ops.sort((a, b) => a.group.localeCompare(b.group) || a.name.localeCompare(b.name));

const out = [];
out.push(`// GENERATED FILE — DO NOT EDIT BY HAND.
//
// Every Zernio operation, from Zernio's own OpenAPI spec.
// Regenerate with:  npm run zernio:pull
//
// ${ops.length} operations across ${new Set(ops.map((o) => o.group)).size} resource groups.
//
// Request and response bodies are typed only where the spec spells the shape
// out inline. Where it uses a $ref, the parameter is \`unknown\` rather than a
// guess — a wrong type here would read as verified and be exactly the mistake
// this file exists to prevent. Path and query parameters, the required flags,
// and the methods are all exact.
import { zernioCall } from "./zernio-http";
`);

const groups = new Map();
for (const o of ops) {
  if (!groups.has(o.group)) groups.set(o.group, []);
  groups.get(o.group).push(o);
}

for (const [group, list] of groups) {
  out.push(`\n/* ${"=".repeat(70)}\n * ${group} — ${list.length} operations\n * ${"=".repeat(70) } */\n`);
  for (const o of list) {
    const args = [];
    for (const p of o.pathParams) args.push(`${camel(p.name)}: ${tsType(p.schema) === "unknown" ? "string" : tsType(p.schema)}`);

    const qOptional = o.queryParams.every((p) => !p.required);
    if (o.queryParams.length) {
      const fields = o.queryParams
        .map((p) => `${safeKey(p.name)}${p.required ? "" : "?"}: ${tsType(p.schema) === "unknown" ? "string" : tsType(p.schema)}`)
        .join("; ");
      args.push(`query${qOptional ? "?" : ""}: { ${fields} }`);
    }
    if (o.body || o.multipart) {
      const t = o.multipart ? "FormData" : tsType(o.body);
      args.push(`body${o.bodyRequired ? "" : "?"}: ${t === "unknown" ? "Record<string, unknown>" : t}`);
    }

    const lines = [clip(o.summary)];
    if (o.description && clip(o.description) !== clip(o.summary)) lines.push("", clip(o.description, 600));
    lines.push("", `${o.method} ${o.path}`);
    if (o.platforms) lines.push(`Platforms: ${o.platforms.join(", ")}`);

    /*
     * TypeScript will not take a required parameter after an optional one, and
     * plenty of operations have optional query with a required body. Widen the
     * earlier one to `| undefined` instead: it keeps the required slot, so a
     * caller writes `fn(undefined, body)` rather than the argument silently
     * shifting into the wrong position.
     */
    // Look only at the parameter NAME. The types are full of optional object
    // members, so testing the whole string for "?:" reads `body: { a?: b }` as
    // an optional parameter and leaves the real ordering bug in place.
    const isOptional = (a) => /^[A-Za-z_$][\w$]*\?\s*:/.test(a);
    for (let i = 0; i < args.length; i++) {
      if (!isOptional(args[i])) continue;
      if (!args.slice(i + 1).some((a) => !isOptional(a))) continue;
      args[i] = args[i].replace("?:", ":") + " | undefined";
    }

    out.push(doc(lines, ""));
    const pathExpr = o.path.replace(/\{(\w+)\}/g, (_, n) => `\${encodeURIComponent(String(${camel(n)}))}`);
    const call = [
      `"${o.method}"`,
      /\$\{/.test(pathExpr) ? `\`${pathExpr}\`` : `"${o.path}"`,
      o.queryParams.length ? "query" : "undefined",
      o.body || o.multipart ? "body" : "undefined",
    ];
    out.push(`export function ${o.name}(${args.join(", ")}) {`);
    out.push(`  return zernioCall(${call.join(", ")});`);
    out.push(`}\n`);
  }
}

// A machine-readable index, so a route can check "is this a real operation?"
// without importing 647 functions.
out.push(`\n/** Every operation, for the generic proxy and for the self-test. */`);
out.push(`export const ZERNIO_OPERATIONS = ${JSON.stringify(
  ops.map((o) => ({
    id: o.id, name: o.name, method: o.method, path: o.path, group: o.group,
    platforms: o.platforms, summary: clip(o.summary, 160),
    pathParams: o.pathParams.map((p) => p.name),
    query: o.queryParams.map((p) => ({ name: p.name, required: Boolean(p.required) })),
    hasBody: Boolean(o.body || o.multipart),
  })),
  null,
  2,
)} as const;\n`);

/*
 * The other half: what Zernio sends us.
 *
 * These are OpenAPI 3.1 `webhooks` — inbound events, not endpoints we call.
 * They are the whole reason a copilot can be event-driven instead of polling,
 * so the catalogue is generated with everything else and the receiver checks
 * incoming events against it.
 */
const events = Object.entries(spec.webhooks ?? {}).map(([name, item]) => {
  const op = METHODS.map((m) => item?.[m]).find(Boolean) ?? {};
  return { name, id: op.operationId ?? name, summary: clip(op.summary || op.description, 200) };
});
events.sort((a, b) => a.name.localeCompare(b.name));

out.push(`\n/** Every event Zernio can send us. ${events.length} of them. */`);
out.push(`export const ZERNIO_EVENTS = ${JSON.stringify(events, null, 2)} as const;\n`);
out.push(`export type ZernioEventName = (typeof ZERNIO_EVENTS)[number]["name"];\n`);

writeFileSync(OUT, out.join("\n"));

/*
 * The same index as plain JSON.
 *
 * The TypeScript export is what the app imports; this is what the test suite
 * and any tooling reads, because neither should need a TypeScript loader to
 * answer "does the client still match the spec?".
 */
writeFileSync(
  join(web, "vendor", "zernio-operations.json"),
  JSON.stringify({ operations: ops.map((o) => ({ id: o.id, name: o.name, method: o.method, path: o.path, group: o.group })), events }, null, 2),
);
const byGroup = [...groups].map(([g, l]) => `${g} ${l.length}`).join(", ");
console.log(`Wrote ${OUT}`);
console.log(`${ops.length} operations: ${byGroup}`);
console.log(`${events.length} inbound webhook events`);
