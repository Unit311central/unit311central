import type { SaecDiscoveryState } from "@/lib/saec-discovery/types";

export const SAEC_DISCOVERY_STORAGE_KEY = "saec-discovery-v3";

export type SaecDiscoveryIconKey =
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
  | "ShieldCheck";

export type SaecDiscoveryModuleConfig = {
  id: string;
  title: string;
  icon: SaecDiscoveryIconKey;
  functions: readonly string[];
};

/** Single source of truth for SAEC Discovery module/function definitions. */
export const SAEC_DISCOVERY_MODULES: readonly SaecDiscoveryModuleConfig[] = [
  {
    id: "client-management",
    title: "Client Management",
    icon: "Users",
    functions: ["Client Directory", "Contacts", "Onboarding", "Account Management"],
  },
  {
    id: "sales-management",
    title: "Sales Management",
    icon: "ShoppingCart",
    functions: [
      "Pipeline",
      "Sales Quotes",
      "Sales Targets & Forecast",
      "Sales Team Performance",
    ],
  },
  {
    id: "finances",
    title: "Finances",
    icon: "Calculator",
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
    functions: ["Asset Management", "Inventory", "Stock Control", "Logistics", "Procurement"],
  },
  {
    id: "marketing-events",
    title: "Marketing & Events",
    icon: "Megaphone",
    functions: ["Events", "Email Marketing", "Social Media", "Mailing Lists"],
  },
  {
    id: "tech-management",
    title: "Tech Management",
    icon: "Settings2",
    functions: ["IT Assets", "Software & Licenses", "Telecoms"],
  },
  {
    id: "human-resources",
    title: "Human Resources",
    icon: "Briefcase",
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
    functions: ["Email", "Calendar", "File Storage", "Messaging", "Video Meetings", "Content Studio"],
  },
  {
    id: "support",
    title: "Support",
    icon: "Headphones",
    functions: ["Ticket Tracking", "Service Requests", "Helpdesk", "Customer Communication"],
  },
  {
    id: "project-management",
    title: "Project Management",
    icon: "FolderKanban",
    functions: ["Projects", "Tasks", "Timelines", "Resource Planning", "Milestones"],
  },
  {
    id: "engineering",
    title: "Engineering",
    icon: "HardHat",
    functions: ["Technical Files", "Programs", "Design Documentation", "Change Control"],
  },
  {
    id: "training",
    title: "Training",
    icon: "GraduationCap",
    functions: ["Courses", "Certifications", "Staff Training", "Compliance Training"],
  },
  {
    id: "qms",
    title: "QMS",
    icon: "ShieldCheck",
    functions: ["Document Control", "Quality Audits", "CAPA", "Compliance Reporting"],
  },
] as const;

export function emptyModuleResponses(functions: readonly string[]): Record<string, string> {
  return Object.fromEntries(functions.map((fn) => [fn, ""]));
}

export function normalizeDiscoveryResponses(raw: unknown): SaecDiscoveryState {
  if (!raw || typeof raw !== "object") return {};
  const input = raw as Record<string, unknown>;
  const normalized: SaecDiscoveryState = {};

  for (const module of SAEC_DISCOVERY_MODULES) {
    const moduleRaw = input[module.id];
    if (!moduleRaw || typeof moduleRaw !== "object") {
      normalized[module.id] = {
        completed: false,
        responses: emptyModuleResponses(module.functions),
      };
      continue;
    }

    const moduleState = moduleRaw as Record<string, unknown>;
    const responsesRaw =
      moduleState.responses && typeof moduleState.responses === "object"
        ? (moduleState.responses as Record<string, unknown>)
        : {};
    const responses = emptyModuleResponses(module.functions);
    for (const fn of module.functions) {
      const value = responsesRaw[fn];
      responses[fn] = typeof value === "string" ? value : "";
    }

    normalized[module.id] = {
      completed: Boolean(moduleState.completed),
      responses,
    };
  }

  return normalized;
}

export function buildDiscoverySubmissionSnapshot(
  stored: SaecDiscoveryState,
  selectedModuleId: string | null,
  draft: Record<string, string>,
): SaecDiscoveryState {
  const snapshot = normalizeDiscoveryResponses(stored);

  if (selectedModuleId) {
    const module = SAEC_DISCOVERY_MODULES.find((entry) => entry.id === selectedModuleId);
    if (module) {
      const current = snapshot[module.id] ?? {
        completed: false,
        responses: emptyModuleResponses(module.functions),
      };
      snapshot[module.id] = {
        completed: current.completed,
        responses: Object.fromEntries(
          module.functions.map((fn) => [fn, (draft[fn] ?? current.responses[fn] ?? "").trim()]),
        ),
      };
    }
  }

  return snapshot;
}

export function readModuleSoftwareAnswer(
  responses: SaecDiscoveryState,
  moduleId: string,
  functionName: string,
): string {
  return responses[moduleId]?.responses?.[functionName]?.trim() ?? "";
}
