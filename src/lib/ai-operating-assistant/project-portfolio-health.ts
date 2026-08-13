/**
 * Project portfolio health assessment for executive EA (workspace-scoped fixtures).
 */

import {
  assessProjectHealth,
  type ProjectHealthBand,
  type ProjectHealthRow,
} from "@/lib/ai-operating-assistant/project-health-pdf-service";
import {
  getPortfolioProjectsForWorkspaceSlug,
  nextPortfolioMilestone,
  topPortfolioRisk,
  type PortfolioMilestone,
  type PortfolioProject,
  type PortfolioRisk,
} from "@/lib/project-portfolios";

export type PortfolioHealthCategory = "on_track" | "at_risk" | "issues";

export type PortfolioProjectHealthRow = {
  projectId: string;
  name: string;
  clientName: string;
  kind: PortfolioProject["kind"];
  phase: PortfolioProject["phase"];
  progressPct: number;
  band: ProjectHealthBand;
  category: PortfolioHealthCategory;
  deliveryStatus?: string;
  operator: string | null;
  endDate: string | null;
  notes: string | null;
  nextMilestone: PortfolioMilestone | null;
  topRisk: PortfolioRisk | null;
  healthIndicators: string[];
};

export type ProjectPortfolioHealthAssessment = {
  asOf: string;
  workspaceSlug: string;
  dataSource: string;
  totalProjects: number;
  onTrack: PortfolioProjectHealthRow[];
  atRisk: PortfolioProjectHealthRow[];
  withIssues: PortfolioProjectHealthRow[];
  rows: PortfolioProjectHealthRow[];
  prose: string;
};

function isActivePortfolioProject(project: PortfolioProject): boolean {
  const phase = String(project.phase ?? "").toLowerCase();
  return phase === "live" || phase === "active" || phase === "in_progress";
}

export function categorizePortfolioProjectHealth(project: PortfolioProject): PortfolioHealthCategory {
  const band = assessProjectHealth(project).band;
  const notes = project.notes?.toLowerCase() ?? "";
  const delivery = project.deliveryStatus?.toLowerCase() ?? "";
  const milestoneAtRisk = project.milestones.some((m) => m.status === "at-risk");
  const highRisk = project.risks.some((r) => r.severity === "high");

  if (
    band === "Red" ||
    /\b(blocked|issue|issues|overdue|delay|slip)\b/.test(notes) ||
    /\boverdue\b/.test(notes)
  ) {
    return "issues";
  }

  if (
    band === "Amber" ||
    milestoneAtRisk ||
    highRisk ||
    delivery.includes("at risk") ||
    delivery.includes("watch")
  ) {
    return "at_risk";
  }

  return "on_track";
}

function mapPortfolioHealthRow(project: PortfolioProject): PortfolioProjectHealthRow {
  const health = assessProjectHealth(project);
  const category = categorizePortfolioProjectHealth(project);
  return {
    projectId: project.id,
    name: project.name,
    clientName: project.clientName,
    kind: project.kind,
    phase: project.phase,
    progressPct: project.progressPct,
    band: health.band,
    category,
    deliveryStatus: project.deliveryStatus,
    operator: project.operator,
    endDate: project.endDate,
    notes: project.notes,
    nextMilestone: nextPortfolioMilestone(project),
    topRisk: topPortfolioRisk(project),
    healthIndicators: health.indicators,
  };
}

function formatCategoryBlock(title: string, rows: PortfolioProjectHealthRow[]): string[] {
  if (!rows.length) return [title, "• None in this category.", ""];
  return [
    title,
    ...rows.map(
      (row) =>
        `• ${row.name} (${row.clientName}) — ${row.band} — ${row.progressPct}% — ${row.category.replace("_", " ")}`,
    ),
    "",
  ];
}

export function buildProjectPortfolioHealthAssessment(
  projects: PortfolioProject[],
  workspaceSlug: string,
  dataSource: string,
): ProjectPortfolioHealthAssessment {
  const active = projects.filter(isActivePortfolioProject);
  const rows = active.map(mapPortfolioHealthRow);
  const onTrack = rows.filter((r) => r.category === "on_track");
  const atRisk = rows.filter((r) => r.category === "at_risk");
  const withIssues = rows.filter((r) => r.category === "issues");

  const lines = [
    `Project portfolio health (${workspaceSlug})`,
    `${rows.length} active project(s) from ${dataSource}.`,
    "",
    ...formatCategoryBlock("On track", onTrack),
    ...formatCategoryBlock("At risk", atRisk),
    ...formatCategoryBlock("Issues / blocked", withIssues),
  ];

  for (const row of rows.slice(0, 12)) {
    lines.push(`${row.name} — ${row.band}`);
    if (row.nextMilestone) {
      lines.push(
        `  Next milestone: ${row.nextMilestone.name} (${row.nextMilestone.dueDate}, ${row.nextMilestone.status})`,
      );
    }
    if (row.topRisk) {
      lines.push(`  Risk: ${row.topRisk.title} (${row.topRisk.severity}) — ${row.topRisk.owner}`);
    }
    if (row.notes) lines.push(`  Notes: ${row.notes.slice(0, 200)}`);
    lines.push("");
  }

  return {
    asOf: new Date().toISOString(),
    workspaceSlug,
    dataSource,
    totalProjects: rows.length,
    onTrack,
    atRisk,
    withIssues,
    rows,
    prose: lines.join("\n").trim(),
  };
}

export function assessWorkspaceProjectPortfolioHealth(
  workspaceSlug: string,
): ProjectPortfolioHealthAssessment {
  const projects = getPortfolioProjectsForWorkspaceSlug(workspaceSlug, "all");
  const dataSource =
    workspaceSlug.includes("onwardair")
      ? "onwardair:project-portfolios"
      : workspaceSlug.includes("abhi")
        ? "abhi:project-portfolios"
        : workspaceSlug.includes("talanton")
          ? "talanton:project-portfolios"
          : "project-portfolios";
  return buildProjectPortfolioHealthAssessment(projects, workspaceSlug, dataSource);
}

export function portfolioHealthRowsForSynthesis(assessment: ProjectPortfolioHealthAssessment) {
  return {
    asOf: assessment.asOf,
    workspaceSlug: assessment.workspaceSlug,
    dataSource: assessment.dataSource,
    totals: {
      onTrack: assessment.onTrack.length,
      atRisk: assessment.atRisk.length,
      withIssues: assessment.withIssues.length,
    },
    onTrack: assessment.onTrack,
    atRisk: assessment.atRisk,
    withIssues: assessment.withIssues,
    projects: assessment.rows,
  };
}
