/**
 * ABHI EA PDF tools — regulatory, quarterly deltas, project health, platform access.
 * Board pack generation is unchanged in boardpack-tools.ts.
 */

import { isAbhiSlug } from "@/lib/abhi-surface";
import {
  buildAbhiRegulatoryPeriodReportData,
} from "@/lib/abhi/regulatory-intelligence";
import {
  abhiRegulatoryPeriodPdfFileName,
  buildAbhiRegulatoryPeriodImpactPdf,
} from "@/lib/abhi/regulatory-brief-pdf";
import {
  createArtifactId,
  persistArtifactToStorage,
  putAssistantArtifact,
} from "@/lib/ai-operating-assistant/artifact-store";
import {
  loadQuarterlyDeltaBundle,
  renderQuarterlyDeltaPdf,
} from "@/lib/ai-operating-assistant/quarterly-delta-pdf-service";
import {
  renderProjectHealthPdf,
} from "@/lib/ai-operating-assistant/project-health-pdf-service";
import {
  renderPlatformAccessPdf,
} from "@/lib/ai-operating-assistant/platform-access-pdf-service";
import {
  asString,
  toolError,
  toolForbidden,
  toolOk,
  type AssistantToolExecutionContext,
  type AssistantToolResult,
} from "@/lib/ai-operating-assistant/tool-result";
import { listInternalClients } from "@/lib/internal-clients-service";
import { listInternalOperators } from "@/lib/internal-operators-service";
import { listProjects } from "@/lib/internal-projects-service";
import { listWorkspaceTenantUsers } from "@/lib/platform-users-service";
import type { ManagedUser } from "@/lib/user-management-data";

function abhiOnly(tool: string, ctx: AssistantToolExecutionContext): AssistantToolResult | null {
  if (!isAbhiSlug(ctx.business.workspace.slug)) {
    return toolForbidden(tool, "This PDF tool is available on the ABHI workspace only.");
  }
  return null;
}

function artifactActions(artifactId: string) {
  return [
    {
      id: `open_${artifactId}`,
      label: "Open",
      kind: "open" as const,
      artifactId,
      href: `/api/executive-assistant/artifacts/${artifactId}?disposition=inline`,
    },
    {
      id: `download_${artifactId}`,
      label: "Download",
      kind: "download" as const,
      artifactId,
      href: `/api/executive-assistant/artifacts/${artifactId}?disposition=attachment`,
    },
    {
      id: `email_${artifactId}`,
      label: "Email",
      kind: "email_artifact" as const,
      artifactId,
      actionId: "emailAssistantArtifact",
    },
  ];
}

function okPdf(
  tool: string,
  artifact: Awaited<ReturnType<typeof putAssistantArtifact>>,
  summary: Record<string, unknown>,
  source: string[],
): AssistantToolResult {
  const openUrl = `/api/executive-assistant/artifacts/${artifact.id}?disposition=inline`;
  const downloadUrl = `/api/executive-assistant/artifacts/${artifact.id}?disposition=attachment`;
  return toolOk(
    tool,
    [
      {
        artifactId: artifact.id,
        title: artifact.title,
        filename: artifact.filename,
        openUrl,
        downloadUrl,
        kind: "pdf",
        contentBase64: artifact.contentBase64,
      },
    ],
    {
      source,
      pageSize: 1,
      summary: {
        executed: true,
        artifactId: artifact.id,
        title: artifact.title,
        filename: artifact.filename,
        byteLength: artifact.bytes.length,
        ...summary,
        message: `${artifact.filename}\n\nPDF generated successfully.`,
      },
      followUpActions: artifactActions(artifact.id),
    },
  );
}

export async function generateAbhiRegulatoryImpactPdfTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = abhiOnly("abhi.generateRegulatoryImpactPdf", ctx);
  if (blocked) return blocked;

  try {
    const question = asString(args.question) || "";
    const months =
      typeof args.months === "number" && Number.isFinite(args.months)
        ? Math.max(1, Math.min(36, Math.floor(args.months)))
        : 6;
    const region = (asString(args.region) ?? "").toUpperCase() === "ALL" ? "all" : "UK";

    const clients = await listInternalClients().catch(() => []);
    const reportData = buildAbhiRegulatoryPeriodReportData(clients, {
      months,
      region: region === "UK" ? "UK" : "all",
    });
    const pdfBytes = buildAbhiRegulatoryPeriodImpactPdf(reportData);
    let artifact = putAssistantArtifact({
      id: createArtifactId(),
      kind: "pdf",
      title: `ABHI Regulatory Member Impact — ${reportData.periodLabel}`,
      filename: abhiRegulatoryPeriodPdfFileName(reportData.periodLabel),
      mimeType: "application/pdf",
      bytes: Buffer.from(pdfBytes),
      userId: ctx.business.user.id,
      meta: {
        months,
        region,
        updateCount: reportData.updates.length,
        memberCount: reportData.uniqueMemberCount,
      },
    });
    artifact = await persistArtifactToStorage(artifact);

    return okPdf(
      "abhi.generateRegulatoryImpactPdf",
      artifact,
      {
        periodLabel: reportData.periodLabel,
        regionLabel: reportData.regionLabel,
        updateCount: reportData.updates.length,
        memberCount: reportData.uniqueMemberCount,
        emptyReason: reportData.emptyReason ?? null,
        requestPreview: question.slice(0, 240) || undefined,
      },
      ["abhi:regulatory-intelligence", "assistant:pdf"],
    );
  } catch (error) {
    return toolError(
      "abhi.generateRegulatoryImpactPdf",
      error instanceof Error ? error.message : "Failed to generate regulatory impact PDF",
      ["abhi:regulatory-intelligence"],
    );
  }
}

