import type { SaecDiscoveryState } from "@/lib/saec-discovery/types";

export const SAEC_DISCOVERY_STORAGE_KEY = "saec-discovery-v3";

export const SAEC_DISCOVERY_OPTIONAL_PLACEHOLDER = "Your answer (optional)";

export const SAEC_DISCOVERY_COMMENTS_KEY = "Any other comments";

export type SaecDiscoveryIconKey =
  | "FileText"
  | "Users"
  | "ShoppingCart"
  | "Calculator"
  | "Layers"
  | "Megaphone"
  | "Settings2"
  | "Briefcase"
  | "MessageSquare"
  | "Headphones"
  | "FolderKanban"
  | "HardHat"
  | "GraduationCap"
  | "ShieldCheck"
  | "BarChart2";

export type SaecDiscoveryQuestionConfig = {
  id: string;
  label: string;
  note?: string;
  examples?: readonly string[];
  /** Question 6 — larger answer area with secondary examples. */
  emphasizeAnswer?: boolean;
};

export type SaecDiscoverySectionKind = "general" | "software" | "reporting";

export type SaecDiscoverySectionConfig = {
  id: string;
  title: string;
  icon: SaecDiscoveryIconKey;
  kind: SaecDiscoverySectionKind;
  intro?: string;
  footer?: string;
  questions?: readonly SaecDiscoveryQuestionConfig[];
  functions?: readonly string[];
  includeComments?: boolean;
};

/** Single source of truth for SAEC Discovery sections and fields. */
export const SAEC_DISCOVERY_SECTIONS: readonly SaecDiscoverySectionConfig[] = [
  {
    id: "general",
    title: "General",
    icon: "FileText",
    kind: "general",
    intro:
      "Any information you can provide would be great, but don't worry if you can't or don't have time to answer everything.",
    footer:
      "I know these are a lot of questions, but I think the more information I get now, the better.",
    questions: [
      {
        id: "top-annoyances",
        label: "What are your top annoyances or challenges with your current software?",
      },
      {
        id: "uk-desktop-software",
        label:
          "Could you provide as much detail as possible as to what the UK desktop software does?",
      },
      {
        id: "other-software-systems",
        label:
          "What other software or systems are used across the business, and what do you use each one for?",
      },
      {
        id: "long-term-licences",
        label: "Are there any long-term software licences or contracts you are tied into?",
      },
      {
        id: "yearly-spend",
        label:
          "No pressure to answer if not appropriate, but can you give me an estimate of your current yearly spend on software?",
        note: "(The overall idea is to see whether we can reduce this for you.)",
      },
      {
        id: "desired-capabilities",
        label: "What software capabilities would you like that you don't have today?",
        emphasizeAnswer: true,
        note: "For example:",
        examples: [
          "easier ability to track engineers on the road",
          "proactive selling of upgrades to customers",
          "better understanding of burn rates and cash flow",
          "understanding which clients are actually profitable",
          "more structured / sophisticated sales management tools and pipeline",
          "easier and faster self-service access to regular, standardised financial views",
          "ad hoc financial reports",
        ],
      },
    ],
    includeComments: false,
  },
  {
    id: "client-management",
    title: "Client Management",
    icon: "Users",
    kind: "software",
    functions: ["Client Directory", "Contacts", "Onboarding", "Account Management"],
  },
  {
    id: "sales-management",
    title: "Sales Management",
    icon: "ShoppingCart",
    kind: "software",
    functions: ["Pipeline", "Sales Quotes", "Sales Targets & Forecast", "Sales Team Performance"],
  },
  {
    id: "finances",
    title: "Finances",
    icon: "Calculator",
    kind: "software",
    functions: [
      "General Ledger",
      "Invoicing",
      "Accounts Payable",
      "Accounts Receivable",
      "Expenses",
      "Payroll",
    ],
  },
  {
    id: "operations",
    title: "Operations",
    icon: "Layers",
    kind: "software",
    functions: ["Asset Management", "Inventory", "Stock Control", "Logistics", "Procurement"],
  },
  {
    id: "marketing-events",
    title: "Marketing & Events",
    icon: "Megaphone",
    kind: "software",
    functions: ["Events", "Email Marketing", "Social Media", "Mailing Lists"],
  },
  {
    id: "tech-management",
    title: "Tech Management",
    icon: "Settings2",
    kind: "software",
    functions: ["IT Assets", "Software & Licenses", "Telecoms"],
  },
  {
    id: "human-resources",
    title: "Human Resources",
    icon: "Briefcase",
    kind: "software",
    functions: [
      "Employee Records",
      "Recruitment",
      "Time & Attendance",
      "Payroll",
      "Leave Management",
      "Performance",
    ],
  },
  {
    id: "business-productivity",
    title: "Business Productivity",
    icon: "MessageSquare",
    kind: "software",
    functions: [
      "Email",
      "Calendar",
      "File Storage",
      "Messaging",
      "Video Meetings",
      "Content Studio",
    ],
  },
  {
    id: "support",
    title: "Support",
    icon: "Headphones",
    kind: "software",
    functions: ["Ticket Tracking", "Service Requests", "Helpdesk", "Customer Communication"],
  },
  {
    id: "project-management",
    title: "Project Management",
    icon: "FolderKanban",
    kind: "software",
    functions: ["Projects", "Tasks", "Timelines", "Resource Planning", "Milestones"],
  },
  {
    id: "engineering",
    title: "Engineering",
    icon: "HardHat",
    kind: "software",
    functions: ["Technical Files", "Programs", "Design Documentation", "Change Control"],
  },
  {
    id: "training",
    title: "Training",
    icon: "GraduationCap",
    kind: "software",
    functions: ["Courses", "Certifications", "Staff Training", "Compliance Training"],
  },
  {
    id: "qms",
    title: "QMS",
    icon: "ShieldCheck",
    kind: "software",
    functions: ["Document Control", "Quality Audits", "CAPA", "Compliance Reporting"],
  },
  {
    id: "reporting",
    title: "Reporting",
    icon: "BarChart2",
    kind: "reporting",
    intro:
      "Tell me about the reports and information you need to run SAEC.\n\nDon't worry about being precise — examples of reports, spreadsheets or information you currently receive are useful.",
    questions: [
      {
        id: "regular-reports",
        label: "What regular reports do you currently receive or produce?",
        note: "For example: weekly, monthly or quarterly management reports, financial reports, sales reports, engineering reports, project reports, client reports, etc.",
      },
      {
        id: "how-get-information",
        label: "How do you currently get this information?",
        note: "For example: directly from software, Excel spreadsheets, someone prepares it for you, emailed reports, manually combining information from different systems, etc.",
      },
      {
        id: "untrusted-information",
        label:
          "Is there any information you currently don't trust or can't easily get when you need it?",
      },
      {
        id: "difficult-information",
        label:
          "What information would you like to be able to see quickly that is currently difficult to get?",
      },
      {
        id: "relied-on-reports",
        label: "Are there any reports or spreadsheets that you currently rely on heavily?",
        note: "If so, please tell me what they are used for and, if you know, who prepares them.",
      },
      {
        id: "kpis-anytime",
        label: "Are there any specific numbers or KPIs you would like to have available at any time?",
        note: "For example: revenue, gross margin, cash flow, client profitability, sales pipeline, engineer utilisation, outstanding work, project profitability, costs, etc.",
      },
    ],
    includeComments: true,
  },
] as const;

