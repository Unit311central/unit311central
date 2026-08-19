/**
 * EA acceptance coverage matrix — maps workspaces/modules/functions to capabilities and tests.
 */

import { listPlatformModules } from "@/lib/ai-operating-assistant/application-catalogue";
import { listSemanticCapabilities } from "@/lib/central-application-model/registry";
import { getWorkspaceEnablement } from "@/lib/central-application-model/workspace-enablement";
import type { EaSemanticCapabilityBinding } from "@/lib/central-application-model/types";

import { buildAllAcceptanceScenarios } from "./scenarios";
import { EA_ACCEPTANCE_WORKSPACES } from "./workspace-context";

export type CoverageStatus =
  | "COVERED_SEMANTIC"
  | "COVERED_ACCEPTANCE"
  | "NO_SEMANTIC_CAPABILITY"
  | "NO_ACCEPTANCE_SCENARIO"
  | "MODULE_DISABLED"
  | "WORKSPACE_NA";

export type FunctionCoverageRow = {
  workspaceSlug: string;
  moduleId: string;
  moduleLabel: string;
  functionId: string;
  functionLabel: string;
  capabilityId: string | null;
  tool: string | null;
  deterministic: boolean;
  supportsChart: boolean;
  supportsPdf: boolean;
  supportsGpt: boolean;
  acceptanceScenarios: number;
  status: CoverageStatus;
  notes?: string;
};

export type WorkspaceCoverageSummary = {
  workspaceSlug: string;
  enabledModules: number;
  semanticCapabilities: number;
  acceptanceScenarios: number;
  coveredFunctions: number;
  uncoveredFunctions: number;
  rows: FunctionCoverageRow[];
};

export type EaCoverageReport = {
  generatedAt: string;
  workspaces: WorkspaceCoverageSummary[];
  totals: {
    capabilities: number;
    acceptanceScenarios: number;
    covered: number;
    uncovered: number;
    demoOnlyBankQuestions: number;
  };
  gaps: Array<{
    workspaceSlug: string;
    moduleId: string;
    functionLabel: string;
    issue: string;
  }>;
};

function capabilityEnabledInWorkspace(
  cap: EaSemanticCapabilityBinding,
  workspaceSlug: string,
  enabledModuleIds: Set<string>,
): boolean {
  if (cap.workspaceAllowList?.length) {
    const slug = workspaceSlug.toLowerCase();
    const allowed = cap.workspaceAllowList.some(
      (row) => slug.includes(row.toLowerCase()) || row.toLowerCase().includes(slug),
    );
    if (!allowed) return false;
  }
  if (cap.requiredModules?.length) {
    return cap.requiredModules.every((mod) => enabledModuleIds.has(mod));
  }
  return true;
}

function collectModuleFunctions(workspaceSlug: string): Array<{
  moduleId: string;
  moduleLabel: string;
  functionId: string;
  functionLabel: string;
}> {
  const out: Array<{
    moduleId: string;
    moduleLabel: string;
    functionId: string;
    functionLabel: string;
  }> = [];

  for (const module of listPlatformModules({ workspaceSlug })) {
    for (const app of module.applications) {
      if (app.pages.length) {
        for (const page of app.pages) {
          out.push({
            moduleId: module.id,
            moduleLabel: module.displayName,
            functionId: page.viewId ?? `${module.id}-${page.label}`,
            functionLabel: page.label,
          });
        }
      } else {
        out.push({
          moduleId: module.id,
          moduleLabel: module.displayName,
          functionId: app.viewId ?? `${module.id}-${app.label}`,
          functionLabel: app.label,
        });
      }
    }
  }

  return out;
}

function capMatchesFunction(
  cap: EaSemanticCapabilityBinding,
  moduleId: string,
  functionLabel: string,
): boolean {
  if (!cap.moduleIds.includes(moduleId)) return false;
  const label = functionLabel.toLowerCase();
  const tokens = [
    cap.entity,
    cap.domainId,
    ...(cap.keywords ?? []),
  ]
    .filter(Boolean)
    .map((t) => String(t).toLowerCase());
  return tokens.some((token) => label.includes(token) || token.includes(label.split(" ")[0] ?? ""));
}

