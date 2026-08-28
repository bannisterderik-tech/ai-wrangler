export const NAV = [
  { section: "FUNNEL", items: [
    // Inbox first: it is where the day starts and where somebody is waiting.
    { href: "/inbox", id: "inbox", label: "Inbox" },
    { href: "/", id: "command", label: "Command" },
    { href: "/leads", id: "leads", label: "Leads" },
    { href: "/prospects", id: "prospects", label: "Prospects" },
    { href: "/dialer", id: "dialer", label: "Dialer" },
    { href: "/partners", id: "partners", label: "Partners" },
  ]},
  { section: "CLIENTS", items: [
    { href: "/customers", id: "customers", label: "Customers" },
    { href: "/billing", id: "billing", label: "Billing" },
    // Ads are run for a customer, not for the funnel — they belong with them.
    { href: "/ads", id: "ads", label: "Ads" },
  ]},
  { section: "BUILD", items: [
    { href: "/work", id: "work", label: "The floor" },
    { href: "/sessions", id: "sessions", label: "AI agents" },
    { href: "/playbooks", id: "playbooks", label: "Playbooks" },
  ]},
  { section: "SYSTEM", items: [
    { href: "/memory", id: "memory", label: "Memory" },
    { href: "/spending", id: "spending", label: "Spending" },
    { href: "/connect", id: "connect", label: "Connect Vercel" },
    { href: "/github", id: "github", label: "Our GitHub" },
    { href: "/settings", id: "settings", label: "Settings" },
  ]},
] as const;

export const TITLES: Record<string, string> = {
  "/": "Command — dominate the market",
  "/pipeline": "Leads",
  "/leads": "Leads — shops buying from us",
  "/prospects": "Prospects — firms we want",
  "/dialer": "Twilio power dialer",
  "/sms": "Inbox — every thread",
  "/ads": "Zernio ads",
  "/partners": "Partners — agencies flying our flag",
  "/work": "The floor — everything the AI is doing",
  "/sessions": "AI agents — what we run for each customer",
  "/manager": "AI agents — what we run for each customer",
  "/inbox": "Inbox — every thread",
  "/approvals": "The floor — everything the AI is doing",
  "/changes": "The floor — everything the AI is doing",
  "/org": "The AI team",
  "/playbooks": "Playbooks",
  "/customers": "Customers — shops we run",
  "/sales": "Leads",
  "/billing": "Billing & margin",
  "/marketing": "Ads",
  "/team": "The team — everyone's own Claude Code",
  "/memory": "Memory",
  "/spending": "Spending",
  "/connect": "Connect Vercel",
  "/github": "Our GitHub",
  "/settings": "Settings",
};
