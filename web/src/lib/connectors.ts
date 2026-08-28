/**
 * What an agent can be asked to reach.
 *
 * Two honest columns run through this file. `available` is whether the OS can
 * actually connect the thing today; almost nothing is, and saying so is the
 * point. A customer with four businesses and eleven tools needs the list before
 * they need the integrations, and a screen that quietly implies a working Odoo
 * connection is worse than one that says "declared, not built".
 *
 * So a copilot's dependency map is useful on day one — it is the scope of the
 * job — and it fills in one connector at a time without the shape changing.
 */

export type Category = "mail" | "calendar" | "messaging" | "voice" | "work" | "money" | "files" | "site";

export type Connector = {
  id: string;
  name: string;
  category: Category;
  /** What the agent could do once this is real. */
  gives: string;
  /** Can the OS connect it today? Almost always no, and it says so. */
  available: boolean;
  /** Why it is not trivial, when it is not. */
  note?: string;
};

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "mail", label: "Email" },
  { id: "calendar", label: "Calendar" },
  { id: "messaging", label: "Chat and SMS" },
  { id: "voice", label: "Phone" },
  { id: "work", label: "Work tracking" },
  { id: "money", label: "Money and stock" },
  { id: "files", label: "Documents" },
  { id: "site", label: "Their website" },
];

export const CONNECTORS: Connector[] = [
  {
    id: "superhuman_mail", name: "Email — via Superhuman", category: "mail", available: true,
    gives: "Search the inbox, read threads, draft replies, and say what actually needs them today.",
    note:
      "One hosted MCP server covers Gmail and Outlook both, so this replaces a Graph app registration, " +
      "admin consent and a Gmail OAuth review. The customer connects their own Superhuman account, which " +
      "means they need one — that is the real dependency. Superhuman holds sending behind its own approval, " +
      "which agrees with the wall here: a copilot drafts, a person sends.",
  },
  {
    id: "imap_mail_legacy", name: "Any IMAP mailbox", category: "mail", available: false,
    gives: "A mailbox with no Superhuman account behind it.",
    note: "Credentials per mailbox, no OAuth, and no send approval of its own. Only worth it where Superhuman cannot reach.",
  },
  {
    id: "superhuman_calendar", name: "Calendar — via Superhuman", category: "calendar", available: true,
    gives: "See the week across every account, hold slots, and stop the same hour being sold twice.",
    note:
      "The same Superhuman MCP connection as the mail one, so connecting once covers both, on Google and " +
      "Microsoft. For somebody running four businesses out of three calendars, this is the one that pays.",
  },
  {
    id: "apple_calendar", name: "Apple Calendar", category: "calendar", available: false,
    gives: "Read a personal calendar shared over CalDAV.",
    note: "CalDAV with an app-specific password. No push, so it polls.",
  },
  {
    id: "teams_chat", name: "Microsoft Teams", category: "messaging", available: false,
    gives: "Follow channels and huddles, and answer in them.",
    note: "Graph again, plus a bot registration to post as anything but the user.",
  },
  {
    id: "whatsapp", name: "WhatsApp", category: "messaging", available: false,
    gives: "Read and answer the number a business actually runs on.",
    note: "WhatsApp Business API through a provider. Personal WhatsApp has no API at all — that one is a wall, not a backlog item.",
  },
  {
    id: "sms", name: "SMS", category: "messaging", available: true,
    gives: "Send and log texts.",
    note: "Working, on one shared number. Per-customer numbers are not built.",
  },
  {
    id: "voice", name: "Phone calls", category: "voice", available: true,
    gives: "Place a call and log what happened.",
    note: "Working through Twilio, bridged to your own number.",
  },
  {
    id: "asana", name: "Asana", category: "work", available: false,
    gives: "See what is actually in flight and what has stalled.",
    note: "A well-documented REST API and a personal access token. One of the easier ones.",
  },
  {
    id: "sharepoint", name: "SharePoint", category: "files", available: false,
    gives: "Read the docs a business keeps its numbers in.", note: "Graph, again.",
  },
  {
    id: "odoo", name: "Odoo ERP", category: "money", available: false,
    gives: "Accounting, operations and stock — where the real numbers live.",
    note: "Odoo speaks XML-RPC and JSON-RPC. Doable, and the highest-value one on most lists.",
  },
  {
    id: "quickbooks", name: "QuickBooks", category: "money", available: false,
    gives: "Invoices, bills, and what is owed.",
  },
  {
    id: "notes", name: "Meeting notes", category: "files", available: false,
    gives: "Read what was said and turn it into work.",
    note: "Depends on the recorder. A folder of transcripts is the cheap version and works today.",
  },
  {
    id: "wrangler_site", name: "The site we run for them", category: "site", available: true,
    gives: "Errors, update requests and traffic from the site we build.",
    note: "Working — it is our own ingest.",
  },
  {
    id: "wrangler_crm", name: "Their leads in this OS", category: "work", available: true,
    gives: "Their own callers, calls and follow-ups.",
    note: "Working, and already walled per customer.",
  },
];

export function connector(id: string) {
  return CONNECTORS.find((c) => c.id === id) ?? null;
}

/** What a copilot is for, versus what a build agent is for. */
export const AGENT_KINDS = [
  {
    id: "build",
    label: "Build agent",
    blurb: "Works on the code we run for a customer. Claims jobs, opens branches, asks before anything irreversible.",
    needs: "A bound repository.",
  },
  {
    id: "copilot",
    label: "Customer copilot",
    blurb:
      "Runs alongside the customer's own business — their mail, calendar, chat, work board and books. It answers to them, not to the floor.",
    needs: "Connections to the systems their business actually runs on.",
  },
] as const;

export type AgentKind = (typeof AGENT_KINDS)[number]["id"];
export const isAgentKind = (v: string): v is AgentKind => AGENT_KINDS.some((k) => k.id === v);