export function buildEaCoverageMatrix(input?: {
  demoBankQuestionCount?: number;
}): EaCoverageReport {
  const generatedAt = new Date().toISOString();
  const allCaps = listSemanticCapabilities();
  const workspaces: WorkspaceCoverageSummary[] = [];
  const gaps: EaCoverageReport["gaps"] = [];
  let totalCovered = 0;
  let totalUncovered = 0;
  let totalScenarios = 0;

  for (const workspaceSlug of EA_ACCEPTANCE_WORKSPACES) {
    const enablement = getWorkspaceEnablement(workspaceSlug);
    const scenarios = buildAllAcceptanceScenarios(workspaceSlug);
    totalScenarios += scenarios.length;

    const scenarioByCap = new Map<string, number>();
    for (const scenario of scenarios) {
      if (scenario.expectCapabilityId) {
        scenarioByCap.set(
          scenario.expectCapabilityId,
          (scenarioByCap.get(scenario.expectCapabilityId) ?? 0) + 1,
        );
      }
    }

    const enabledCaps = allCaps.filter((cap) =>
      capabilityEnabledInWorkspace(cap, workspaceSlug, enablement.enabledModuleIds),
    );

    const rows: FunctionCoverageRow[] = [];
    const functions = collectModuleFunctions(workspaceSlug);

    for (const fn of functions) {
      if (!enablement.enabledModuleIds.has(fn.moduleId) && fn.moduleId !== "home") {
        rows.push({
          workspaceSlug,
          moduleId: fn.moduleId,
          moduleLabel: fn.moduleLabel,
          functionId: fn.functionId,
          functionLabel: fn.functionLabel,
          capabilityId: null,
          tool: null,
          deterministic: false,
          supportsChart: false,
          supportsPdf: false,
          supportsGpt: false,
          acceptanceScenarios: 0,
          status: "MODULE_DISABLED",
        });
        continue;
      }

      const cap =
        enabledCaps.find((row) => capMatchesFunction(row, fn.moduleId, fn.functionLabel)) ??
        enabledCaps.find((row) => row.moduleIds.includes(fn.moduleId) && row.entity);

      const scenarioCount = cap ? scenarioByCap.get(cap.id) ?? 0 : 0;
      let status: CoverageStatus = "NO_SEMANTIC_CAPABILITY";
      if (cap && scenarioCount > 0) status = "COVERED_ACCEPTANCE";
      else if (cap) status = "COVERED_SEMANTIC";
      else status = "NO_SEMANTIC_CAPABILITY";

      if (status === "NO_SEMANTIC_CAPABILITY") {
        totalUncovered += 1;
        gaps.push({
          workspaceSlug,
          moduleId: fn.moduleId,
          functionLabel: fn.functionLabel,
          issue: "NO_SEMANTIC_CAPABILITY",
        });
      } else {
        totalCovered += 1;
      }

      if (cap && scenarioCount === 0) {
        gaps.push({
          workspaceSlug,
          moduleId: fn.moduleId,
          functionLabel: fn.functionLabel,
          issue: "NO_ACCEPTANCE_SCENARIO",
        });
      }

      rows.push({
        workspaceSlug,
        moduleId: fn.moduleId,
        moduleLabel: fn.moduleLabel,
        functionId: fn.functionId,
        functionLabel: fn.functionLabel,
        capabilityId: cap?.id ?? null,
        tool: cap?.tool ?? cap?.actionId ?? null,
        deterministic: cap?.deterministic ?? false,
        supportsChart: Boolean(cap?.supportsVisualisation),
        supportsPdf: Boolean(cap?.supportsReporting),
        supportsGpt: cap?.executionStrategy === "reasoning_required" || cap?.kind === "composite",
        acceptanceScenarios: scenarioCount,
        status,
      });
    }

    workspaces.push({
      workspaceSlug,
      enabledModules: enablement.enabledModuleIds.size,
      semanticCapabilities: enabledCaps.length,
      acceptanceScenarios: scenarios.length,
      coveredFunctions: rows.filter((r) => r.status !== "NO_SEMANTIC_CAPABILITY").length,
      uncoveredFunctions: rows.filter((r) => r.status === "NO_SEMANTIC_CAPABILITY").length,
      rows,
    });
  }

  return {
    generatedAt,
    workspaces,
    totals: {
      capabilities: allCaps.length,
      acceptanceScenarios: totalScenarios,
      covered: totalCovered,
      uncovered: totalUncovered,
      demoOnlyBankQuestions: input?.demoBankQuestionCount ?? 0,
    },
    gaps: gaps.slice(0, 200),
  };
}

export function formatCoverageReportMarkdown(report: EaCoverageReport): string {
  const lines: string[] = [
    `# EA Acceptance Coverage Report`,
    ``,
    `Generated: ${report.generatedAt}`,
    ``,
    `## Summary`,
    `- Semantic capabilities registered: **${report.totals.capabilities}**`,
    `- Acceptance scenarios (all workspaces): **${report.totals.acceptanceScenarios}**`,
    `- Nav functions with semantic coverage: **${report.totals.covered}**`,
    `- Nav functions without semantic coverage: **${report.totals.uncovered}**`,
    `- Demo-only 577-question bank: **${report.totals.demoOnlyBankQuestions}** questions (other workspaces not covered by this bank)`,
    ``,
  ];

  for (const ws of report.workspaces) {
    lines.push(`## ${ws.workspaceSlug}`);
    lines.push(
      `- Enabled modules: ${ws.enabledModules} · Semantic caps: ${ws.semanticCapabilities} · Acceptance scenarios: ${ws.acceptanceScenarios}`,
    );
    lines.push(
      `- Functions covered: ${ws.coveredFunctions} · Uncovered: ${ws.uncoveredFunctions}`,
    );
    lines.push(``);
    lines.push(`| Module | Function | Capability | Tool | Scenarios | Status |`);
    lines.push(`| --- | --- | --- | --- | --- | --- |`);
    for (const row of ws.rows.filter((r) => r.status === "NO_SEMANTIC_CAPABILITY").slice(0, 25)) {
      lines.push(
        `| ${row.moduleLabel} | ${row.functionLabel} | — | — | ${row.acceptanceScenarios} | ${row.status} |`,
      );
    }
    if (ws.uncoveredFunctions > 25) {
      lines.push(`| … | … | … | … | … | +${ws.uncoveredFunctions - 25} more uncovered |`);
    }
    lines.push(``);
  }

  lines.push(`## Top coverage gaps`);
  for (const gap of report.gaps.slice(0, 40)) {
    lines.push(`- **${gap.workspaceSlug}** / ${gap.moduleId} / ${gap.functionLabel}: ${gap.issue}`);
  }

  return lines.join("\n");
}
