export const NAV = [
  { section: "LIVE", items: [
    { href: "/", id: "briefing", label: "Briefing" },
    { href: "/work", id: "work", label: "Live work" },
    { href: "/manager", id: "manager", label: "Head Wrangler" },
    { href: "/inbox", id: "inbox", label: "Inbox" },
  ]},
  { section: "SHIP", items: [
    { href: "/approvals", id: "approvals", label: "Needs you" },
    { href: "/changes", id: "changes", label: "All changes" },
    { href: "/org", id: "org", label: "The AI team" },
    { href: "/playbooks", id: "playbooks", label: "Playbooks" },
  ]},
  { section: "CLIENTS", items: [
    { href: "/customers", id: "customers", label: "Customers" },
    { href: "/sales", id: "sales", label: "Sales" },
    { href: "/billing", id: "billing", label: "Billing" },
    { href: "/marketing", id: "marketing", label: "Marketing" },
  ]},
  { section: "AGENCY", items: [
    { href: "/team", id: "team", label: "Your team" },
    { href: "/memory", id: "memory", label: "Memory" },
    { href: "/spending", id: "spending", label: "Spending" },
    { href: "/connect", id: "connect", label: "Connect Vercel" },
    { href: "/github", id: "github", label: "Our GitHub" },
    { href: "/settings", id: "settings", label: "Settings" },
  ]},
] as const;

export const TITLES: Record<string, string> = {
  "/": "Morning briefing",
  "/work": "Live work",
  "/manager": "Head Wrangler",
  "/inbox": "Inbox",
  "/approvals": "Needs you",
  "/changes": "All changes",
  "/org": "The AI team",
  "/playbooks": "Playbooks",
  "/customers": "Customers",
  "/sales": "Sales",
  "/billing": "Billing",
  "/marketing": "Marketing",
  "/team": "Your team",
  "/memory": "Memory",
  "/spending": "Spending",
  "/connect": "Connect Vercel",
  "/github": "Our GitHub",
  "/settings": "Settings",
};
