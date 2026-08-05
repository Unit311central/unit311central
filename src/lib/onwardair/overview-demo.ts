/**
 * OnwardAir /overview invite page — editable demo content + module screenshot map.
 */

import {
  type PortalsIndent,
  type PortalsModuleRow,
  newPortalsRowId,
  portalsRowIndent,
} from "@/lib/onwardair/portals-demo";

function row(id: string, text: string, indent: PortalsIndent = 0): PortalsModuleRow {
  return { id, text, indent };
}

/**
 * Top-level order matches live OnwardAir LHS (see platform sidebar screenshots).
 * Sub-rows are the expandable children Scott can open in column 2.
 */
export const DEFAULT_OVERVIEW_MODULES: PortalsModuleRow[] = [
  row("m1", "Home"),
  row("m2", "Executive Assistant"),

  row("m5", "Business Central"),
  row("m5a", "Dashboard", 1),
  row("m5b", "Clients", 1),
  row("m5c", "CRM", 1),

  row("m3", "OnwardAir Intelligence"),
  row("m3a", "Competitor Intelligence", 1),
  row("m3b", "Ecosystem Partners", 1),

  row("m10", "Financials"),
  row("m10a", "Dashboard", 1),
  row("m10b", "General Ledger", 1),
  row("m10c", "AR", 1),
  row("m10d", "AP", 1),
  row("m10e", "Expenses", 1),
  row("m10f", "Banks", 1),
  row("m10g", "Financial Reports", 1),

  row("m8", "Fundraising"),
  row("m8a", "Pipeline", 1),
  row("m8b", "Meetings", 1),
  row("m8c", "Pitch Decks", 1),
  row("m8d", "Data Rooms", 1),

  row("m9", "Board"),
  row("m9a", "Dashboard", 1),
  row("m9b", "Board Meetings", 1),
  row("m9c", "Board Packs", 1),
  row("m9d", "Risk Register", 1),
  row("m9e", "Board Members", 1),

  row("m13", "Corporate Information"),
  row("m13a", "Company Details", 1),
  row("m13b", "Office Locations", 1),
  row("m7", "IP & Patents", 1),
  row("m7a", "IP Overview", 2),
  row("m7b", "Patent Register", 2),
  row("m7c", "Patent Portfolio", 2),

  row("m16", "Operations"),
  row("m16a", "Dashboard", 1),
  row("m16b", "Assets", 1),
  row("m16c", "Inventory", 1),
  row("m16d", "Procurement", 1),

  row("m12", "Marketing & Events"),
  row("m12a", "Dashboard", 1),
  row("m12b", "Social", 1),
  row("m12c", "Digital Newsletter", 1),
  row("m12d", "External Events", 1),

  row("m14", "Technology Management"),
  row("m14a", "Devices", 1),
  row("m14b", "Software & SaaS", 1),

  row("m11", "Human Resources"),
  row("m11a", "Dashboard", 1),
  row("m11b", "Employees", 1),
  row("m11c", "Org Chart", 1),
  row("m11d", "Recruitment", 1),
  row("m11e", "Payroll", 1),

  row("m15", "Business Productivity"),
  row("m15a", "Email", 1),
  row("m15b", "Calendar", 1),
  row("m15c", "Messaging", 1),

  row("m21", "Support Desk"),

  row("m4", "Project Management"),
  row("m4a", "Dashboard", 1),
  row("m4b", "Internal Projects", 1),
  row("m4c", "External Projects", 1),

  row("m6", "Engineering"),
  row("m6a", "Overview", 1),
  row("m6b", "Programs & Milestones", 1),
  row("m6c", "Assurance & Certification", 1),
  row("m6d", "Engineering Risks", 1),

  row("m17", "Training"),
  row("m17a", "Dashboard", 1),
  row("m17b", "Courses", 1),

  row("m18", "QMS"),
  row("m18a", "Document Control", 1),
  row("m18b", "CAPA", 1),
  row("m18c", "Internal Audits", 1),

  row("m22", "Tools"),
  row("m22a", "Testing", 1),
  row("m22b", "Live drone", 2),

  row("m19", "External Client Access"),
  row("m19a", "Dashboard", 1),
  row("m19b", "External Users", 1),
  row("m19c", "Board Portal access", 1),
  row("m19d", "Client Portal Access", 1),

  row("m20", "Settings"),
  row("m20a", "Profile", 1),
  row("m20b", "Users", 1),
  row("m20c", "General", 1),
];

