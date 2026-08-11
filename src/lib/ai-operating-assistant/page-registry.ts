import type { InternalOperationsView } from "@/lib/internal-operations-data";
import { internalViewTitles } from "@/lib/internal-operations-data";

/**
 * AI Guided Learning — page metadata registry.
 * Pages expose structured UI knowledge so the Operating Assistant can teach
 * interactively (no static help pages / tutorials).
 */

export type AiUiTargetKind =
  | "kpi"
  | "button"
  | "table"
  | "chart"
  | "form"
  | "filter"
  | "nav"
  | "panel"
  | "workflow"
  | "permission";

export type AiUiTarget = {
  id: string;
  label: string;
  kind: AiUiTargetKind;
  /** Prefer data-ai-target; selector is fallback. */
  selector?: string;
  explanation: string;
  relatedActions?: string[];
};

export type AiPageGuide = {
  viewId: string;
  pageName: string;
  purpose: string;
  kpis: string[];
  buttons: string[];
  actions: string[];
  tables: string[];
  charts: string[];
  forms: string[];
  workflows: string[];
  permissions: string[];
  relationships: string[];
  commonQuestions: string[];
  targets: AiUiTarget[];
};

function baseTargets(viewId: string): AiUiTarget[] {
  return [
    {
      id: "platform-nav",
      label: "Platform navigation",
      kind: "nav",
      selector: '[data-ai-target="platform-nav"]',
      explanation:
        "Use the left sidebar to move between workspace modules. Your current page stays highlighted.",
      relatedActions: ["Open another module", "Return home"],
    },
    {
      id: "page-header",
      label: "Page header",
      kind: "panel",
      selector: '[data-ai-target="page-header"]',
      explanation: `You are on ${internalViewTitles[viewId as InternalOperationsView]?.title ?? viewId}. The header shows where you are in the platform.`,
    },
    {
      id: "page-main",
      label: "Main workspace",
      kind: "panel",
      selector: '[data-ai-target="page-main"]',
      explanation:
        "This is the main working area for the module — tables, KPIs, forms, and workflows live here.",
    },
    {
      id: "ai-assistant",
      label: "Executive Assistant",
      kind: "button",
      selector: '[data-ai-target="ai-assistant"]',
      explanation:
        "Open me anytime for guided tours, explanations, and live business questions. I already know this page.",
      relatedActions: ["Show Me Around", "Ask about this page"],
    },
  ];
}

function guide(
  viewId: InternalOperationsView | string,
  partial: Omit<AiPageGuide, "viewId" | "pageName" | "targets"> & {
    targets?: AiUiTarget[];
  },
): AiPageGuide {
  const title =
    isInternalView(viewId) && internalViewTitles[viewId]
      ? internalViewTitles[viewId].title
      : String(viewId);
  return {
    viewId,
    pageName: title,
    ...partial,
    targets: [...baseTargets(viewId), ...(partial.targets ?? [])],
  };
}

function isInternalView(viewId: string): viewId is InternalOperationsView {
  return viewId in internalViewTitles;
}

type ModuleGuideHint = {
  purpose: string;
  kpis: string[];
  workflows: string[];
  commonQuestions: string[];
  relationships: string[];
};

