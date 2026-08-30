import type { SaecDiscoveryState } from "@/lib/saec-discovery/types";

export const SAEC_DISCOVERY_STORAGE_KEY = "saec-discovery-v3";

export type SaecDiscoveryDraftEnvelope = {
  ownerId: string;
  savedAt?: number;
  state: SaecDiscoveryState;
};

/** Browser draft key — scoped per authenticated user when ownerId is provided. */
export function saecDiscoveryDraftStorageKey(ownerId: string | null | undefined): string {
  const trimmed = ownerId?.trim();
  if (!trimmed) return SAEC_DISCOVERY_STORAGE_KEY;
  return `${SAEC_DISCOVERY_STORAGE_KEY}:${trimmed}`;
}

export function parseStoredDiscoveryDraftRaw(
  raw: string | null,
  ownerId: string | null | undefined,
): { state: SaecDiscoveryState; savedAt: number | null } {
  if (!raw) {
    return { state: {}, savedAt: null };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return { state: {}, savedAt: null };
    }

    const record = parsed as Record<string, unknown>;
    if (record.state && typeof record.state === "object" && typeof record.ownerId === "string") {
      if (ownerId && record.ownerId !== ownerId) {
        return { state: {}, savedAt: null };
      }
      return {
        state: normalizeDiscoveryResponses(record.state),
        savedAt: typeof record.savedAt === "number" ? record.savedAt : null,
      };
    }

    if (ownerId) {
      return { state: {}, savedAt: null };
    }

    return {
      state: normalizeDiscoveryResponses(parsed),
      savedAt: null,
    };
  } catch {
    return { state: {}, savedAt: null };
  }
}

export function readStoredDiscoveryDraft(
  ownerId: string | null | undefined,
): { state: SaecDiscoveryState; savedAt: number | null } {
  if (typeof window === "undefined") {
    return { state: {}, savedAt: null };
  }

  const raw = window.localStorage.getItem(saecDiscoveryDraftStorageKey(ownerId));
  return parseStoredDiscoveryDraftRaw(raw, ownerId);
}

