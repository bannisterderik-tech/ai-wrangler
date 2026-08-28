/**
 * The pipeline, as it actually runs.
 *
 * There were six stages here and twelve in the real CRM, so the importer had to
 * collapse four different offer stages into one word — "create offer", "offer
 * ready", "offer sent" and "offer negotiation" all became `proposal`. That threw
 * away the only thing the stage was for: knowing whether the thing had been
 * sent yet.
 *
 * These are the twelve, in order. One list, imported everywhere, because the
 * old set was hard-coded in six separate files and they had already drifted.
 */
export type Stage = {
  id: string;
  label: string;
  /** The dot, matching the board these came from. */
  dot: string;
  /** Still in play — counted in the pipeline total and callable from the dialer. */
  open: boolean;
};

export const STAGES: Stage[] = [
  { id: "no_stage", label: "No stage", dot: "transparent", open: false },
  { id: "partners", label: "Partners", dot: "#c542d4", open: false },
  { id: "prospects", label: "Prospects", dot: "#9aa0a6", open: true },
  { id: "lead", label: "Lead", dot: "#2f7ef4", open: true },
  { id: "book_discovery", label: "Book Discovery Meeting", dot: "#e2447f", open: true },
  { id: "booked_discovery", label: "Booked Discovery Meeting", dot: "#93b023", open: true },
  { id: "create_offer", label: "Create Offer", dot: "#dd6b20", open: true },
  { id: "offer_ready", label: "Offer Ready", dot: "#e6a119", open: true },
  { id: "offer_sent", label: "Offer Sent", dot: "#7b5cf5", open: true },
  { id: "offer_negotiation", label: "Offer Negotiation", dot: "#3aa8c4", open: true },
  { id: "won", label: "Won", dot: "#2eb872", open: false },
  { id: "lost", label: "Lost", dot: "#e5484d", open: false },
];

export const STAGE_IDS = STAGES.map((s) => s.id);
export const DEFAULT_STAGE = "lead";

const BY_ID = new Map(STAGES.map((s) => [s.id, s]));

export const stage = (id: string): Stage =>
  BY_ID.get(id) ?? { id, label: id, dot: "transparent", open: true };

export const stageLabel = (id: string) => stage(id).label;
export const isOpen = (id: string) => stage(id).open;

/**
 * Their words to ours.
 *
 * The export's stage names now map one-to-one, so nothing is collapsed on the
 * way in. The older short names are kept because leads imported before this
 * change still carry them, and because the MCP tools accept them.
 */
const ALIASES: Record<string, string> = {
  // What the source CRM calls them.
  "no stage": "no_stage",
  "partner": "partners",
  "partners": "partners",
  "prospect": "prospects",
  "prospects": "prospects",
  "lead": "lead",
  "book discovery meeting": "book_discovery",
  "booked discovery meeting": "booked_discovery",
  "discovery": "book_discovery",
  "create offer": "create_offer",
  "offer ready": "offer_ready",
  "offer sent": "offer_sent",
  "offer negotiation": "offer_negotiation",
  "negotiation": "offer_negotiation",
  "won": "won",
  "closed won": "won",
  "lost": "lost",
  "closed lost": "lost",
  // What we used to call them, so old rows and old callers still land somewhere
  // sensible. `talking` and `proposal` covered several of the stages above, so
  // they resolve to the EARLIEST of those — claiming a meeting is booked, or an
  // offer sent, on no evidence would be worse than filing it one step back.
  "new": "lead",
  "talking": "book_discovery",
  "proposal": "create_offer",
};

export function stageFrom(raw: unknown): string {
  const k = String(raw ?? "").toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
  if (!k) return "no_stage";
  if (ALIASES[k]) return ALIASES[k];
  if (BY_ID.has(k.replace(/ /g, "_"))) return k.replace(/ /g, "_");
  if (k.includes("won")) return "won";
  if (k.includes("lost")) return "lost";
  if (k.includes("partner")) return "partners";
  if (k.includes("negotiat")) return "offer_negotiation";
  if (k.includes("offer") || k.includes("proposal")) return "create_offer";
  if (k.includes("discovery") || k.includes("meeting")) return "book_discovery";
  if (k.includes("prospect")) return "prospects";
  return DEFAULT_STAGE;
}