export type OverviewInviteRow = {
  wave: string;
  who: string;
  why: string;
};

export type OnwardAirOverviewEditableContent = {
  headline: string;
  subheadline: string;
  questionsTitle: string;
  questionsIntro: string;
  questions: string[];
  highlightsTitle: string;
  highlightsIntro: string;
  highlights: string[];
  agendaTitle: string;
  agendaIntro: string;
  agenda: OverviewInviteRow[];
  agendaNote: string;
  modulesTitle: string;
  modules: PortalsModuleRow[];
  previewHint: string;
};

/** Public path under /images/overview/screenshots/{slug}.png */
export const OVERVIEW_SCREENSHOT_BY_MODULE_ID: Record<string, string> = {
  m1: "home",
  m2: "executive-assistant",
  m3: "intelligence",
  m3a: "intelligence",
  m3b: "intelligence",
  m4: "project-management",
  m4a: "project-management",
  m4b: "project-management",
  m4c: "project-management",
  m5: "business-central",
  m5a: "business-central",
  m5b: "business-central",
  m5c: "business-central",
  m6: "engineering",
  m6a: "engineering",
  m6b: "engineering",
  m6c: "engineering",
  m6d: "engineering",
  m7: "ip-patents",
  m7a: "ip-patents",
  m7b: "ip-patents",
  m7c: "ip-patents",
  m8: "fundraising",
  m8a: "fundraising",
  m8b: "fundraising",
  m8c: "fundraising",
  m8d: "fundraising",
  m9: "board",
  m9a: "board",
  m9b: "board",
  m9c: "board",
  m9d: "board",
  m9e: "board",
  m10: "financials",
  m10a: "financials",
  m10b: "financials",
  m10c: "financials",
  m10d: "financials",
  m10e: "financials",
  m10f: "financials",
  m10g: "financials",
  m11: "hr",
  m11a: "hr",
  m11b: "hr",
  m11c: "hr",
  m11d: "hr",
  m11e: "hr",
  m12: "marketing",
  m12a: "marketing",
  m12b: "marketing",
  m12c: "marketing",
  m12d: "marketing",
  m13: "corporate",
  m13a: "corporate",
  m13b: "corporate",
  m14: "technology",
  m14a: "technology",
  m14b: "technology",
  m15: "productivity",
  m15a: "productivity",
  m15b: "productivity",
  m15c: "productivity",
  m16: "operations",
  m16a: "operations",
  m16b: "operations",
  m16c: "operations",
  m16d: "operations",
  m17: "training",
  m17a: "training",
  m17b: "training",
  m18: "qms",
  m18a: "qms",
  m18b: "qms",
  m18c: "qms",
  m19: "client-access",
  m19a: "client-access",
  m19b: "client-access",
  m19c: "board-portal",
  m19d: "client-portal",
  m20: "settings",
  m20a: "settings",
  m20b: "settings",
  m20c: "settings",
  m21: "productivity",
  m22: "settings",
  m22a: "settings",
  m22b: "settings",
};

export const OVERVIEW_SCREENSHOT_SLUGS = [
  "home",
  "executive-assistant",
  "intelligence",
  "project-management",
  "business-central",
  "engineering",
  "ip-patents",
  "fundraising",
  "board",
  "financials",
  "hr",
  "marketing",
  "corporate",
  "technology",
  "productivity",
  "operations",
  "training",
  "qms",
  "client-access",
  "settings",
] as const;

export type OverviewScreenshotSlug = (typeof OVERVIEW_SCREENSHOT_SLUGS)[number];

