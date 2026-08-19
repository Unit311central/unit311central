/**
 * Bootstrap read capabilities from existing definitions into central semantic model.
 */

import {
  CENTRAL_READ_CAPABILITIES,
  matchesCashCapability,
  matchesHeadcountCapability,
  matchesScopedPdfCapability,
} from "@/lib/ai-operating-assistant/capabilities/definitions";
import type { EaReadCapabilityDefinition } from "@/lib/ai-operating-assistant/capabilities/types";
import { FUNCTIONAL_DOMAINS } from "../canonical-modules";
import type { EaSemanticCapabilityBinding } from "../types";
import { matchesFinancialChartCapability } from "./chart-capabilities";

const MODULE_MAP: Record<string, string> = {
  financials: "financials",
  "human-resources": "human-resources",
  hr: "human-resources",
  "business-central": "business-central",
  reports: "financials",
  productivity: "business-productivity",
  content: "business-productivity",
};

const DOMAIN_MAP: Record<string, string> = {
  banking: FUNCTIONAL_DOMAINS.cash,
  employees: FUNCTIONAL_DOMAINS.employees,
  "accounts-receivable": FUNCTIONAL_DOMAINS.invoices,
  crm: FUNCTIONAL_DOMAINS.crm,
  reporting: "reporting",
  templates: FUNCTIONAL_DOMAINS.contentStudio,
};

function keywordsFromCapability(cap: EaReadCapabilityDefinition): string[] {
  const keywords = new Set<string>();
  keywords.add(cap.entity.replace(/_/g, " "));
  keywords.add(cap.submodule.replace(/-/g, " "));
  keywords.add(cap.module.replace(/-/g, " "));

  const aliasSamples: Record<string, string[]> = {
    "financials.cashPosition.read": [
      "bank balance",
      "cash balance",
      "cash position",
      "how much cash",
      "money in the bank",
      "treasury balance",
    ],
    "hr.employees.count.read": [
      "how many employees",
      "employee count",
      "headcount",
      "staff count",
      "number of employees",
      "who works here",
    ],
    "hr.employees.search.read": [
      "list employees",
      "find employees",
      "show employees",
      "every employee",
      "employees at",
      "people at",
    ],
    "finance.invoices.overdue.read": [
      "overdue invoices",
      "past due invoices",
      "invoices overdue",
    ],
    "crm.pipeline.summary.read": ["pipeline", "opportunities", "hot leads", "deals"],
    "reports.scopedPdf.generate": ["pdf", "report", "export document"],
  };

  for (const kw of aliasSamples[cap.id] ?? []) keywords.add(kw);
  return [...keywords];
}

export function readCapabilityToSemanticBinding(
  cap: EaReadCapabilityDefinition,
): EaSemanticCapabilityBinding {
  return {
    id: cap.id,
    kind: cap.supportsReporting ? "report" : "read",
    moduleIds: [MODULE_MAP[cap.module] ?? cap.module],
    domainId: DOMAIN_MAP[cap.submodule] ?? cap.submodule,
    functionalAreaId: cap.entity,
    entity: cap.entity,
    description: cap.description,
    keywords: keywordsFromCapability(cap),
    permissions: cap.permissions,
    workspaceAllowList: cap.workspaces === "*" ? undefined : [...cap.workspaces],
    requiredModules: [MODULE_MAP[cap.module] ?? cap.module],
    tool: cap.tool,
    buildArgs: cap.buildArgs,
    executionStrategy: cap.deterministic ? "deterministic" : "tool_then_format",
    deterministic: cap.deterministic,
    skipSynthesis: cap.skipSynthesis,
    formatAnswer: cap.formatAnswer,
    supportsVisualisation: cap.supportsVisualisation,
    supportsReporting: cap.supportsReporting,
    crossModule: cap.crossModule,
  };
}

export function buildReadCapabilityBindings(): EaSemanticCapabilityBinding[] {
  return CENTRAL_READ_CAPABILITIES.map(readCapabilityToSemanticBinding);
}

/** Special matchers that supersede keyword scoring */
export function scoreLegacyReadCapability(
  capId: string,
  rawMessage: string,
): number {
  const wantsPdf = matchesScopedPdfCapability(rawMessage);
  if (capId === "reports.scopedPdf.generate" && wantsPdf) {
    return 100;
  }
  const chartMatch = matchesFinancialChartCapability(rawMessage);
  if (chartMatch && capId === chartMatch.capabilityId) {
    if (wantsPdf) return 0;
    return 100;
  }
  if (capId === "financials.cashPosition.read" && matchesCashCapability(rawMessage)) {
    if (wantsPdf || chartMatch) return 0;
    return 100;
  }
  if (capId === "hr.employees.count.read" && matchesHeadcountCapability(rawMessage)) {
    if (wantsPdf) return 0;
    return 100;
  }
  return 0;
}