const MODULE_GUIDE_HINTS: Record<string, ModuleGuideHint> = {
  Financials: {
    purpose: "Financial operations — ledgers, AR/AP, expenses, and reporting.",
    kpis: ["Cash position", "Receivables", "Payables", "Opex"],
    workflows: ["Review dashboard", "Chase overdue invoices", "Log expenses"],
    commonQuestions: ["What is our cash position?", "Which invoices are overdue?", "How do I log an expense?"],
    relationships: ["Board pack", "Corporate Information", "Projects"],
  },
  Board: {
    purpose: "Board governance — meetings, actions, risks, and approved packs.",
    kpis: ["Next meeting", "Open actions", "High risks"],
    workflows: ["Prepare board pack", "Close overdue actions", "Review risk register"],
    commonQuestions: ["When is the next board meeting?", "What actions are overdue?", "What are the top risks?"],
    relationships: ["Fundraising", "Financials", "Engineering"],
  },
  Fundraising: {
    purpose: "Investor pipeline, meetings, pitch decks, and data rooms for active raises.",
    kpis: ["Pipeline value", "Open deals", "Seed target progress"],
    workflows: ["Work investor pipeline", "Schedule investor meetings", "Share data room"],
    commonQuestions: ["Where are we on the seed raise?", "Who is in diligence?", "Update pipeline stage"],
    relationships: ["Board", "Corporate cap table", "OnwardAir Intelligence"],
  },
  "Support Desk": {
    purpose: "Support ticket queue, analytics, and client issue resolution.",
    kpis: ["Open tickets", "Queue time", "Resolution rate"],
    workflows: ["Triage tickets", "Assign owner", "Close resolved tickets"],
    commonQuestions: ["How many open tickets?", "Create a support ticket", "Show my tickets"],
    relationships: ["Clients", "External Client Access"],
  },
  Engineering: {
    purpose: "OnwardAir engineering programmes — VTOL, FLEX Pod, risks, and assurance.",
    kpis: ["Programme RAG", "Milestones", "Open risks", "Supply watch"],
    workflows: ["Review programme status", "Track milestones", "Mitigate risks"],
    commonQuestions: ["Which milestones are at risk?", "Log an engineering risk", "Programme status"],
    relationships: ["Board", "QMS", "Project Management"],
  },
  "OnwardAir Intelligence": {
    purpose: "Competitive intelligence and executive landscape monitoring.",
    kpis: ["Weekly brief", "Watch list", "Certification signals"],
    workflows: ["Scan weekly intel", "Brief leadership", "Update watch list"],
    commonQuestions: ["Who is closest to certification?", "Summarise competitors", "Latest intel brief"],
    relationships: ["Fundraising narrative", "Board strategic discussion"],
  },
};

const DEFAULT_MODULE_HINT: ModuleGuideHint = {
  purpose: "Workspace module for day-to-day operations in this area.",
  kpis: ["Module KPIs when present"],
  workflows: ["Use controls in the main panel", "Ask the Assistant for a tour"],
  commonQuestions: ["What is this page for?", "Show me around", "What should I do here?"],
  relationships: ["Related modules via sidebar navigation"],
};

const AUTO_PAGE_GUIDES = new Map<string, AiPageGuide>();

function buildAutoPageGuide(viewId: InternalOperationsView): AiPageGuide {
  const cached = AUTO_PAGE_GUIDES.get(viewId);
  if (cached) return cached;

  const meta = internalViewTitles[viewId];
  const hint = MODULE_GUIDE_HINTS[meta.subtitle] ?? DEFAULT_MODULE_HINT;
  const built = guide(viewId, {
    purpose: `${meta.title} — ${hint.purpose}`,
    kpis: hint.kpis,
    buttons: ["Primary actions in the main panel", "Filters and search when available"],
    actions: ["Use module controls", "Ask the Executive Assistant"],
    tables: meta.title.includes("Dashboard") ? [`${meta.title} summary`] : [`${meta.subtitle} tables`],
    charts: meta.title.includes("Dashboard") ? [`${meta.title} charts`] : [],
    forms: [`${meta.title} forms when present`],
    workflows: hint.workflows,
    permissions: ["Subject to your role view and module grants"],
    relationships: hint.relationships,
    commonQuestions: hint.commonQuestions,
  });
  AUTO_PAGE_GUIDES.set(viewId, built);
  return built;
}

