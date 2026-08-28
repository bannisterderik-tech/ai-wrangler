import { inflateRawSync } from "node:zlib";

/**
 * Read an .xlsx into rows, with nothing installed.
 *
 * A CRM export arrives as Excel far more often than as CSV — and often named
 * .csv, which is how this got missed: the file said csv, the bytes said PK.
 * Refusing those is refusing the normal case.
 *
 * An .xlsx is a ZIP of XML. Node already has the inflate, so the whole reader
 * is a ZIP directory walk and two small XML passes; a dependency for this would
 * be one to maintain forever for something that does not change.
 */

type Entry = { name: string; method: number; offset: number; size: number };

/** Walk the central directory. Local headers alone lie about size when streamed. */
function entries(buf: Buffer): Entry[] {
  // End of central directory: scan back from the tail, past any comment.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 66_000; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("That file is not a readable spreadsheet (no zip directory).");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out: Entry[] = [];
  for (let i = 0; i < count && p + 46 <= buf.length; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    out.push({
      name: buf.toString("utf8", p + 46, p + 46 + nameLen),
      method: buf.readUInt16LE(p + 10),
      size: buf.readUInt32LE(p + 20),
      offset: buf.readUInt32LE(p + 42),
    });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

function read(buf: Buffer, e: Entry): string {
  const nameLen = buf.readUInt16LE(e.offset + 26);
  const extraLen = buf.readUInt16LE(e.offset + 28);
  const start = e.offset + 30 + nameLen + extraLen;
  const raw = buf.subarray(start, start + e.size);
  if (e.method === 0) return raw.toString("utf8");
  if (e.method === 8) return inflateRawSync(raw).toString("utf8");
  throw new Error(`That spreadsheet uses an unsupported compression method (${e.method}).`);
}

const unescape = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

/** Shared strings. A cell of type "s" holds an index into this. */
function sharedStrings(xml: string): string[] {
  const out: string[] = [];
  for (const si of xml.match(/<si>[\s\S]*?<\/si>/g) ?? []) {
    // A styled cell splits its text across <r> runs; join them back.
    const parts = si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) ?? [];
    out.push(parts.map((t) => unescape(t.replace(/<[^>]+>/g, ""))).join(""));
  }
  return out;
}

/** "BC" -> 54. Cells carry a reference, and skipped ones simply are not there. */
function colIndex(ref: string) {
  const letters = ref.replace(/[0-9]/g, "");
  let n = 0;
  for (const c of letters) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
}

/**
 * The first worksheet, as a grid of strings.
 *
 * Empty cells are preserved as "" rather than collapsed, because a column that
 * shifts left when a value is missing turns a stage into a name.
 */
export function readXlsx(data: Buffer): string[][] {
  const list = entries(data);
  const sheetEntry =
    list.find((e) => /^xl\/worksheets\/sheet1\.xml$/.test(e.name)) ??
    list.find((e) => /^xl\/worksheets\/.*\.xml$/.test(e.name));
  if (!sheetEntry) throw new Error("That spreadsheet has no worksheet in it.");
  const sharedEntry = list.find((e) => e.name === "xl/sharedStrings.xml");
  const shared = sharedEntry ? sharedStrings(read(data, sharedEntry)) : [];
  const xml = read(data, sheetEntry);

  const rows: string[][] = [];
  for (const rowXml of xml.match(/<row[^>]*>[\s\S]*?<\/row>|<row[^>]*\/>/g) ?? []) {
    const row: string[] = [];
    for (const cell of rowXml.match(/<c[^>]*>[\s\S]*?<\/c>|<c[^>]*\/>/g) ?? []) {
      const ref = /r="([A-Z]+)\d+"/.exec(cell)?.[1];
      const type = /t="([^"]+)"/.exec(cell)?.[1];
      let value = "";
      if (type === "inlineStr") {
        value = (cell.match(/<t[^>]*>([\s\S]*?)<\/t>/g) ?? [])
          .map((t) => unescape(t.replace(/<[^>]+>/g, "")))
          .join("");
      } else {
        const v = /<v>([\s\S]*?)<\/v>/.exec(cell)?.[1];
        if (v !== undefined) {
          value = type === "s" ? (shared[Number(v)] ?? "") : unescape(v);
        }
      }
      const at = ref ? colIndex(ref) : row.length;
      while (row.length < at) row.push("");
      row[at] = value;
    }
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => String(v).trim()));
}

/** PK\x03\x04 — the only reliable way to tell, since the name often lies. */
export function looksLikeXlsx(data: Buffer) {
  return data.length > 4 && data[0] === 0x50 && data[1] === 0x4b && data[2] === 0x03 && data[3] === 0x04;
}
