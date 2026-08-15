/**
 * Board Pack Generation — EA tool `boardpack.generate`.
 * Workspace-specific behaviour delegated to EaWorkspacePack.boardPackConfig.
 */

import {
  createArtifactId,
  persistArtifactToStorage,
  putAssistantArtifact,
} from "@/lib/ai-operating-assistant/artifact-store";
import {
  ensureEaWorkspacePacksRegistered,
  getEaWorkspacePackBoardPackConfig,
} from "@/lib/ai-operating-assistant/workspace-packs";
import {
  toolError,
  toolForbidden,
  toolOk,
  type AssistantToolExecutionContext,
  type AssistantToolResult,
} from "@/lib/ai-operating-assistant/tool-result";

const STAGE_MS = [1100, 1000, 1100, 1200, 1100, 900, 1100, 1400, 1000] as const;

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseMeetingDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const pad = (n: number) => String(n).padStart(2, "0");
  const toIso = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const lower = trimmed.toLowerCase();
  if (/\btomorrow\b/.test(lower)) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toIso(d);
  }
  if (/\btoday\b/.test(lower)) {
    return toIso(new Date());
  }
  if (/\bnext\s+week\b/.test(lower)) {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return toIso(d);
  }

  const iso = trimmed.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso?.[1]) return iso[1];

  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return undefined;
  return toIso(new Date(parsed));
}

import type { EaBoardPackStage } from "@/lib/ai-operating-assistant/workspace-packs/types";

async function runStagedAnalysis(stages: readonly EaBoardPackStage[]): Promise<void> {
  if (process.env.EA_SKIP_BOARDPACK_STAGES === "1") return;
  for (let index = 0; index < stages.length; index += 1) {
    await sleep(STAGE_MS[index] ?? 1000);
  }
}

export async function generateBoardPackTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  ensureEaWorkspacePacksRegistered();
  const slug = ctx.business.workspace.slug?.trim() || null;
  const boardPack = getEaWorkspacePackBoardPackConfig(slug);
  if (!slug || !boardPack?.supportsBoardPack) {
    return toolForbidden(
      "boardpack.generate",
      "Board Pack Generation is available on the ABHI, Talanton Impact, and OnwardAir workspaces only.",
    );
  }

  try {
    const meetingDate = parseMeetingDate(
      asString(args.meetingDate) || asString(args.date) || asString(args.when),
    );
    const data = boardPack.buildPackData(meetingDate);
    const logoDataUrl = await boardPack.loadLogoDataUrl();

    const analysisPromise = runStagedAnalysis(boardPack.stages);
    const generated = await boardPack.generateArtifacts(data, logoDataUrl, meetingDate);
    await analysisPromise;

    const packRecord = data as {
      packName?: string;
      meetingDate?: string;
      status?: string;
      pageSummaries?: string[];
      folderPath?: string;
    };

    const packName = generated.packName || packRecord.packName || "Board Pack";
    const resolvedMeetingDate = generated.meetingDate || packRecord.meetingDate || meetingDate || "";
    const status = generated.status || packRecord.status || "draft";

    let pdfArtifact = putAssistantArtifact({
      id: createArtifactId(),
      kind: "pdf",
      title: packName,
      filename: generated.pdfFilename,
      mimeType: "application/pdf",
      bytes: Buffer.from(generated.pdfBytes),
      userId: ctx.business.user.id,
      meta: {
        workspaceSlug: slug,
        packName,
        meetingDate: resolvedMeetingDate,
        status,
        format: "pdf",
      },
    });
    pdfArtifact = await persistArtifactToStorage(pdfArtifact);

    let pptxArtifact = putAssistantArtifact({
      id: createArtifactId(),
      kind: "pptx",
      title: `${packName} (PowerPoint)`,
      filename: generated.pptxFilename,
      mimeType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      bytes: Buffer.from(generated.pptxBytes),
      userId: ctx.business.user.id,
      meta: {
        workspaceSlug: slug,
        packName,
        meetingDate: resolvedMeetingDate,
        status,
        format: "pptx",
      },
    });
    pptxArtifact = await persistArtifactToStorage(pptxArtifact);

    const pdfOpenUrl = `/api/executive-assistant/artifacts/${pdfArtifact.id}?disposition=inline`;
    const pdfDownloadUrl = `/api/executive-assistant/artifacts/${pdfArtifact.id}?disposition=attachment`;
    const pptxDownloadUrl = `/api/executive-assistant/artifacts/${pptxArtifact.id}?disposition=attachment`;
    const boardDeckHref = "/dashboard?view=board-pack";
    const folderPath =
      generated.folderPath ??
      packRecord.folderPath ??
      `Corporate Information / Board Deck / ${packName}`;

    const pageSummaries = generated.pageSummaries?.length
      ? generated.pageSummaries
      : packRecord.pageSummaries?.length
        ? packRecord.pageSummaries
        : [
            "Cover Page",
            "Executive Summary",
            "Previous Meeting",
            "Risk Register",
            "KPI Dashboard",
            "Financial Overview",
            "Profit & Loss",
            "Balance Sheet & Cash",
            "Commercial Performance",
            "Team & Organisation",
            "Strategic Discussion & AOB",
          ];

    return toolOk(
      "boardpack.generate",
      [
        {
          artifactId: pdfArtifact.id,
          title: pdfArtifact.title,
          filename: pdfArtifact.filename,
          openUrl: pdfOpenUrl,
          downloadUrl: pdfDownloadUrl,
          kind: "pdf",
          contentBase64: pdfArtifact.contentBase64,
        },
        {
          artifactId: pptxArtifact.id,
          title: pptxArtifact.title,
          filename: pptxArtifact.filename,
          openUrl: pptxDownloadUrl,
          downloadUrl: pptxDownloadUrl,
          kind: "pptx",
          contentBase64: pptxArtifact.contentBase64,
        },
      ],
      {
        source: generated.sourceTags,
        pageSize: 2,
        summary: {
          executed: true,
          message: generated.successMessage,
          artifactId: pdfArtifact.id,
          pdfArtifactId: pdfArtifact.id,
          pptxArtifactId: pptxArtifact.id,
          title: packName,
          filename: generated.pdfFilename,
          pptxFilename: generated.pptxFilename,
          meetingDate: resolvedMeetingDate,
          status,
          folderPath,
          boardDeckHref,
          pageSummaries,
          stages: [...boardPack.stages],
        },
      },
    );
  } catch (error) {
    return toolError(
      "boardpack.generate",
      error instanceof Error ? error.message : "Board pack generation failed.",
    );
  }
}
