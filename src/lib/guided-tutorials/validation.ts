import { getWorkspaceEnablement, resetWorkspaceEnablementCacheForTests } from "@/lib/central-application-model/workspace-enablement";
import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { ONWARDAIR_SLUG } from "@/lib/onwardair-surface";
import { ABHI_SLUG } from "@/lib/abhi-surface";
import { TALANTON_IMPACT_SLUG } from "@/lib/talanton-surface";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";
import { listTutorialDefinitions } from "@/lib/guided-tutorials/registry";
import { resolveTutorial } from "@/lib/guided-tutorials/resolver";
import type {
  TutorialCoverageReport,
  TutorialDefinition,
  TutorialValidationIssue,
} from "@/lib/guided-tutorials/types";

const VALIDATION_WORKSPACE_SLUGS = [
  INTERNAL_WORKSPACE_SLUG,
  DEMO_WORKSPACE_SLUG,
  ONWARDAIR_SLUG,
  ABHI_SLUG,
  TALANTON_IMPACT_SLUG,
] as const;

function validateTutorialDefinition(tutorial: TutorialDefinition): TutorialValidationIssue[] {
  const issues: TutorialValidationIssue[] = [];

  if (!tutorial.tutorialId.trim()) {
    issues.push({
      severity: "error",
      code: "missing_tutorial_id",
      tutorialId: tutorial.tutorialId,
      viewId: tutorial.viewId,
      message: "Tutorial is missing tutorialId.",
    });
  }

  if (!tutorial.viewId.trim()) {
    issues.push({
      severity: "error",
      code: "missing_view_id",
      tutorialId: tutorial.tutorialId,
      message: "Tutorial is missing viewId.",
    });
  }

  if (tutorial.steps.length === 0) {
    issues.push({
      severity: "error",
      code: "no_steps",
      tutorialId: tutorial.tutorialId,
      viewId: tutorial.viewId,
      message: `Tutorial "${tutorial.tutorialId}" has no steps.`,
    });
  }

  const stepIds = new Set<string>();
  for (const step of tutorial.steps) {
    if (stepIds.has(step.id)) {
      issues.push({
        severity: "error",
        code: "duplicate_step_id",
        tutorialId: tutorial.tutorialId,
        message: `Duplicate step id "${step.id}" in tutorial "${tutorial.tutorialId}".`,
      });
    }
    stepIds.add(step.id);

    if (!step.title.trim() || !step.body.trim()) {
      issues.push({
        severity: "error",
        code: "empty_step_content",
        tutorialId: tutorial.tutorialId,
        message: `Step "${step.id}" must have title and body.`,
      });
    }

    if (step.targetId && !tutorial.declaredTargetIds.includes(step.targetId)) {
      issues.push({
        severity: "warning",
        code: "undeclared_target",
        tutorialId: tutorial.tutorialId,
        targetId: step.targetId,
        message: `Step "${step.id}" references target "${step.targetId}" not listed in declaredTargetIds.`,
      });
    }
  }

  for (const targetId of tutorial.declaredTargetIds) {
    const referenced = tutorial.steps.some((step) => step.targetId === targetId);
    if (!referenced) {
      issues.push({
        severity: "warning",
        code: "unused_declared_target",
        tutorialId: tutorial.tutorialId,
        targetId,
        message: `Declared target "${targetId}" is not used by any step.`,
      });
    }
  }

  return issues;
}