const PAGE_GUIDES: Record<string, AiPageGuide> = {
  home: guide("home", {
    purpose:
      "Command centre for executive overview — tiles for revenue, projects, pipeline, and actions.",
    kpis: ["Revenue overview", "Projects in progress", "Pipeline by region", "Action required"],
    buttons: ["Customise tiles", "Role view", "Open AI Assistant"],
    actions: ["Reorder dashboard tiles", "Drill into a module from a tile"],
    tables: ["Projects in progress", "CRM leads", "Outstanding invoices"],
    charts: ["Revenue overview", "Pipeline by region", "Support tickets trend"],
    forms: [],
    workflows: ["Scan priorities", "Open a module from a tile", "Ask AI for a briefing"],
    permissions: ["Staff may see fewer financial tiles depending on role view"],
    relationships: ["Tiles deep-link into Clients, CRM, Projects, Finance, HR, Support"],
    commonQuestions: [
      "What needs attention today?",
      "What does this KPI mean?",
      "How do I customise this dashboard?",
    ],
    targets: [
      {
        id: "home-tiles",
        label: "Dashboard tiles",
        kind: "kpi",
        selector: '[data-ai-target="home-tiles"]',
        explanation:
          "Each tile is a live snapshot. Click through to the full module when you need detail.",
      },
      {
        id: "home-customize",
        label: "Customise layout",
        kind: "button",
        selector: '[data-ai-target="home-customize"]',
        explanation: "Reorder or hide tiles so the command centre matches how you work.",
      },
    ],
  }),
  clients: guide("clients", {
    purpose: "Client directory — accounts, contacts, contract type, and account health.",
    kpis: ["Active clients", "Prospects", "Clients with active projects"],
    buttons: ["Add client", "Edit client", "Open files folder"],
    actions: ["Create client", "Update status", "Open related projects"],
    tables: ["Client list / directory table"],
    charts: [],
    forms: ["Client create/edit form"],
    workflows: ["Find a client", "Update account status", "Open client files"],
    permissions: ["All internal roles can view; sensitive finance links may be restricted"],
    relationships: ["Projects", "Files", "CRM", "Contracts (contract type on client)"],
    commonQuestions: [
      "How many active clients do we have?",
      "How do I create a client?",
      "Where do I upload a contract?",
    ],
    targets: [
      {
        id: "clients-table",
        label: "Client table",
        kind: "table",
        selector: '[data-ai-target="clients-table"]',
        explanation: "Browse and select clients here. Selecting a client personalises my answers.",
      },
      {
        id: "clients-add",
        label: "Add client",
        kind: "button",
        selector: '[data-ai-target="clients-add"]',
        explanation: "Start the create-client flow. I’ll confirm before any write actions.",
      },
      {
        id: "clients-filters",
        label: "Filters / search",
        kind: "filter",
        selector: '[data-ai-target="clients-filters"]',
        explanation: "Filter by status, region, or search to narrow the directory.",
      },
    ],
  }),
  crm: guide("crm", {
    purpose: "Pipeline and lead tracking from first touch to close.",
    kpis: ["Hot leads", "Open pipeline value", "Leads by status"],
    buttons: ["Add lead", "Update status", "Open connections"],
    actions: ["Qualify lead", "Log next action", "Mark won/lost"],
    tables: ["Leads table"],
    charts: ["Pipeline stages"],
    forms: ["Lead form"],
    workflows: ["Work the pipeline", "Set next actions", "Hand off to clients"],
    permissions: ["Available to most operators"],
    relationships: ["Clients", "Potential clients", "Communications"],
    commonQuestions: [
      "What is in the hot pipeline?",
      "How do I update a lead?",
      "What does this status mean?",
    ],
    targets: [
      {
        id: "crm-table",
        label: "Leads table",
        kind: "table",
        selector: '[data-ai-target="crm-table"]',
        explanation: "Each row is an opportunity. Status and next action drive follow-up.",
      },
      {
        id: "crm-add",
        label: "Add lead",
        kind: "button",
        selector: '[data-ai-target="crm-add"]',
        explanation: "Capture a new opportunity into the pipeline.",
      },
    ],
  }),
  projects: guide("projects", {
    purpose: "Plan and track live and upcoming client projects.",
    kpis: ["Live projects", "Upcoming projects", "Progress %"],
    buttons: ["Create project", "Open project detail"],
    actions: ["Create project", "Track progress", "Review overdue end dates"],
    tables: ["Projects list"],
    charts: ["Progress indicators"],
    forms: ["Project create form"],
    workflows: ["Select a project", "Review delivery", "Link to client"],
    permissions: ["Available broadly; financial drill-downs may be restricted"],
    relationships: ["Clients", "Files", "Logistics", "Tasks"],
    commonQuestions: [
      "Which projects are overdue?",
      "How do I create a project?",
      "What does progress mean here?",
    ],
    targets: [
      {
        id: "projects-table",
        label: "Projects table",
        kind: "table",
        selector: '[data-ai-target="projects-table"]',
        explanation: "Select a project to focus delivery questions and follow-ups.",
      },
      {
        id: "projects-add",
        label: "Create project",
        kind: "button",
        selector: '[data-ai-target="projects-add"]',
        explanation: "Starts project creation. Writes require your confirmation.",
      },
    ],
  }),
  hr: guide("hr", {
    purpose: "Employee records, roles, and leave balances.",
    kpis: ["Headcount", "Vacation remaining", "Open roles (careers)"],
    buttons: ["Add employee", "Edit employee", "Open documents"],
    actions: ["Create employee", "Update leave balances", "Review compensation (permitted roles)"],
    tables: ["Employee directory"],
    charts: [],
    forms: ["Employee form"],
    workflows: ["Find an employee", "Check leave balance", "Open careers"],
    permissions: ["Hidden for Staff role view"],
    relationships: ["Careers", "Files", "Users"],
    commonQuestions: [
      "Who is on leave?",
      "How do I add an employee?",
      "What does vacation remaining mean?",
    ],
    targets: [
      {
        id: "hr-table",
        label: "Employee table",
        kind: "table",
        selector: '[data-ai-target="hr-table"]',
        explanation: "People records live here. Selecting an employee personalises my answers.",
      },
    ],
  }),
  financials: guide("financials", {
    purpose: "Financial overview across debtors, creditors, and expenses.",
    kpis: ["Cash / outstanding", "Overdue receivables", "Expense totals"],
    buttons: ["Open debtors", "Open creditors", "Open expenses"],
    actions: ["Review overdue invoices", "Approve expenses (where enabled)"],
    tables: ["Ledger / overview tables"],
    charts: ["Aging charts"],
    forms: [],
    workflows: ["Review overview", "Drill into AR/AP", "Ask AI for a finance summary"],
    permissions: ["Hidden for Staff role view"],
    relationships: ["Debtors", "Creditors", "Expenses", "Clients"],
    commonQuestions: [
      "Which invoices are overdue?",
      "What does this KPI mean?",
      "How do I get to expenses?",
    ],
    targets: [
      {
        id: "finance-kpis",
        label: "Finance KPIs",
        kind: "kpi",
        selector: '[data-ai-target="finance-kpis"]',
        explanation: "High-level money signals. Drill into Debtors/Creditors/Expenses for detail.",
      },
    ],
  }),
  "files-internal": guide("files-internal", {
    purpose: "Internal file repository for documents and folders.",
    kpis: [],
    buttons: ["Upload", "New folder", "Download"],
    actions: ["Upload contract", "Organise folders", "Share/download files"],
    tables: ["File browser"],
    charts: [],
    forms: ["Upload form"],
    workflows: ["Find a document", "Upload a contract", "Ask AI to summarise a file"],
    permissions: ["Internal operators"],
    relationships: ["Clients folders", "Company Details", "Projects"],
    commonQuestions: [
      "Where do I upload a contract?",
      "How do I find a document?",
      "Can you summarise this file?",
    ],
    targets: [
      {
        id: "files-browser",
        label: "File browser",
        kind: "table",
        selector: '[data-ai-target="files-browser"]',
        explanation: "Browse folders and files. Select a file so I can explain or summarise it.",
      },
      {
        id: "files-upload",
        label: "Upload",
        kind: "button",
        selector: '[data-ai-target="files-upload"]',
        explanation: "Upload contracts and documents into the current folder.",
      },
    ],
  }),
  "quality-management": guide("quality-management", {
    purpose: "QMS modules for document control, CAPA, audits, and quality workflows.",
    kpis: ["Open CAPAs", "Audit readiness signals"],
    buttons: ["Open QMS module tiles"],
    actions: ["Navigate QMS areas", "Open related training"],
    tables: [],
    charts: [],
    forms: [],
    workflows: ["Open a QMS area", "Ask about ISO / quality docs in Files"],
    permissions: ["Available to operators"],
    relationships: ["QMS Training", "Files", "Company Details"],
    commonQuestions: ["What is QMS here?", "Where are controlled documents?", "How do I find ISO 13485 docs?"],
    targets: [
      {
        id: "qms-modules",
        label: "QMS modules",
        kind: "panel",
        selector: '[data-ai-target="qms-modules"]',
        explanation: "Each tile opens a quality management area. Start here for controlled processes.",
      },
    ],
  }),
  "fundraising-dashboard": guide("fundraising-dashboard", {
    purpose: "Fundraising command centre — seed raise progress, pipeline, and investor activity.",
    kpis: ["Capital committed", "Seed target", "Active pipeline", "Meetings scheduled"],
    buttons: ["Open pipeline", "Investors", "Pitch decks", "Data rooms"],
    actions: ["Review pipeline stage", "Schedule investor meeting", "Share data room"],
    tables: ["Pipeline deals", "Investor list", "Upcoming meetings"],
    charts: ["Raise progress", "Pipeline by stage"],
    forms: [],
    workflows: ["Track seed raise", "Move deal stage", "Prepare for diligence"],
    permissions: ["Executive and board roles"],
    relationships: ["Board", "Corporate Information cap table", "Financials"],
    commonQuestions: [
      "Where are we on the seed raise?",
      "Who is in diligence?",
      "What meetings are coming up?",
    ],
  }),
  "oa-engineering-overview": guide("oa-engineering-overview", {
    purpose: "Engineering programme overview — Vertex VTOL, FLEX Pod, milestones, and certification path.",
    kpis: ["Programme RAG", "Milestones at risk", "Team utilisation", "Supply at risk"],
    buttons: ["Programs & Milestones", "Team & Capacity", "Engineering Risks"],
    actions: ["Review milestone slip", "Check assurance evidence", "Escalate supply risk"],
    tables: ["Programmes", "Milestones", "Risks"],
    charts: ["Programme progress", "Capacity utilisation"],
    forms: [],
    workflows: ["Track certification gates", "Review engineering risks", "Plan sprint capacity"],
    permissions: ["Engineering and executive roles"],
    relationships: ["Project Management", "Operations supply", "Board risk register"],
    commonQuestions: [
      "Which programmes are amber or red?",
      "What is the next certification gate?",
      "Which milestones are at risk?",
    ],
  }),
  "oa-competitor-intelligence": guide("oa-competitor-intelligence", {
    purpose: "Competitive landscape — eVTOL programmes, certification status, and market signals.",
    kpis: ["Priority watch list", "Certification leaders", "Weekly intel feed"],
    buttons: ["Filter competitors", "Open intel feed", "Export summary"],
    actions: ["Compare certification paths", "Review competitor funding", "Mark intel read"],
    tables: ["Competitor profiles", "Intel feed"],
    charts: [],
    forms: [],
    workflows: ["Scan weekly intel", "Brief board on landscape", "Update watch list"],
    permissions: ["Executive and strategy roles"],
    relationships: ["OnwardAir Intelligence", "Board strategic discussion", "Fundraising narrative"],
    commonQuestions: [
      "Who is closest to certification?",
      "What changed in the competitive landscape?",
      "How do we compare to Joby?",
    ],
  }),
  "board-dashboard": guide("board-dashboard", {
    purpose: "Board governance hub — meetings, actions, risk register, and approved packs.",
    kpis: ["Next board meeting", "Open actions", "High risks", "Seed / cash snapshot"],
    buttons: ["Meetings", "Risk register", "Board decks", "Minutes"],
    actions: ["Review open actions", "Prepare board pack", "Track risk mitigation"],
    tables: ["Open actions", "Risk register", "Recent decisions"],
    charts: ["Financial snapshot tiles"],
    forms: [],
    workflows: ["Prepare for board meeting", "Close overdue actions", "Review risk register"],
    permissions: ["Board and executive roles"],
    relationships: ["Fundraising", "Financials", "Engineering", "Executive Assistant board pack"],
    commonQuestions: [
      "When is the next board meeting?",
      "What actions are overdue?",
      "What are the top board risks?",
    ],
  }),
  "client-portal": guide("client-portal", {
    purpose: "External client portal — read-only access to shared project materials and updates.",
    kpis: ["Shared documents", "Project status", "Support requests"],
    buttons: ["Open Assistant", "Navigate portal sections"],
    actions: ["Ask about shared content", "Request help via support channels"],
    tables: ["Portal content sections when present"],
    charts: [],
    forms: [],
    workflows: ["Browse shared materials", "Ask the portal assistant"],
    permissions: ["External client access only — no internal write actions"],
    relationships: ["Support Desk", "Project delivery teams"],
    commonQuestions: [
      "What can I see in this portal?",
      "How do I get help?",
      "Where are my shared files?",
    ],
  }),
  "executive-assistant": guide("executive-assistant", {
    purpose: "Full-page AI Executive Assistant — conversations, tours, and live tools.",
    kpis: [],
    buttons: ["New conversation", "Show Me Around", "Settings"],
    actions: ["Ask business questions", "Start a page tour", "Generate reports"],
    tables: ["Recent conversations"],
    charts: [],
    forms: ["Chat composer"],
    workflows: ["Ask → tool call → answer → follow-up actions"],
    permissions: ["Uses your role permissions for finance/HR tools"],
    relationships: ["Every module via tools and guided learning"],
    commonQuestions: [
      "Show me around this page",
      "How do I create a project?",
      "Summarise CRM",
    ],
    targets: [
      {
        id: "ea-chat",
        label: "Conversation",
        kind: "form",
        selector: '[data-ai-target="ea-chat"]',
        explanation: "Ask anything about the platform. I use live tools — I don’t invent business data.",
      },
      {
        id: "ea-tour",
        label: "Show Me Around",
        kind: "button",
        selector: '[data-ai-target="ea-tour"]',
        explanation: "Starts an interactive walkthrough of the current page’s UI.",
      },
    ],
  }),
};