export function overviewScreenshotSrc(slug: string | null | undefined): string {
  const key = String(slug ?? "home").trim().toLowerCase() || "home";
  // Cache-bust when swapping mockups → live captures.
  return `/images/overview/screenshots/${key}.png?v=live14`;
}

export function overviewScreenshotForModuleId(moduleId: string | null | undefined): string {
  const slug = OVERVIEW_SCREENSHOT_BY_MODULE_ID[String(moduleId ?? "")] ?? "generic";
  return overviewScreenshotSrc(slug);
}

/**
 * Prefer exact platform view id as screenshot filename.
 * Fallbacks cover older section-level captures when a view-specific file is missing from the map.
 * Keep sibling pages on distinct slugs so overview previews don't look identical.
 */
const OVERVIEW_VIEW_SCREENSHOT_FALLBACK: Record<string, string> = {
  home: "home",
  "executive-assistant": "executive-assistant",
  "business-central-dashboard": "business-central-dashboard",
  "clients-dashboard": "clients-dashboard",
  clients: "clients",
  crm: "crm",
  "crm-meetings": "crm-meetings",
  "client-onboarding": "client-onboarding",
  representatives: "representatives",
  grants: "grants",
  "member-intelligence": "clients",
  "projects-dashboard": "projects-dashboard",
  "projects-internal": "projects-internal",
  "projects-external": "projects-external",
  projects: "projects-dashboard",
  "oa-competitor-intelligence": "oa-competitor-intelligence",
  "oa-ecosystem-partners": "oa-ecosystem-partners",
  "potential-clients": "oa-competitor-intelligence",
  financials: "financials",
  "general-ledger": "general-ledger",
  "accounts-receivable": "accounts-receivable",
  "accounts-payable": "accounts-payable",
  expenses: "expenses",
  wise: "wise",
  "financial-reports": "financial-reports",
  "fundraising-dashboard": "fundraising-dashboard",
  "fundraising-pipeline": "fundraising-pipeline",
  "fundraising-meetings": "fundraising-meetings",
  "fundraising-pitch-decks": "fundraising-pitch-decks",
  "fundraising-data-rooms": "fundraising-data-rooms",
  "fundraising-investors": "fundraising-investors",
  "corporate-cap-table": "corporate-cap-table",
  "corporate-dashboard": "corporate-dashboard",
  "corporate-company-details": "corporate-company-details",
  "corporate-bank-accounts": "corporate-bank-accounts",
  "corporate-advisers": "corporate-advisers",
  "corporate-contracts": "corporate-contracts",
  "corporate-board-directors": "corporate-board-directors",
  "board-dashboard": "board-dashboard",
  "board-meetings": "board-meetings",
  "board-pack": "board-pack",
  "board-minutes": "board-minutes",
  "corporate-risk-register": "corporate-risk-register",
  "board-members": "board-members",
  "company-details": "company-details",
  "office-locations": "office-locations",
  "oa-ip-overview": "oa-ip-overview",
  "oa-ip-dashboard": "oa-ip-dashboard",
  "oa-ip-register": "oa-ip-register",
  "oa-ip-portfolio": "oa-ip-portfolio",
  "oa-ip-documents": "oa-ip-documents",
  "oa-ip-search": "oa-ip-search",
  "oa-engineering-overview": "oa-engineering-overview",
  "oa-programs-milestones": "oa-programs-milestones",
  "oa-assurance-certification": "oa-assurance-certification",
  "oa-engineering-risks": "oa-engineering-risks",
  "oa-team-capacity": "oa-team-capacity",
  "oa-supply-dependencies": "oa-supply-dependencies",
  "oa-engineering-integrations": "oa-engineering-integrations",
  "operations-dashboard": "operations-dashboard",
  assets: "assets",
  inventory: "inventory-management",
  "inventory-management": "inventory-management",
  procurement: "procurement",
  logistics: "logistics",
  "oa-marketing-dashboard": "oa-marketing-dashboard",
  social: "social",
  "marketing-newsletter": "marketing-newsletter",
  "marketing-events": "marketing-events",
  "marketing-event-management": "marketing-event-management",
  "marketing-mailing-list": "marketing-mailing-list",
  devices: "technology-devices",
  "software-saas": "technology-software",
  technology: "technology-dashboard",
  "technology-dashboard": "technology-dashboard",
  "technology-devices": "technology-devices",
  "technology-software": "technology-software",
  "technology-telecommunications": "technology-telecommunications",
  "technology-infrastructure": "technology-infrastructure",
  "technology-reports": "technology-reports",
  "technology-settings": "technology-settings",
  "hr-dashboard": "hr-dashboard",
  hr: "employees",
  "hr-org-chart": "hr-org-chart",
  "hr-recruitment": "hr-recruitment",
  "hr-leave": "hr-leave",
  "hr-payroll": "hr-payroll",
  "hr-performance": "hr-performance",
  "hr-reports": "hr-reports",
  employees: "employees",
  "org-chart": "org-chart",
  recruitment: "recruitment",
  payroll: "payroll",
  "productivity-dashboard": "productivity-dashboard",
  "info-email": "info-email",
  email: "email",
  "files-internal": "files-internal",
  "files-external": "files-external",
  "files-client": "files-client",
  calendar: "calendar",
  messaging: "messaging",
  communications: "communications",
  whiteboard: "whiteboard",
  "support-desk": "support",
  "support-tickets": "support",
  "support-overview": "support-overview",
  support: "support",
  "support-mine": "support-mine",
  "whatsapp-integration": "whatsapp-integration",
  "training-dashboard": "training-dashboard",
  training: "training",
  "training-external": "training-external",
  "qms-training": "qms-training",
  "document-control": "qms-document-control",
  capa: "qms-capa",
  "internal-audits": "qms-internal-audits",
  qms: "quality-management",
  "quality-management": "quality-management",
  "qms-document-control": "qms-document-control",
  "qms-capa": "qms-capa",
  "qms-internal-audits": "qms-internal-audits",
  "qms-management-review": "qms-management-review",
  "qms-reports": "qms-reports",
  "external-client-access": "external-client-access",
  "users-external": "users-external",
  "website-management": "website-management",
  integrations: "integrations",
  users: "users",
  "settings-profile": "settings-profile",
  "settings-users": "settings-users",
  "settings-general": "settings-general",
  settings: "settings",
  profile: "profile",
  billing: "billing",
  appearance: "appearance",
  testing: "testing",
  telemetry: "telemetry",
  productivity: "productivity-dashboard",
};

