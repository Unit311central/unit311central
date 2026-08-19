import { listSemanticCapabilities } from "@/lib/central-application-model/registry";
import { assertModulesEnabled } from "@/lib/central-application-model/workspace-enablement";

import type { EaAcceptanceQuestionKind, EaAcceptanceScenario } from "./types";

const PROMPT_OVERRIDES: Record<string, string> = {
  "reports.scopedPdf.generate": "Create a PDF with P&L, cash position, and payroll for the last 6 months.",
  "crm.pipeline.summary.read": "What is our CRM pipeline value?",
  "finance.invoices.overdue.read": "List overdue invoices.",
  "hr.employees.search.read": "List all employees.",
  "hr.employees.count.read": "How many employees do we have?",
  "hr.employees.growth.read": "Show employee growth as a chart.",
  "crm.clients.count.read": "How many clients do we have?",
  "project-management.projects.count.read": "How many projects do we have?",
  "cross.clients.overdueInvoicesOpenTickets.read":
    "Which customers have overdue invoices and open support tickets?",
  "content.templates.list": "List Content Studio templates.",
  "content.deck.create": "Create a weekly management deck in Content Studio.",
  "funds.summary.read": "How is capital deployment performing?",
  "portfolio.companies.summary.read": "Summarise portfolio companies.",
  "abhi.members.count.read": "How many members do we have?",
};

function promptFromCapability(cap: {
  id: string;
  keywords: string[];
  phrases?: string[];
}): string {
  const override = PROMPT_OVERRIDES[cap.id];
  if (override) return override;

  const keyword = cap.keywords[0] ?? cap.phrases?.[0];
  if (!keyword) return "What is the status?";
  if (/^(how|what|show|list|give|create|summari)/i.test(keyword)) {
    return keyword.endsWith("?") ? keyword : `${keyword}?`;
  }
  return `What is our ${keyword}?`;
}

function kindForCapability(cap: {
  supportsReporting?: boolean;
  supportsVisualisation?: boolean;
  kind: string;
  executionStrategy: string;
}): EaAcceptanceQuestionKind {
  if (cap.supportsReporting) return "pdf";
  if (cap.supportsVisualisation) return "chart";
  if (cap.executionStrategy === "multi_tool" || cap.kind === "composite") return "composite";
  return "data";
}

export function buildSemanticAcceptanceScenarios(workspaceSlug: string): EaAcceptanceScenario[] {
  const scenarios: EaAcceptanceScenario[] = [];

  for (const cap of listSemanticCapabilities()) {
    if (cap.workspaceAllowList?.length) {
      const allowed = cap.workspaceAllowList.some((slug) =>
        workspaceSlug.toLowerCase().includes(slug.toLowerCase()),
      );
      if (!allowed) continue;
    }

    if (cap.requiredModules?.length) {
      const enabled = assertModulesEnabled(cap.requiredModules, workspaceSlug);
      if (!enabled.ok) continue;
    }

    scenarios.push({
      id: `semantic-${workspaceSlug}-${cap.id}`,
      prompt: promptFromCapability(cap),
      kind: kindForCapability(cap),
      workspaceSlug,
      moduleLabel: cap.moduleIds[0],
    });
  }

  return scenarios;
}

export function buildMandatoryAcceptanceScenarios(workspaceSlug: string): EaAcceptanceScenario[] {
  const slug = workspaceSlug.trim().toLowerCase();
  const shared: EaAcceptanceScenario[] = [
    {
      id: `${slug}-bank-balance`,
      prompt: "What is our bank balance?",
      kind: "data",
      workspaceSlug: slug,
      expectCapabilityId: "financials.cashPosition.read",
      expectDeterministic: true,
      moduleLabel: "financials",
    },
    {
      id: `${slug}-headcount`,
      prompt: "How many employees do we have?",
      kind: "data",
      workspaceSlug: slug,
      expectCapabilityId: "hr.employees.count.read",
      expectDeterministic: true,
      moduleLabel: "human-resources",
    },
    {
      id: `${slug}-cross-workspace-denied`,
      prompt: `What is the bank balance in ${
        slug.includes("talanton") ? "OnwardAir" : "Talanton"
      }?`,
      kind: "denied",
      workspaceSlug: slug,
      moduleLabel: "security",
    },
  ];

  const workspaceSpecific: EaAcceptanceScenario[] = [];
  if (slug.includes("talanton")) {
    workspaceSpecific.push({
      id: `${slug}-funds`,
      prompt: "How is capital deployment performing?",
      kind: "data",
      workspaceSlug: slug,
      moduleLabel: "fundraising",
    });
  }
  if (slug.includes("onwardair")) {
    workspaceSpecific.push({
      id: `${slug}-employee-growth-chart`,
      prompt: "Give me a graph of staff growth year by year in all locations.",
      kind: "chart",
      workspaceSlug: slug,
      expectCapabilityId: "hr.employees.growth.read",
      expectDeterministic: true,
      moduleLabel: "human-resources",
    });
  }
  if (slug.includes("abhi")) {
    workspaceSpecific.push(
      {
        id: `${slug}-members`,
        prompt: "How many members do we have?",
        kind: "data",
        workspaceSlug: slug,
        expectCapabilityId: "abhi.members.count.read",
        expectDeterministic: true,
        moduleLabel: "business-central",
      },
      {
        id: `${slug}-membership-count`,
        prompt: "What's our membership count?",
        kind: "data",
        workspaceSlug: slug,
        expectCapabilityId: "abhi.members.count.read",
        expectDeterministic: true,
        moduleLabel: "business-central",
      },
    );
  }

  const semantic = buildSemanticAcceptanceScenarios(slug);
  const byId = new Map<string, EaAcceptanceScenario>();
  for (const row of [...shared, ...workspaceSpecific, ...semantic]) {
    byId.set(row.id, row);
  }
  return [...byId.values()];
}