/** Fallback guide for views without a specialised entry. */
export function getPageGuide(viewId: string | null | undefined): AiPageGuide {
  const id = viewId?.trim() || "home";
  if (PAGE_GUIDES[id]) return PAGE_GUIDES[id];
  if (isInternalView(id)) return buildAutoPageGuide(id);

  const title = id;

  return guide(id, {
    purpose: `${title} workspace module.`,
    kpis: [],
    buttons: ["Module actions in the main panel"],
    actions: ["Use module controls", "Ask the AI about this page"],
    tables: ["Module tables when present"],
    charts: ["Module charts when present"],
    forms: ["Module forms when present"],
    workflows: ["Work in the main panel", "Ask AI for a guided tour"],
    permissions: ["Subject to your role view"],
    relationships: ["Related modules via sidebar navigation"],
    commonQuestions: [
      "What is this page for?",
      "Show me around",
      "What should I do here?",
    ],
  });
}

export function listRegisteredPageGuides(): AiPageGuide[] {
  const handWritten = Object.values(PAGE_GUIDES);
  const auto = (Object.keys(internalViewTitles) as InternalOperationsView[])
    .filter((viewId) => !PAGE_GUIDES[viewId])
    .map((viewId) => buildAutoPageGuide(viewId));
  return [...handWritten, ...auto];
}

export function findPageTarget(viewId: string, targetId: string): AiUiTarget | null {
  const guide = getPageGuide(viewId);
  return guide.targets.find((target) => target.id === targetId) ?? null;
}

export function buildTourSteps(viewId: string) {
  const page = getPageGuide(viewId);
  return page.targets.map((target, index) => ({
    index,
    targetId: target.id,
    label: target.label,
    kind: target.kind,
    explanation: target.explanation,
    relatedActions: target.relatedActions ?? [],
  }));
}