/** Map live platform `?view=` ids → overview screenshot slug (exact first page). */
export function overviewScreenshotSlugForView(view: string | null | undefined): string {
  const v = String(view ?? "home").trim().toLowerCase();
  if (!v) return "home";
  if (OVERVIEW_VIEW_SCREENSHOT_FALLBACK[v]) return OVERVIEW_VIEW_SCREENSHOT_FALLBACK[v];
  // Unknown views: prefer generic over a broken image.
  return "generic";
}

export function overviewScreenshotForView(view: string | null | undefined): string {
  return overviewScreenshotSrc(overviewScreenshotSlugForView(view));
}

export function defaultOnwardAirOverviewContent(): OnwardAirOverviewEditableContent {
  return {
    headline:
      "Demonstration environment – a fully customizable Business Operating and Intelligence Platform – tailored for OnwardAir",
    subheadline: "",
    questionsTitle: "Questions for thought",
    questionsIntro: "",
    questions: [
      "Can you see the health of your business in real time?",
      "Can you get a trusted answer to a question about your business — rapidly?",
      "Do you have complete visibility of your projects, people and finances?",
      "Are your teams switching between too many applications?",
      "Do you know where your biggest business risks are?",
    ],
    highlightsTitle: "KEY HIGHLIGHTS",
    highlightsIntro: "",
    highlights: [
      "AI Executive Assistant",
      "OnwardAir Intelligence",
      "Client Management inc external portal",
      "Financials & cash runway view",
      "Fundraising",
    ],
    agendaTitle: "45 minute working session & live walkthrough",
    agendaIntro: "",
    agenda: [
      {
        wave: "0–20 mins",
        who: "+Leadership +Management",
        why: "Leadership picture",
      },
      {
        wave: "20–35 mins",
        who: "+Engineering leads +Operation leads",
        why: "Programmes, tools & operating rhythm",
      },
      {
        wave: "35-45 mins",
        who: "Core three",
        why: "Decide fit and next steps — outline the build plan together",
      },
    ],
    agendaNote: "",
    modulesTitle: "Major Modules",
    modules: DEFAULT_OVERVIEW_MODULES.map((entry) => ({ ...entry })),
    previewHint: "Select a module — preview appears here.",
  };
}