function buildNlVariationScenarios(workspaceSlug: string): EaAcceptanceScenario[] {
  const slug = workspaceSlug.trim().toLowerCase();
  const rows: EaAcceptanceScenario[] = [
    {
      id: `${slug}-cash-synonym-1`,
      prompt: "How much cash do we have?",
      kind: "data",
      workspaceSlug: slug,
      expectCapabilityId: "financials.cashPosition.read",
      expectDeterministic: true,
      moduleLabel: "financials",
    },
    {
      id: `${slug}-cash-synonym-2`,
      prompt: "What's in the bank?",
      kind: "data",
      workspaceSlug: slug,
      expectCapabilityId: "financials.cashPosition.read",
      expectDeterministic: true,
      moduleLabel: "financials",
    },
    {
      id: `${slug}-headcount-typo`,
      prompt: "how many emploassd do we have?",
      kind: "data",
      workspaceSlug: slug,
      expectCapabilityId: "hr.employees.count.read",
      expectDeterministic: true,
      moduleLabel: "human-resources",
    },
  ];
  return rows;
}

function buildCrossModuleScenarios(workspaceSlug: string): EaAcceptanceScenario[] {
  const slug = workspaceSlug.trim().toLowerCase();
  return [
    {
      id: `${slug}-cross-invoices-tickets`,
      prompt: "Which customers have overdue invoices and open support tickets?",
      kind: "composite",
      workspaceSlug: slug,
      expectCapabilityId: "cross.clients.overdueInvoicesOpenTickets.read",
      moduleLabel: "cross-module",
    },
    {
      id: `${slug}-strategic-burn`,
      prompt: "How can we reduce burn rate?",
      kind: "composite",
      workspaceSlug: slug,
      moduleLabel: "strategy",
    },
    {
      id: `${slug}-strategic-revenue`,
      prompt: "How can we increase monthly revenue?",
      kind: "composite",
      workspaceSlug: slug,
      moduleLabel: "strategy",
    },
    {
      id: `${slug}-cross-sales-revenue`,
      prompt: "How are sales affecting revenue?",
      kind: "composite",
      workspaceSlug: slug,
      moduleLabel: "cross-module",
    },
    {
      id: `${slug}-cross-clients-owe-support`,
      prompt: "Which clients owe us money and have open support issues?",
      kind: "composite",
      workspaceSlug: slug,
      expectCapabilityId: "cross.clients.overdueInvoicesOpenTickets.read",
      moduleLabel: "cross-module",
    },
  ];
}

