import type { InternalRoleView } from "@/lib/internal-role-views";

import type { ExecutiveInsight, InsightCategory, WorkflowDefinition } from "./executive-types";

/**
 * Role awareness — tailor insights, briefs, and workflow recommendations.
 * Go-live personas: CEO, CFO, COO, Head of Sales, Head of Engineering, CTO.
 */

export type ExecutivePersona =
  | "ceo"
  | "cfo"
  | "coo"
  | "sales"
  | "engineering"
  | "cto"
  | "hr"
  /** @deprecated mapped to cfo */
  | "finance"
  /** @deprecated mapped to coo/engineering */
  | "project_manager"
  /** @deprecated mapped to sales */
  | "operator";

export type RoleFocusProfile = {
  persona: ExecutivePersona;
  label: string;
  focusCategories: InsightCategory[];
  priorityHint: string;
  /** Golden question themes this persona expects live answers for. */
  answerDomains: string[];
};

function normalizePersona(persona: ExecutivePersona): ExecutivePersona {
  if (persona === "finance") return "cfo";
  if (persona === "project_manager") return "coo";
  if (persona === "operator") return "sales";
  return persona;
}

export function resolveExecutivePersona(
  roleView: string | null | undefined,
  displayName?: string | null,
  departments?: readonly string[] | null,
): ExecutivePersona {
  const depts = (departments ?? []).map((entry) => entry.toLowerCase());
  const name = (displayName ?? "").toLowerCase();

  if (depts.some((dept) => dept === "finance") || name.includes("cfo") || name.includes("finance")) {
    return "cfo";
  }
  if (depts.some((dept) => dept === "sales") || name.includes("sales") || name.includes("commercial")) {
    return "sales";
  }
  if (
    depts.some((dept) => dept === "engineering") ||
    name.includes("head of engineering") ||
    name.includes("vp engineering")
  ) {
    return "engineering";
  }
  if (
    depts.some((dept) => dept === "technology") ||
    name.includes("cto") ||
    name.includes("chief technology")
  ) {
    return "cto";
  }
  if (
    depts.some((dept) => dept === "operations") ||
    name.includes("coo") ||
    name.includes("chief operating")
  ) {
    return "coo";
  }
  if (depts.some((dept) => dept === "hr") || name.includes("hr") || name.includes("people")) {
    return "hr";
  }
  if (name.includes("ceo") || name.includes("chief executive")) {
    return "ceo";
  }

  const role = (roleView ?? "c-suite") as InternalRoleView;
  if (role === "c-suite" || role === "admin") return "ceo";
  if (role === "manager") return "coo";
  return "sales";
}

export function getRoleFocusProfile(persona: ExecutivePersona): RoleFocusProfile {
  const normalized = normalizePersona(persona);
  switch (normalized) {
    case "ceo":
      return {
        persona: "ceo",
        label: "CEO",
        focusCategories: ["projects", "finance", "crm", "operations", "hr", "compliance"],
        priorityHint: "Decisions, risks, cash, and pipeline first.",
        answerDomains: ["business_summary", "executive_risks", "cash", "pipeline", "projects_at_risk"],
      };
    case "cfo":
      return {
        persona: "cfo",
        label: "CFO",
        focusCategories: ["finance", "contracts", "clients", "operations"],
        priorityHint: "AR, cash, expenses, and burn first.",
        answerDomains: ["overdue_balances", "cash_position", "expenses", "outstanding_invoices"],
      };
    case "coo":
      return {
        persona: "coo",
        label: "COO",
        focusCategories: ["operations", "projects", "clients", "hr"],
        priorityHint: "Delivery risk, overdue work, and capacity first.",
        answerDomains: ["projects_at_risk", "business_summary", "operations"],
      };
    case "sales":
      return {
        persona: "sales",
        label: "Head of Sales",
        focusCategories: ["crm", "clients", "operations"],
        priorityHint: "Pipeline, hot leads, and conversion first.",
        answerDomains: ["sales_opportunities", "crm", "clients"],
      };
    case "engineering":
      return {
        persona: "engineering",
        label: "Head of Engineering",
        focusCategories: ["projects", "operations", "clients"],
        priorityHint: "Delivery status, blockers, and slipping projects first.",
        answerDomains: ["projects_at_risk", "projects", "deadlines"],
      };
    case "cto":
      return {
        persona: "cto",
        label: "CTO",
        focusCategories: ["projects", "operations", "compliance", "finance"],
        priorityHint: "Platform/delivery health and technical blockers first.",
        answerDomains: ["projects_at_risk", "business_health", "platform"],
      };
    case "hr":
      return {
        persona: "hr",
        label: "HR",
        focusCategories: ["hr", "recruitment", "compliance", "operations"],
        priorityHint: "Headcount and people risks first (live directory only).",
        answerDomains: ["employees", "hr"],
      };
    default:
      return {
        persona: "ceo",
        label: "Executive",
        focusCategories: ["projects", "finance", "crm", "operations"],
        priorityHint: "Executive risks and operating status first.",
        answerDomains: ["business_summary"],
      };
  }
}

const SEVERITY_RANK: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function workflowRoleMatches(persona: ExecutivePersona, role: string): boolean {
  const normalized = normalizePersona(persona);
  if (role === "any") return true;
  if (role === normalized) return true;
  if (normalized === "cfo" && (role === "finance" || role === "cfo")) return true;
  if (normalized === "coo" && (role === "project_manager" || role === "coo" || role === "operator")) {
    return true;
  }
  if (normalized === "sales" && (role === "operator" || role === "sales")) return true;
  if (
    (normalized === "engineering" || normalized === "cto") &&
    (role === "project_manager" || role === "engineering" || role === "cto")
  ) {
    return true;
  }
  if (normalized === "ceo" && role === "ceo") return true;
  if (normalized === "hr" && role === "hr") return true;
  return false;
}

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
  return workflows.filter((workflow) =>
    workflow.roles.some((role) => workflowRoleMatches(persona, role)),
  );
}
