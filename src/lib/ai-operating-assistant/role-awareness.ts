import type { InternalRoleView } from "@/lib/internal-role-views";

import type { ExecutiveInsight, InsightCategory, WorkflowDefinition } from "./executive-types";

/**
 * Role awareness — tailor insights, briefs, and workflow recommendations.
 */

export type ExecutivePersona = "ceo" | "hr" | "project_manager" | "finance" | "operator";

export type RoleFocusProfile = {
  persona: ExecutivePersona;
  label: string;
  focusCategories: InsightCategory[];
  priorityHint: string;
};

export function resolveExecutivePersona(
  roleView: string | null | undefined,
  displayName?: string | null,
): ExecutivePersona {
  const name = (displayName ?? "").toLowerCase();
  if (name.includes("hr") || name.includes("people")) return "hr";
  if (name.includes("finance") || name.includes("cfo")) return "finance";
  if (name.includes("project") || name.includes("pm")) return "project_manager";

  const role = (roleView ?? "c-suite") as InternalRoleView;
  if (role === "c-suite" || role === "admin") return "ceo";
  if (role === "manager") return "project_manager";
  return "operator";
}

export function getRoleFocusProfile(persona: ExecutivePersona): RoleFocusProfile {
  switch (persona) {
    case "ceo":
      return {
        persona,
        label: "CEO / Executive",
        focusCategories: ["projects", "finance", "crm", "operations", "hr", "compliance"],
        priorityHint: "Executive summary, risks, and financial overview first.",
      };
    case "hr":
      return {
        persona,
        label: "HR Manager",
        focusCategories: ["hr", "recruitment", "compliance", "operations"],
        priorityHint: "Employees, recruitment, leave, and training first.",
      };
    case "project_manager":
      return {
        persona,
        label: "Project Manager",
        focusCategories: ["projects", "operations", "clients", "crm"],
        priorityHint: "Projects, capacity, and deadlines first.",
      };
    case "finance":
      return {
        persona,
        label: "Finance",
        focusCategories: ["finance", "contracts", "clients", "operations"],
        priorityHint: "Invoices, payments, and expenses first.",
      };
    default:
      return {
        persona: "operator",
        label: "Operator",
        focusCategories: ["operations", "projects", "crm", "clients"],
        priorityHint: "Day-to-day operational risks and tasks first.",
      };
  }
}

const SEVERITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function filterInsightsForRole(
  insights: ExecutiveInsight[],
  persona: ExecutivePersona,
  limit = 12,
): ExecutiveInsight[] {
  const focus = new Set(getRoleFocusProfile(persona).focusCategories);
  return [...insights]
    .sort((a, b) => {
      const aFocus = focus.has(a.category) ? 0 : 1;
      const bFocus = focus.has(b.category) ? 0 : 1;
      if (aFocus !== bFocus) return aFocus - bFocus;
      return (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9);
    })
    .slice(0, limit);
}

export function filterWorkflowsForRole(
  workflows: WorkflowDefinition[],
  persona: ExecutivePersona,
): WorkflowDefinition[] {
  return workflows.filter(
    (workflow) =>
      workflow.roles.includes("any") ||
      workflow.roles.includes(persona) ||
      (persona === "ceo" && workflow.roles.includes("ceo")),
  );
}