function buildChartPdfScenarios(workspaceSlug: string): EaAcceptanceScenario[] {
  const slug = workspaceSlug.trim().toLowerCase();
  return [
    {
      id: `${slug}-chart-employee-growth`,
      prompt: "Show employee growth.",
      kind: "chart",
      workspaceSlug: slug,
      expectCapabilityId: "hr.employees.growth.read",
      moduleLabel: "human-resources",
    },
    {
      id: `${slug}-chart-revenue-12m`,
      prompt: "Show revenue for the last 12 months as a graph.",
      kind: "chart",
      workspaceSlug: slug,
      expectCapabilityId: "financials.chart.revenue.read",
      moduleLabel: "financials",
    },
    {
      id: `${slug}-chart-revenue-expenses`,
      prompt: "Graph revenue versus expenses.",
      kind: "chart",
      workspaceSlug: slug,
      expectCapabilityId: "financials.chart.revenueVsExpenses.read",
      moduleLabel: "financials",
    },
    {
      id: `${slug}-chart-cash-year`,
      prompt: "Show our cash position over the last year.",
      kind: "chart",
      workspaceSlug: slug,
      expectCapabilityId: "financials.chart.cash.read",
      moduleLabel: "financials",
    },
    {
      id: `${slug}-pdf-financial`,
      prompt: "Create a monthly financial report PDF with P&L and cash.",
      kind: "pdf",
      workspaceSlug: slug,
      expectCapabilityId: "reports.scopedPdf.generate",
      moduleLabel: "financials",
    },
    {
      id: `${slug}-pdf-revenue-expenses`,
      prompt: "Create a PDF showing revenue and expenses.",
      kind: "pdf",
      workspaceSlug: slug,
      expectCapabilityId: "reports.scopedPdf.generate",
      moduleLabel: "financials",
    },
    {
      id: `${slug}-pdf-financial-position`,
      prompt: "Create a financial position PDF.",
      kind: "pdf",
      workspaceSlug: slug,
      expectCapabilityId: "reports.scopedPdf.generate",
      moduleLabel: "financials",
    },
    {
      id: `${slug}-pdf-ar-report`,
      prompt: "Create an AR report.",
      kind: "pdf",
      workspaceSlug: slug,
      expectCapabilityId: "reports.scopedPdf.generate",
      moduleLabel: "financials",
    },
    {
      id: `${slug}-pdf-executive-summary`,
      prompt: "Create an executive financial summary.",
      kind: "pdf",
      workspaceSlug: slug,
      expectCapabilityId: "reports.scopedPdf.generate",
      moduleLabel: "financials",
    },
  ];
}

function buildPermissionScenarios(workspaceSlug: string): EaAcceptanceScenario[] {
  const slug = workspaceSlug.trim().toLowerCase();
  if (slug !== "demo" && !slug.includes("demo")) return [];
  return [
    {
      id: `${slug}-perm-sales-commissions-denied`,
      prompt: "Show me everyone's commissions.",
      kind: "denied",
      workspaceSlug: slug,
      permissionProfile: "sales_rep",
      moduleLabel: "permissions",
    },
    {
      id: `${slug}-perm-employee-cash-denied`,
      prompt: "Show me company cash balance.",
      kind: "denied",
      workspaceSlug: slug,
      permissionProfile: "employee",
      moduleLabel: "permissions",
    },
    {
      id: `${slug}-perm-demo-talanton-clients-denied`,
      prompt: "Show me Talanton's clients.",
      kind: "denied",
      workspaceSlug: slug,
      permissionProfile: "executive",
      moduleLabel: "permissions",
    },
  ];
}

function buildActionScenarios(workspaceSlug: string): EaAcceptanceScenario[] {
  const slug = workspaceSlug.trim().toLowerCase();
  if (slug !== "demo" && !slug.includes("demo")) return [];
  return [
    {
      id: `${slug}-action-create-client-dry`,
      prompt: "Create a client called EA Acceptance Test Co.",
      kind: "action",
      workspaceSlug: slug,
      permissionProfile: "executive",
      moduleLabel: "actions",
    },
  ];
}

function buildClarificationScenarios(workspaceSlug: string): EaAcceptanceScenario[] {
  const slug = workspaceSlug.trim().toLowerCase();
  return [
    {
      id: `${slug}-clarify-performance`,
      prompt: "Show me performance.",
      kind: "clarification",
      workspaceSlug: slug,
      moduleLabel: "executive-assistant",
    },
    {
      id: `${slug}-clarify-how-doing`,
      prompt: "How are we doing?",
      kind: "clarification",
      workspaceSlug: slug,
      moduleLabel: "executive-assistant",
    },
    {
      id: `${slug}-clarify-situation`,
      prompt: "What is the situation?",
      kind: "clarification",
      workspaceSlug: slug,
      moduleLabel: "executive-assistant",
    },
    {
      id: `${slug}-no-clarify-bank`,
      prompt: "What is our bank balance?",
      kind: "data",
      workspaceSlug: slug,
      expectCapabilityId: "financials.cashPosition.read",
      expectDeterministic: true,
      moduleLabel: "financials",
    },
  ];
}

export function buildAllAcceptanceScenarios(workspaceSlug: string): EaAcceptanceScenario[] {
  const byId = new Map<string, EaAcceptanceScenario>();
  for (const row of [
    ...buildMandatoryAcceptanceScenarios(workspaceSlug),
    ...buildNlVariationScenarios(workspaceSlug),
    ...buildCrossModuleScenarios(workspaceSlug),
    ...buildChartPdfScenarios(workspaceSlug),
    ...buildClarificationScenarios(workspaceSlug),
    ...buildPermissionScenarios(workspaceSlug),
    ...buildActionScenarios(workspaceSlug),
  ]) {
    byId.set(row.id, row);
  }
  return [...byId.values()];
}
