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
      return "border-red-400/30 bg-red-500/15 text-red-200";
    case "p2":
      return "border-orange-400/30 bg-orange-500/15 text-orange-200";
    case "p3":
      return "border-amber-400/30 bg-amber-500/15 text-amber-200";
    case "p4":
      return "border-sky-400/30 bg-sky-500/15 text-sky-200";
    default:
      return "border-white/15 bg-white/[0.04] text-white/45";
  }
}

export function statusBadgeClass(value: Unit311SupportStatus): string {
  switch (value) {
    case "open":
      return "border-sky-400/30 bg-sky-500/15 text-sky-200";
    case "in_progress":
      return "border-violet-400/30 bg-violet-500/15 text-violet-200";
    case "awaiting_customer":
      return "border-amber-400/30 bg-amber-500/15 text-amber-200";
    case "resolved":
      return "border-emerald-400/30 bg-emerald-500/15 text-emerald-200";
    case "closed":
      return "border-white/15 bg-white/[0.04] text-white/45";
    default:
      return "border-white/15 bg-white/[0.04] text-white/45";
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
