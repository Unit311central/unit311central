import type {
  ContentStudioFunctionNode,
  ContentStudioPageConfig,
  ContentStudioTemplatePlaceholder,
} from "./types";

export const CONTENT_STUDIO_FUNCTIONS: ContentStudioFunctionNode[] = [
  { id: "corporate", label: "Corporate", description: "Company-wide narrative and brand collateral" },
  { id: "management", label: "Management", description: "Executive and management presentations" },
  { id: "fundraising", label: "Fundraising", description: "Investor pitch decks and update presentations" },
  { id: "sales", label: "Sales", description: "Pipeline, proposals, and client-facing decks" },
  { id: "marketing", label: "Marketing", description: "Campaigns, events, and product marketing" },
  { id: "projects", label: "Projects", description: "Delivery, status, and client project updates" },
  { id: "operations", label: "Operations", description: "Operating reviews and process updates" },
  { id: "finance", label: "Finance", description: "Financial reviews and management reporting" },
  { id: "hr", label: "HR", description: "People, culture, and workforce updates" },
  { id: "engineering", label: "Engineering", description: "Technical reviews and product engineering" },
  { id: "qms", label: "QMS", description: "Quality and compliance communications" },
  { id: "regulatory", label: "Regulatory", description: "Regulatory and governance briefings" },
  { id: "administration", label: "Administration", description: "Internal administration and policy" },
];

export const CONTENT_STUDIO_PAGE_PRESETS: string[] = [
  "Executive Summary",
  "Revenue",
  "Sales Performance",
  "Cash Position",
  "Burn Rate",
  "Gross Margin",
  "EBITDA",
  "Customers",
  "Projects",
  "HR",
  "Risks",
  "Issues & Exceptions",
  "Recommendations",
  "Custom Page",
];

export const DEFAULT_CFO_MANAGEMENT_PAGES: ContentStudioPageConfig[] = [
  { id: "p-exec", label: "Executive Summary", enabled: true },
  { id: "p-rev", label: "Revenue & Growth", enabled: true },
  { id: "p-cash", label: "Cash Position", enabled: true },
  { id: "p-burn", label: "Burn Rate", enabled: true },
  { id: "p-margin", label: "Gross Margin", enabled: true },
  { id: "p-ebitda", label: "EBITDA", enabled: true },
  { id: "p-ar", label: "Receivables", enabled: true },
  { id: "p-forecast", label: "Forecast", enabled: true },
  { id: "p-issues", label: "Issues & Exceptions", enabled: true },
  { id: "p-rec", label: "Recommendations", enabled: true },
];

const TEMPLATE_LIBRARY: Record<string, ContentStudioTemplatePlaceholder[]> = {
  management: [
    {
      id: "mgmt-general",
      name: "General Management Presentation",
      description: "Standard management meeting deck with company performance framing.",
      lastUpdated: "2026-08-10",
      status: "approved",
      canEdit: true,
    },
    {
      id: "mgmt-ceo",
      name: "CEO Management Review",
      description: "CEO-led operating review with strategic priorities and decisions.",
      lastUpdated: "2026-08-12",
      status: "approved",
      canEdit: true,
    },
    {
      id: "mgmt-cfo",
      name: "CFO Management Review",
      description: "Finance-led management review with cash, P&L, and forecast sections.",
      lastUpdated: "2026-08-14",
      status: "approved",
      canEdit: true,
    },
    {
      id: "mgmt-coo",
      name: "COO Management Review",
      description: "Operations delivery, capacity, and execution risk summary.",
      lastUpdated: "2026-08-11",
      status: "approved",
      canEdit: true,
    },
    {
      id: "mgmt-cto",
      name: "CTO Management Review",
      description: "Technology roadmap, platform health, and engineering priorities.",
      lastUpdated: "2026-08-13",
      status: "approved",
      canEdit: true,
    },
    {
      id: "mgmt-cro",
      name: "CRO Management Review",
      description: "Commercial pipeline, win/loss, and revenue motion update.",
      lastUpdated: "2026-08-12",
      status: "approved",
      canEdit: true,
    },
    {
      id: "mgmt-update",
      name: "Management Update",
      description: "Concise cross-functional management update for leadership audiences.",
      lastUpdated: "2026-08-08",
      status: "approved",
      canEdit: true,
    },
  ],
  fundraising: [
    {
      id: "fund-pitch",
      name: "Pitch Deck",
      description: "Initial investor pitch — company story, market, traction, and ask.",
      lastUpdated: "2026-08-05",
      status: "approved",
      canEdit: true,
    },
    {
      id: "fund-prospective",
      name: "Prospective Investor Presentation",
      description: "Deeper diligence presentation for investors progressing beyond first pitch.",
      lastUpdated: "2026-08-07",
      status: "approved",
      canEdit: true,
    },
    {
      id: "fund-existing",
      name: "Existing Investor Presentation",
      description: "Recurring update deck for current investors and board observers.",
      lastUpdated: "2026-08-09",
      status: "approved",
      canEdit: true,
    },
  ],
  sales: [
    {
      id: "sales-client-proposal",
      name: "Client Proposal",
      description: "Approved client proposal structure with scope, pricing, and delivery.",
      lastUpdated: "2026-08-01",
      status: "approved",
      canEdit: false,
    },
    {
      id: "sales-pitch",
      name: "Sales Pitch Deck",
      description: "Standard company sales narrative for first meetings.",
      lastUpdated: "2026-08-03",
      status: "approved",
      canEdit: false,
    },
  ],
  marketing: [
    {
      id: "mkt-brochure",
      name: "Company Brochure",
      description: "Approved company overview brochure layout.",
      lastUpdated: "2026-07-28",
      status: "approved",
      canEdit: false,
    },
    {
      id: "mkt-one-pager",
      name: "Product One-Pager",
      description: "Single-page product summary for campaigns.",
      lastUpdated: "2026-08-02",
      status: "review",
      canEdit: false,
    },
  ],
  corporate: [
    {
      id: "corp-company",
      name: "Company Presentation",
      description: "Master company story for internal and external audiences.",
      lastUpdated: "2026-08-06",
      status: "approved",
      canEdit: true,
    },
  ],
  engineering: [
    {
      id: "eng-status",
      name: "Engineering Status Review",
      description: "Programme status, risks, and milestone summary.",
      lastUpdated: "2026-08-04",
      status: "approved",
      canEdit: false,
    },
  ],
  finance: [
    {
      id: "fin-review",
      name: "Financial Review Deck",
      description: "Standard finance review for management audiences.",
      lastUpdated: "2026-08-08",
      status: "approved",
      canEdit: true,
    },
  ],
};

export function getContentStudioTemplates(functionId: string): ContentStudioTemplatePlaceholder[] {
  return TEMPLATE_LIBRARY[functionId] ?? [];
}