/** @deprecated Use SAEC_DISCOVERY_SECTIONS — kept for imports migrating from modules naming. */
export const SAEC_DISCOVERY_MODULES = SAEC_DISCOVERY_SECTIONS.filter(
  (section) => section.kind === "software",
);

export function sectionIncludesComments(section: SaecDiscoverySectionConfig): boolean {
  if (section.kind === "general") return false;
  return section.includeComments !== false;
}

export function responseKeysForSection(section: SaecDiscoverySectionConfig): string[] {
  if (section.kind === "general" || section.kind === "reporting") {
    const keys = (section.questions ?? []).map((question) => question.id);
    if (sectionIncludesComments(section)) keys.push(SAEC_DISCOVERY_COMMENTS_KEY);
    return keys;
  }
  const keys = [...(section.functions ?? [])];
  if (sectionIncludesComments(section)) keys.push(SAEC_DISCOVERY_COMMENTS_KEY);
  return keys;
}

export function emptySectionResponses(section: SaecDiscoverySectionConfig): Record<string, string> {
  return Object.fromEntries(responseKeysForSection(section).map((key) => [key, ""]));
}

export function normalizeDiscoveryResponses(raw: unknown): SaecDiscoveryState {
  if (!raw || typeof raw !== "object") return {};
  const input = raw as Record<string, unknown>;
  const normalized: SaecDiscoveryState = {};

  for (const section of SAEC_DISCOVERY_SECTIONS) {
    const sectionRaw = input[section.id];
    const keys = responseKeysForSection(section);
    const responses = emptySectionResponses(section);

    if (sectionRaw && typeof sectionRaw === "object") {
      const sectionState = sectionRaw as Record<string, unknown>;
      const responsesRaw =
        sectionState.responses && typeof sectionState.responses === "object"
          ? (sectionState.responses as Record<string, unknown>)
          : {};
      for (const key of keys) {
        const value = responsesRaw[key];
        responses[key] = typeof value === "string" ? value : "";
      }
      normalized[section.id] = {
        completed: Boolean(sectionState.completed),
        responses,
      };
      continue;
    }

    normalized[section.id] = {
      completed: false,
      responses,
    };
  }

  return normalized;
}

export function buildDiscoverySubmissionSnapshot(
  stored: SaecDiscoveryState,
  selectedSectionId: string | null,
  draft: Record<string, string>,
): SaecDiscoveryState {
  const snapshot = normalizeDiscoveryResponses(stored);

  if (selectedSectionId) {
    const section = SAEC_DISCOVERY_SECTIONS.find((entry) => entry.id === selectedSectionId);
    if (section) {
      const current = snapshot[section.id] ?? {
        completed: false,
        responses: emptySectionResponses(section),
      };
      const keys = responseKeysForSection(section);
      snapshot[section.id] = {
        completed: current.completed,
        responses: Object.fromEntries(
          keys.map((key) => [key, (draft[key] ?? current.responses[key] ?? "").trim()]),
        ),
      };
    }
  }

  return snapshot;
}

export function readSectionAnswer(
  responses: SaecDiscoveryState,
  sectionId: string,
  key: string,
): string {
  return responses[sectionId]?.responses?.[key]?.trim() ?? "";
}

/** @deprecated Use readSectionAnswer */
export function readModuleSoftwareAnswer(
  responses: SaecDiscoveryState,
  moduleId: string,
  functionName: string,
): string {
  return readSectionAnswer(responses, moduleId, functionName);
}

export function discoveryResponsesAreBlank(responses: SaecDiscoveryState): boolean {
  for (const section of SAEC_DISCOVERY_SECTIONS) {
    for (const key of responseKeysForSection(section)) {
      if (readSectionAnswer(responses, section.id, key)) return false;
    }
  }
  return true;
}

export function countAnsweredFields(responses: SaecDiscoveryState): number {
  let count = 0;
  for (const section of SAEC_DISCOVERY_SECTIONS) {
    for (const key of responseKeysForSection(section)) {
      if (readSectionAnswer(responses, section.id, key)) count += 1;
    }
  }
  return count;
}
