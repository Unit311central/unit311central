import type {
  Unit311SupportCategory,
  Unit311SupportSeverity,
  Unit311SupportStatus,
} from "@/lib/unit311-support/types";

export const UNIT311_SUPPORT_VIEW = "unit311-support" as const;
export const UNIT311_PLATFORM_SUPPORT_VIEW = "unit311-platform-support" as const;

export const CLIENT_PLATFORM_ALWAYS_VIEWS = new Set<string>([UNIT311_SUPPORT_VIEW]);

export const UNIT311_SUPPORT_CATEGORIES: readonly {
  value: Unit311SupportCategory;
  label: string;
}[] = [
  { value: "platform_problem", label: "Platform problem" },
  { value: "account_user", label: "Account / user problem" },
  { value: "data_problem", label: "Data problem" },
  { value: "integration_problem", label: "Integration problem" },
  { value: "configuration_help", label: "Configuration help" },
  { value: "how_do_i", label: "How do I...?" },
  { value: "billing", label: "Billing" },
  { value: "security_concern", label: "Security concern" },
  { value: "other", label: "Other" },
];

export const UNIT311_SUPPORT_STATUSES: Unit311SupportStatus[] = [
  "open",
  "in_progress",
  "awaiting_customer",
  "resolved",
  "closed",
];

export const UNIT311_SUPPORT_STATUS_LABELS: Record<Unit311SupportStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  awaiting_customer: "Awaiting Your Response",
  resolved: "Resolved",
  closed: "Closed",
};

export const UNIT311_SUPPORT_INTERNAL_STATUS_LABELS: Record<Unit311SupportStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  awaiting_customer: "Awaiting Customer",
  resolved: "Resolved",
  closed: "Closed",
};

export const UNIT311_SUPPORT_SEVERITIES: Unit311SupportSeverity[] = [
  "p1",
  "p2",
  "p3",
  "p4",
];

export const UNIT311_SUPPORT_SEVERITY_LABELS: Record<Unit311SupportSeverity, string> = {
  p1: "P1 Critical",
  p2: "P2 High",
  p3: "P3 Medium",
  p4: "P4 Low",
};

export function unit311SupportCategoryLabel(value: string): string {
  return (
    UNIT311_SUPPORT_CATEGORIES.find((item) => item.value === value)?.label ??
    value.replace(/_/g, " ")
  );
}

export function unit311SupportStatusLabel(
  value: Unit311SupportStatus,
  audience: "customer" | "internal" = "customer",
): string {
  return audience === "internal"
    ? UNIT311_SUPPORT_INTERNAL_STATUS_LABELS[value]
    : UNIT311_SUPPORT_STATUS_LABELS[value];
}

export function unit311SupportSeverityLabel(value: Unit311SupportSeverity | null | undefined) {
  if (!value) return "Unassigned";
  return UNIT311_SUPPORT_SEVERITY_LABELS[value];
}

export function severityBadgeClass(value: Unit311SupportSeverity | null | undefined): string {
  switch (value) {
    case "p1":
      return "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300";
    case "p2":
      return "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300";
    case "p3":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300";
    case "p4":
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    default:
      return "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400";
  }
}

export function statusBadgeClass(value: Unit311SupportStatus): string {
  switch (value) {
    case "open":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300";
    case "in_progress":
      return "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300";
    case "awaiting_customer":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300";
    case "resolved":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300";
    case "closed":
      return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

/** Module options derived from central product catalogue labels. */
export const UNIT311_SUPPORT_MODULE_OPTIONS: readonly string[] = [
  "Business Central",
  "Intelligence",
  "Financials",
  "Fundraising",
  "Board",
  "Corporate Information",
  "Operations",
  "Marketing & Events",
  "Technology Management",
  "Human Resources",
  "Business Productivity",
  "Support Desk",
  "Project Management",
  "Engineering",
  "Training",
  "QMS",
  "Tools",
  "External Client Access",
  "Settings",
  "Other / Unsure",
];
