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
    workspaceSpecific.push({
      id: `${slug}-members`,
      prompt: "How many members do we have?",
      kind: "data",
      workspaceSlug: slug,
      moduleLabel: "business-central",
    });
  }

  const semantic = buildSemanticAcceptanceScenarios(slug);
  const byId = new Map<string, EaAcceptanceScenario>();
  for (const row of [...shared, ...workspaceSpecific, ...semantic]) {
    byId.set(row.id, row);
  }
  return [...byId.values()];
}
