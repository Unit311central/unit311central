import type { ContentStudioFunctionNode, ContentStudioTemplatePlaceholder } from "./types";

export const CONTENT_STUDIO_FUNCTIONS: ContentStudioFunctionNode[] = [
  { id: "corporate", label: "Corporate", description: "Company-wide narrative and brand collateral" },
  { id: "management", label: "Management", description: "Executive and management presentations" },
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

const TEMPLATE_LIBRARY: Record<string, ContentStudioTemplatePlaceholder[]> = {
  management: [
    {
      id: "mgmt-general",
      name: "General Management Presentation",
      description: "Standard executive committee deck with company performance framing.",
      lastUpdated: "2026-02-18",
      status: "approved",
      canEdit: true,
    },
    {
      id: "mgmt-cfo",
      name: "CFO Management Review",
      description: "Finance-led management review with cash, P&L, and forecast sections.",
      lastUpdated: "2026-03-01",
      status: "approved",
      canEdit: true,
    },
    {
      id: "mgmt-coo",
      name: "COO Management Review",
      description: "Operations delivery, capacity, and execution risk summary.",
      lastUpdated: "2026-02-27",
      status: "approved",
      canEdit: true,
    },
    {
      id: "mgmt-cto",
      name: "CTO Management Review",
      description: "Technology roadmap, platform health, and engineering priorities.",
      lastUpdated: "2026-03-05",
      status: "approved",
      canEdit: true,
    },
    {
      id: "mgmt-cro",
      name: "CRO Management Review",
      description: "Commercial pipeline, win/loss, and revenue motion update.",
      lastUpdated: "2026-03-04",
      status: "approved",
      canEdit: true,
    },
    {
      id: "mgmt-weekly",
      name: "Weekly Management Presentation",
      description: "Short-form weekly management committee pack.",
      lastUpdated: "2026-03-10",
      status: "approved",
      canEdit: true,
    },
    {
      id: "mgmt-monthly",
      name: "Monthly Management Review",
      description: "Monthly business review with cross-functional KPIs.",
      lastUpdated: "2026-02-28",
      status: "approved",
      canEdit: true,
    },
  ],
  sales: [
    {
      id: "sales-client-proposal",
      name: "Client Proposal",
      description: "Approved client proposal structure with scope, pricing, and delivery.",
      lastUpdated: "2026-01-22",
      status: "approved",
      canEdit: false,
    },
    {
      id: "sales-pitch",
      name: "Sales Pitch Deck",
      description: "Standard company sales narrative for first meetings.",
      lastUpdated: "2026-02-14",
      status: "approved",
      canEdit: false,
    },
  ],
  marketing: [
    {
      id: "mkt-brochure",
      name: "Company Brochure",
      description: "Approved company overview brochure layout.",
      lastUpdated: "2026-01-30",
      status: "approved",
      canEdit: false,
    },
    {
      id: "mkt-one-pager",
      name: "Product One-Pager",
      description: "Single-page product summary for campaigns.",
      lastUpdated: "2026-02-08",
      status: "review",
      canEdit: false,
    },
  ],
  corporate: [
    {
      id: "corp-company",
      name: "Company Presentation",
      description: "Master company story for internal and external audiences.",
      lastUpdated: "2026-02-20",
      status: "approved",
      canEdit: true,
    },
  ],
  engineering: [
    {
      id: "eng-status",
      name: "Engineering Status Review",
      description: "Programme status, risks, and milestone summary.",
      lastUpdated: "2026-03-06",
      status: "approved",
      canEdit: false,
    },
  ],
  finance: [
    {
      id: "fin-review",
      name: "Financial Review Deck",
      description: "Standard finance review for management audiences.",
      lastUpdated: "2026-02-25",
      status: "approved",
      canEdit: true,
    },
  ],
};

export function getContentStudioTemplates(functionId: string): ContentStudioTemplatePlaceholder[] {
  return TEMPLATE_LIBRARY[functionId] ?? [
    {
      id: `${functionId}-starter`,
      name: `${functionId.charAt(0).toUpperCase()}${functionId.slice(1)} starter template`,
      description: "Placeholder template shell — approved layouts will be added in a future release.",
      lastUpdated: "2026-03-01",
      status: "draft",
      canEdit: false,
    },
  ];
}