export async function generateAbhiQuarterlyFinancialDeltaPdfTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = abhiOnly("abhi.generateQuarterlyFinancialDeltaPdf", ctx);
  if (blocked) return blocked;

  if (!ctx.business.permissions.canAccessFinancials) {
    return toolForbidden(
      "abhi.generateQuarterlyFinancialDeltaPdf",
      "Your current role cannot access financial reports.",
    );
  }

  try {
    const question = asString(args.question) || "";
    const bundle = await loadQuarterlyDeltaBundle({
      canAccessFinancials: ctx.business.permissions.canAccessFinancials,
    });
    let artifact = await renderQuarterlyDeltaPdf({
      bundle,
      userId: ctx.business.user.id,
      organisationName: ctx.business.organisation.name,
      workspaceSlug: ctx.business.workspace.slug,
      requestPreview: question.slice(0, 240) || undefined,
    });
    artifact = await persistArtifactToStorage(artifact);

    return okPdf(
      "abhi.generateQuarterlyFinancialDeltaPdf",
      artifact,
      {
        currentQuarter: bundle.currentQuarter,
        priorQuarter: bundle.priorQuarter,
        metrics: bundle.rows.map((row) => row.label),
        requestPreview: question.slice(0, 240) || undefined,
      },
      bundle.sources,
    );
  } catch (error) {
    return toolError(
      "abhi.generateQuarterlyFinancialDeltaPdf",
      error instanceof Error ? error.message : "Failed to generate quarterly financial delta PDF",
      ["supabase:financials"],
    );
  }
}

export async function generateAbhiProjectHealthPdfTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = abhiOnly("abhi.generateProjectHealthPdf", ctx);
  if (blocked) return blocked;

  try {
    const question = asString(args.question) || "";
    const projects = await listProjects().catch(() => []);
    let artifact = await renderProjectHealthPdf({
      projects,
      userId: ctx.business.user.id,
      organisationName: ctx.business.organisation.name,
      workspaceSlug: ctx.business.workspace.slug,
      requestPreview: question.slice(0, 240) || undefined,
    });
    artifact = await persistArtifactToStorage(artifact);

    return okPdf(
      "abhi.generateProjectHealthPdf",
      artifact,
      {
        projectCount: projects.length,
        requestPreview: question.slice(0, 240) || undefined,
      },
      ["supabase:projects", "assistant:pdf"],
    );
  } catch (error) {
    return toolError(
      "abhi.generateProjectHealthPdf",
      error instanceof Error ? error.message : "Failed to generate project health PDF",
      ["supabase:projects"],
    );
  }
}

async function loadAuthorisedPlatformUsers(
  ctx: AssistantToolExecutionContext,
): Promise<ManagedUser[]> {
  const workspaceId = ctx.business.workspace.id?.trim();
  if (workspaceId) {
    try {
      const workspaceUsers = await listWorkspaceTenantUsers(workspaceId);
      if (workspaceUsers.length > 0) return workspaceUsers;
    } catch {
      // Fall through to internal operators catalogue.
    }
  }
  return listInternalOperators();
}

export async function generateAbhiPlatformAccessPdfTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const blocked = abhiOnly("abhi.generatePlatformAccessPdf", ctx);
  if (blocked) return blocked;

  if (!ctx.business.permissions.canAccessUsers) {
    return toolForbidden(
      "abhi.generatePlatformAccessPdf",
      "User management access is required to export platform user access.",
    );
  }

  try {
    const question = asString(args.question) || "";
    const users = await loadAuthorisedPlatformUsers(ctx);
    let artifact = await renderPlatformAccessPdf({
      users,
      userId: ctx.business.user.id,
      organisationName: ctx.business.organisation.name,
      workspaceSlug: ctx.business.workspace.slug,
      requestPreview: question.slice(0, 240) || undefined,
    });
    artifact = await persistArtifactToStorage(artifact);

    return okPdf(
      "abhi.generatePlatformAccessPdf",
      artifact,
      {
        userCount: users.length,
        requestPreview: question.slice(0, 240) || undefined,
      },
      ["platform_users", "internal_operators", "assistant:pdf"],
    );
  } catch (error) {
    return toolError(
      "abhi.generatePlatformAccessPdf",
      error instanceof Error ? error.message : "Failed to generate platform access PDF",
      ["platform_users"],
    );
  }
}

export const ABHI_EA_PDF_TOOL_DEFINITIONS = [
  {
    name: "abhi.generateRegulatoryImpactPdf",
    description:
      "ABHI only. Generate a regulatory member impact PDF for a period (e.g. past 6 months) and region (e.g. UK members). Uses live Regulatory Intelligence data — not board deck format.",
    parameters: {
      type: "object",
      properties: {
        question: { type: "string" },
        months: { type: "number", description: "Lookback window in months (default 6)." },
        region: { type: "string", enum: ["UK", "all"] },
      },
      additionalProperties: false,
    },
  },
  {
    name: "abhi.generateQuarterlyFinancialDeltaPdf",
    description:
      "ABHI only. Generate a quarter-over-quarter financial delta PDF for P&L, burn rate, and payroll. Compares last completed calendar quarter vs prior quarter. Not board deck format.",
    parameters: {
      type: "object",
      properties: {
        question: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "abhi.generateProjectHealthPdf",
    description:
      "ABHI only. Generate a health status PDF for all active/live projects from recorded progress, due dates, and notes. Not board deck format.",
    parameters: {
      type: "object",
      properties: {
        question: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "abhi.generatePlatformAccessPdf",
    description:
      "ABHI only. Generate a platform users and module access PDF (not HR employee directory). Requires user-management permission.",
    parameters: {
      type: "object",
      properties: {
        question: { type: "string" },
      },
      additionalProperties: false,
    },
  },
] as const;