export function sanitizeOverviewContent(raw: unknown): OnwardAirOverviewEditableContent {
  const fallback = defaultOnwardAirOverviewContent();
  if (!raw || typeof raw !== "object") return fallback;
  const body = raw as Partial<OnwardAirOverviewEditableContent>;

  const str = (value: unknown, fb: string) => {
    const next = String(value ?? "").trim();
    return next || fb;
  };

  const strList = (value: unknown, fb: string[]) => {
    if (!Array.isArray(value)) return [...fb];
    const rows = value.map((entry) => String(entry ?? "").trim()).filter(Boolean);
    return rows.length ? rows : [...fb];
  };

  const agenda = Array.isArray(body.agenda)
    ? body.agenda
        .map((row) => {
          if (!row || typeof row !== "object") return null;
          const wave = String((row as OverviewInviteRow).wave ?? "").trim();
          const who = String((row as OverviewInviteRow).who ?? "").trim();
          const why = String((row as OverviewInviteRow).why ?? "").trim();
          if (!wave && !who && !why) return null;
          return { wave: wave || "—", who: who || "—", why: why || "—" };
        })
        .filter(Boolean) as OverviewInviteRow[]
    : fallback.agenda;

  const modules: PortalsModuleRow[] = Array.isArray(body.modules)
    ? body.modules
        .map((entry, index) => {
          if (!entry || typeof entry !== "object") return null;
          const text = String((entry as PortalsModuleRow).text ?? "");
          const rawIndent = (entry as PortalsModuleRow).indent;
          const indent: PortalsIndent = rawIndent === 2 ? 2 : rawIndent === 1 ? 1 : 0;
          const id =
            typeof (entry as PortalsModuleRow).id === "string" && (entry as PortalsModuleRow).id
              ? (entry as PortalsModuleRow).id
              : newPortalsRowId(`m${index}`);
          return { id, text, indent };
        })
        .filter(Boolean) as PortalsModuleRow[]
    : fallback.modules.map((entry) => ({ ...entry }));

  return {
    headline: str(body.headline, fallback.headline),
    subheadline: str(body.subheadline, fallback.subheadline),
    questionsTitle: str(body.questionsTitle, fallback.questionsTitle),
    questionsIntro: str(body.questionsIntro, fallback.questionsIntro),
    questions: strList(body.questions, fallback.questions),
    highlightsTitle: str(body.highlightsTitle, fallback.highlightsTitle),
    highlightsIntro: str(body.highlightsIntro, fallback.highlightsIntro),
    highlights: strList(body.highlights, fallback.highlights),
    agendaTitle: str(body.agendaTitle, fallback.agendaTitle),
    agendaIntro: str(body.agendaIntro, fallback.agendaIntro),
    agenda: agenda.length ? agenda : fallback.agenda,
    agendaNote: str(body.agendaNote, fallback.agendaNote),
    modulesTitle: str(body.modulesTitle, fallback.modulesTitle),
    modules: modules.length ? modules : fallback.modules.map((entry) => ({ ...entry })),
    previewHint: str(body.previewHint, fallback.previewHint),
  };
}

export { portalsRowIndent, newPortalsRowId };
export type { PortalsModuleRow, PortalsIndent };