export function writeStoredDiscoveryDraft(
  ownerId: string | null | undefined,
  state: SaecDiscoveryState,
  savedAt?: number | null,
): void {
  const storageKey = saecDiscoveryDraftStorageKey(ownerId);
  if (ownerId) {
    const envelope: SaecDiscoveryDraftEnvelope = {
      ownerId,
      state,
      ...(typeof savedAt === "number" ? { savedAt } : {}),
    };
    window.localStorage.setItem(storageKey, JSON.stringify(envelope));
    return;
  }
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

export function clearStoredDiscoveryDraft(ownerId: string | null | undefined): void {
  window.localStorage.removeItem(saecDiscoveryDraftStorageKey(ownerId));
}

export const SAEC_DISCOVERY_OPTIONAL_PLACEHOLDER = "Your answer";

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

export type SaecDiscoverySoftwareFunction = {
  /** Stable storage key for responses (local draft + Supabase). */
  id: string;
  /** Client-facing label or discovery question. */
  label: string;
  /** Prior keys — values are migrated on read only. */
  legacyKeys?: readonly string[];
};

export type SaecDiscoverySectionConfig = {
  id: string;
  title: string;
  icon: SaecDiscoveryIconKey;
  kind: SaecDiscoverySectionKind;
  intro?: string;
  footer?: string;
  questions?: readonly SaecDiscoveryQuestionConfig[];
  functions?: readonly SaecDiscoverySoftwareFunction[];
  includeComments?: boolean;
};

function fn(
  id: string,
  label: string,
  legacyKeys?: readonly string[],
): SaecDiscoverySoftwareFunction {
  return legacyKeys ? { id, label, legacyKeys } : { id, label };
}

function softwareQuestion(subject: string): string {
  return `What software or system is currently used for ${subject}?`;
}

/** Single source of truth for SAEC Discovery sections and fields. */
export const SAEC_DISCOVERY_SECTIONS: readonly SaecDiscoverySectionConfig[] = [
  {
    id: "general",
    title: "General",
    icon: "FileText",
    kind: "general",
    intro:
      "Any information you can provide would be great, but don't worry if you can't or don't have time to answer everything.",
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
    functions: [
      fn("Client Directory", "Client Directory"),
      fn("Contacts", "Contacts"),
      fn("Onboarding", "Onboarding"),
      fn("Account Management", "Account Management"),
    ],
  },
  {
    id: "sales-management",
    title: "Sales Management",
    icon: "ShoppingCart",
    kind: "software",
    functions: [
      fn("Pipeline", "Pipeline"),
      fn("Sales Quotes", "Sales Quotes"),
      fn("Sales Targets & Forecast", "Sales Targets & Forecast"),
      fn("Sales Team Performance", "Sales Team Performance"),
    ],
  },
  {
    id: "finances",
    title: "Finances",
    icon: "Calculator",
    kind: "software",
    functions: [
      fn("General Ledger", "General Ledger"),
      fn("Invoicing", "Invoicing"),
      fn("Accounts Payable", "Accounts Payable"),
      fn("Accounts Receivable", "Accounts Receivable"),
      fn("Expenses", "Expenses"),
      fn("Payroll", "Payroll"),
    ],
  },
  {
    id: "operations",
    title: "Operations",
    icon: "Layers",
    kind: "software",
    functions: [
      fn("Asset Management", "Asset Management"),
      fn("Inventory", "Inventory"),
      fn("Stock Control", "Stock Control"),
      fn("Logistics", "Logistics"),
      fn("Procurement", "Procurement"),
    ],
  },
  {
    id: "marketing-events",
    title: "Marketing & Events",
    icon: "Megaphone",
    kind: "software",
    functions: [
      fn("Events", "Events"),
      fn("Email Marketing", "Email Marketing"),
      fn("Social Media", "Social Media"),
      fn("Mailing Lists", "Mailing Lists"),
    ],
  },
  {
    id: "tech-management",
    title: "Tech Management",
    icon: "Settings2",
    kind: "software",
    functions: [
      fn("IT Assets", "IT Assets"),
      fn("Software & Licenses", "Software & Licenses"),
      fn("Telecoms", "Telecoms"),
    ],
  },
  {
    id: "human-resources",
    title: "Human Resources",
    icon: "Briefcase",
    kind: "software",
    functions: [
      fn("Employee Records", "Employee Records"),
      fn("Recruitment", "Recruitment"),
      fn("Time & Attendance", "Time & Attendance"),
      fn("Payroll", "Payroll"),
      fn("Leave Management", "Leave Management"),
      fn("Performance", "Performance"),
    ],
  },
  {
    id: "business-productivity",
    title: "Business Productivity",
    icon: "MessageSquare",
    kind: "software",
    functions: [
      fn("Email", "Email"),
      fn("Calendar", "Calendar"),
      fn("File Storage", "File Storage"),
      fn("Messaging", "Messaging"),
      fn("Video Meetings", "Video Meetings"),
      fn("Content Studio", "Content Studio"),
    ],
  },
  {
    id: "support",
    title: "Support",
    icon: "Headphones",
    kind: "software",
    functions: [
      fn("Ticket Tracking", "Ticket Tracking"),
      fn("Service Requests", "Service Requests"),
      fn("Helpdesk", "Helpdesk"),
      fn("Customer Communication", "Customer Communication"),
    ],
  },
  {
    id: "project-management",
    title: "Project Management",
    icon: "FolderKanban",
    kind: "software",
    functions: [
      fn("Projects", softwareQuestion("managing projects")),
      fn("Tasks", softwareQuestion("managing tasks")),
      fn("Timelines", softwareQuestion("project schedules and timelines")),
      fn("Resource Planning", softwareQuestion("resource planning and capacity")),
      fn("Milestones", softwareQuestion("milestones and delivery tracking")),
    ],
  },
  {
    id: "engineering",
    title: "Engineering",
    icon: "HardHat",
    kind: "software",
    functions: [
      fn("Technical Files", softwareQuestion("technical files and technical records")),
      fn("Programs", softwareQuestion("engineering programmes and engineering work")),
      fn("Design Documentation", softwareQuestion("design documentation")),
      fn("Change Control", softwareQuestion("engineering change control and revisions")),
    ],
  },
  {
    id: "training",
    title: "Training",
    icon: "GraduationCap",
    kind: "software",
    functions: [
      fn("Training Records", softwareQuestion("training records"), ["Courses"]),
      fn("Training Requirements", softwareQuestion("training requirements"), ["Compliance Training"]),
      fn("Training Planning", softwareQuestion("training planning")),
      fn("Training Delivery", softwareQuestion("training delivery"), ["Staff Training"]),
      fn("Competency Tracking", softwareQuestion("competency tracking"), ["Certifications"]),
    ],
  },
  {
    id: "qms",
    title: "QMS",
    icon: "ShieldCheck",
    kind: "software",
    functions: [
      fn("Quality Records", softwareQuestion("quality records")),
      fn("Document Control", softwareQuestion("document control")),
      fn("Non-Conformance", softwareQuestion("non-conformances")),
      fn("CAPA", softwareQuestion("corrective and preventive actions")),
      fn("Quality Audits", softwareQuestion("quality audits")),
      fn("Quality Procedures", softwareQuestion("quality procedures"), ["Compliance Reporting"]),
    ],
  },
  {
    id: "reporting",
    title: "Reporting",
    icon: "BarChart2",
    kind: "reporting",
    questions: [
      {
        id: "regular-reports",
        label: "What regular reports do you currently receive or produce?",
      },
      {
        id: "difficult-to-produce",
        label:
          "Which reports or reporting processes are particularly difficult or time-consuming?",
      },
      {
        id: "immediate-information",
        label: "What information would you most like to be able to see immediately?",
      },
      {
        id: "duplicate-reports",
        label:
          "Are there reports or spreadsheets being produced separately by different departments that contain overlapping information?",
      },
      {
        id: "untrusted-reports",
        label:
          "Are there any reports that you don't fully trust or that are difficult to reconcile?",
      },
      {
        id: "automatic-reports",
        label: "What reports would be most useful if they were produced automatically?",
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
  const keys = [...(section.functions ?? []).map((entry) => entry.id)];
  if (sectionIncludesComments(section)) keys.push(SAEC_DISCOVERY_COMMENTS_KEY);
  return keys;
}

function migrateLegacySoftwareResponses(
  section: SaecDiscoverySectionConfig,
  responsesRaw: Record<string, unknown>,
  responses: Record<string, string>,
): void {
  for (const entry of section.functions ?? []) {
    if (responses[entry.id]?.trim()) continue;
    for (const legacyKey of entry.legacyKeys ?? []) {
      const legacyValue = responsesRaw[legacyKey];
      if (typeof legacyValue === "string" && legacyValue.trim()) {
        responses[entry.id] = legacyValue;
        break;
      }
    }
  }
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
      if (section.kind === "software") {
        migrateLegacySoftwareResponses(section, responsesRaw, responses);
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