export function validateTutorialRegistry(): TutorialValidationIssue[] {
  resetWorkspaceEnablementCacheForTests();
  const issues: TutorialValidationIssue[] = [];

  for (const tutorial of listTutorialDefinitions()) {
    issues.push(...validateTutorialDefinition(tutorial));

    for (const slug of VALIDATION_WORKSPACE_SLUGS) {
      const resolution = resolveTutorial({
        workspaceSlug: slug,
        viewId: tutorial.viewId,
        tabKey: tutorial.tabKey,
      });

      if (resolution.status === "available" && resolution.tutorial.tutorialId !== tutorial.tutorialId) {
        issues.push({
          severity: "error",
          code: "resolution_mismatch",
          tutorialId: tutorial.tutorialId,
          workspaceSlug: slug,
          viewId: tutorial.viewId,
          message: `Resolver returned a different tutorial for ${slug}/${tutorial.viewId}.`,
        });
      }

      const enablement = getWorkspaceEnablement(slug);
      if (
        enablement.enabledViewIds.has(tutorial.viewId) &&
        resolution.status === "unavailable" &&
        tutorial.workspaces === "*"
      ) {
        issues.push({
          severity: "error",
          code: "tutorial_should_resolve",
          tutorialId: tutorial.tutorialId,
          workspaceSlug: slug,
          viewId: tutorial.viewId,
          message: `Tutorial "${tutorial.tutorialId}" should resolve for enabled view in ${slug}.`,
        });
      }
    }
  }

  return issues;
}

export function buildTutorialCoverageReport(): TutorialCoverageReport {
  resetWorkspaceEnablementCacheForTests();
  const issues = validateTutorialRegistry();

  const definedTutorials = listTutorialDefinitions().map((tutorial) => ({
    tutorialId: tutorial.tutorialId,
    viewId: tutorial.viewId,
    workspaces: tutorial.workspaces,
    stepCount: tutorial.steps.length,
  }));

  const workspaceCoverage: TutorialCoverageReport["workspaceCoverage"] = [];

  for (const workspaceSlug of VALIDATION_WORKSPACE_SLUGS) {
    const enablement = getWorkspaceEnablement(workspaceSlug);
    for (const viewId of enablement.enabledViewIds) {
      const resolution = resolveTutorial({ workspaceSlug, viewId });
      workspaceCoverage.push({
        workspaceSlug,
        viewId,
        viewEnabled: true,
        hasTutorial: resolution.status === "available",
      });
    }
  }

  // Flag views with tutorials defined but invalid viewId strings
  for (const tutorial of listTutorialDefinitions()) {
    for (const slug of VALIDATION_WORKSPACE_SLUGS) {
      const enablement = getWorkspaceEnablement(slug);
      if (!enablement.enabledViewIds.has(tutorial.viewId)) {
        if (tutorial.workspaces !== "*" && !tutorial.workspaces.includes(slug)) continue;
        issues.push({
          severity: "warning",
          code: "view_not_in_workspace_mapping",
          tutorialId: tutorial.tutorialId,
          workspaceSlug: slug,
          viewId: tutorial.viewId,
          message: `Tutorial "${tutorial.tutorialId}" targets view "${tutorial.viewId}" which is not in ${slug} nav.`,
        });
      }
    }
  }

  return {
    definedTutorials,
    issues,
    workspaceCoverage,
  };
}

export function tutorialValidationPassed(issues: TutorialValidationIssue[]): boolean {
  return !issues.some((issue) => issue.severity === "error");
}

export function formatTutorialCoverageReport(report: TutorialCoverageReport): string {
  const lines: string[] = [
    "Guided Tutorial Coverage Report",
    "================================",
    "",
    `Defined tutorials: ${report.definedTutorials.length}`,
  ];

  for (const tutorial of report.definedTutorials) {
    const workspaces =
      tutorial.workspaces === "*" ? "*" : tutorial.workspaces.join(", ");
    lines.push(`  - ${tutorial.tutorialId} (${tutorial.viewId}, ${tutorial.stepCount} steps, workspaces: ${workspaces})`);
  }

  const missing = report.workspaceCoverage.filter((row) => row.viewEnabled && !row.hasTutorial);
  lines.push("", `Enabled views without tutorials: ${missing.length}`);
  if (missing.length > 0 && missing.length <= 30) {
    for (const row of missing.slice(0, 30)) {
      lines.push(`  - ${row.workspaceSlug} / ${row.viewId}`);
    }
  }

  const errors = report.issues.filter((issue) => issue.severity === "error");
  const warnings = report.issues.filter((issue) => issue.severity === "warning");
  lines.push("", `Errors: ${errors.length}`, `Warnings: ${warnings.length}`);

  for (const issue of report.issues) {
    lines.push(`  [${issue.severity}] ${issue.code}: ${issue.message}`);
  }

  return lines.join("\n");
}
