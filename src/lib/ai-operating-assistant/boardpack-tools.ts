/**
 * ABHI-only Board Pack Generation — EA tool `boardpack.generate`.
 * Generates PowerPoint + PDF preview with staged analysis delay (8–12s).
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ABHI_LOGO_SRC, isAbhiSlug } from "@/lib/abhi-surface";
import { resolveAbhiBoardPackMeetingDate } from "@/lib/abhi/board-pack-date";
import {
  buildAbhiBoardPackData,
  type AbhiBoardPackData,
} from "@/lib/abhi/board-pack-model";
import {
  abhiBoardPackPdfFileName,
  buildAbhiBoardPackPdf,
} from "@/lib/abhi/board-pack-pdf";
import {
  abhiBoardPackPptxFileName,
  buildAbhiBoardPackPptx,
} from "@/lib/abhi/board-pack-pptx";
import {
  createArtifactId,
  persistArtifactToStorage,
  putAssistantArtifact,
} from "@/lib/ai-operating-assistant/artifact-store";
import {
  toolError,
  toolForbidden,
  toolOk,
  type AssistantToolExecutionContext,
  type AssistantToolResult,
} from "@/lib/ai-operating-assistant/tool-result";

import { ABHI_BOARD_PACK_STAGES } from "@/lib/abhi/board-pack-stages";

const STAGE_MS = [1100, 1000, 1100, 1200, 1100, 900, 1100, 1400, 1000] as const;
const GENERATION_STAGES = ABHI_BOARD_PACK_STAGES.map((stage, index) => ({
  ...stage,
  ms: STAGE_MS[index] ?? 1000,
}));

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadAbhiLogoDataUrl(): Promise<string | null> {
  try {
    // Same transparent asset as {@link AbhiLogoMark} / {@link ABHI_LOGO_SRC}.
    const relative = ABHI_LOGO_SRC.replace(/^\//, "");
    const primaryPath = join(process.cwd(), "public", relative);
    try {
      const pngBytes = await readFile(primaryPath);
      return `data:image/png;base64,${pngBytes.toString("base64")}`;
    } catch {
      const jpgPath = join(process.cwd(), "public", "images", "workspaces", "abhi.jpg");
      const bytes = await readFile(jpgPath);
      return `data:image/jpeg;base64,${bytes.toString("base64")}`;
    }
  } catch {
    return null;
  }
}

async function runStagedAnalysis(): Promise<void> {
  // Keep total delay in the 8–12s demo window while generation work runs in parallel.
  for (const stage of GENERATION_STAGES) {
    await sleep(stage.ms);
  }
}

export async function generateBoardPackTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  if (!isAbhiSlug(ctx.business.workspace.slug)) {
    return toolForbidden(
      "boardpack.generate",
      "Board Pack Generation is available on the ABHI workspace only.",
    );
  }

  try {
    const dateResolution = resolveAbhiBoardPackMeetingDate({
      explicitDate:
        asString(args.meetingDate) || asString(args.date) || asString(args.when),
    });

    if (!dateResolution.ok) {
      return toolOk("boardpack.generate", [], {
        source: ["abhi:board-pack", "abhi:board-meetings"],
        summary: {
          executed: false,
          needsMeetingDate: true,
          message: dateResolution.message,
          packName: "Board Pack - Meeting Date Not Set",
        },
        followUpActions: [
          {
            id: "open_board_meetings",
            label: "Open Board Meetings",
            kind: "navigate",
            href: "/dashboard?view=board-meetings",
          },
        ],
        status: "partial",
      });
    }

    const meetingDate = dateResolution.meetingDate;
    const data: AbhiBoardPackData = buildAbhiBoardPackData(meetingDate);
    const logoDataUrl = await loadAbhiLogoDataUrl();

    const analysisPromise = runStagedAnalysis();
    const [pdfBytes, pptxBytes] = await Promise.all([
      buildAbhiBoardPackPdf(data, logoDataUrl),
      buildAbhiBoardPackPptx(data, logoDataUrl),
    ]);
    await analysisPromise;

    const pdfFilename = abhiBoardPackPdfFileName(data.meetingDate);
    const pptxFilename = abhiBoardPackPptxFileName(data.meetingDate);

    let pdfArtifact = putAssistantArtifact({
      id: createArtifactId(),
      kind: "pdf",
      title: data.packName,
      filename: pdfFilename,
      mimeType: "application/pdf",
      bytes: Buffer.from(pdfBytes),
      userId: ctx.business.user.id,
      meta: {
        workspaceSlug: "abhi",
        packName: data.packName,
        meetingDate: data.meetingDate,
        status: data.status,
        format: "pdf",
      },
    });
    pdfArtifact = await persistArtifactToStorage(pdfArtifact);

    let pptxArtifact = putAssistantArtifact({
      id: createArtifactId(),
      kind: "pptx",
      title: `${data.packName} (PowerPoint)`,
      filename: pptxFilename,
      mimeType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      bytes: Buffer.from(pptxBytes),
      userId: ctx.business.user.id,
      meta: {
        workspaceSlug: "abhi",
        packName: data.packName,
        meetingDate: data.meetingDate,
        status: data.status,
        format: "pptx",
      },
    });
    pptxArtifact = await persistArtifactToStorage(pptxArtifact);

    const pdfOpenUrl = `/api/executive-assistant/artifacts/${pdfArtifact.id}?disposition=inline`;
    const pdfDownloadUrl = `/api/executive-assistant/artifacts/${pdfArtifact.id}?disposition=attachment`;
    const pptxDownloadUrl = `/api/executive-assistant/artifacts/${pptxArtifact.id}?disposition=attachment`;
    const boardDeckHref = "/dashboard?view=board-pack";
    const folderPath = `Corporate Information / Board Deck / ${data.packName}`;

    const pageSummaries = [
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
          contentBase64: pdfArtifact.contentBase64,
          kind: "pdf",
        },
        {
          artifactId: pptxArtifact.id,
          title: pptxArtifact.title,
          filename: pptxArtifact.filename,
          openUrl: pptxDownloadUrl,
          downloadUrl: pptxDownloadUrl,
          contentBase64: pptxArtifact.contentBase64,
          kind: "pptx",
        },
      ],
      {
        source: [
          "abhi:board-pack",
          "abhi:financials",
          "abhi:membership",
          "abhi:risk-register",
          "assistant:pptx",
          "assistant:pdf",
        ],
        pageSize: 2,
        summary: {
          executed: true,
          message: "Board Pack Generated Successfully",
          artifactId: pdfArtifact.id,
          pdfArtifactId: pdfArtifact.id,
          pptxArtifactId: pptxArtifact.id,
          title: data.packName,
          filename: pdfFilename,
          pptxFilename,
          packName: data.packName,
          meetingDate: data.meetingDate,
          dateSource: dateResolution.source,
          meetingId: dateResolution.meetingId,
          meetingTitle: dateResolution.meetingTitle,
          status: data.status,
          orgStatus: data.orgStatus,
          folderPath,
          boardDeckHref,
          pageSummaries,
          stages: ABHI_BOARD_PACK_STAGES,
          pdfOpenUrl,
          pdfDownloadUrl,
          pptxDownloadUrl,
          pdfContentBase64: pdfArtifact.contentBase64,
          pptxContentBase64: pptxArtifact.contentBase64,
        },
        followUpActions: [
          {
            id: "preview_board_pack",
            label: "Preview Board Pack",
            kind: "open",
            artifactId: pdfArtifact.id,
            href: pdfOpenUrl,
          },
          {
            id: "download_pdf",
            label: "Download PDF",
            kind: "download",
            artifactId: pdfArtifact.id,
            href: pdfDownloadUrl,
          },
          {
            id: "download_pptx",
            label: "Download PowerPoint",
            kind: "download",
            artifactId: pptxArtifact.id,
            href: pptxDownloadUrl,
          },
          {
            id: "open_board_deck",
            label: "Open Board Deck",
            kind: "navigate",
            href: boardDeckHref,
          },
        ],
      },
    );
  } catch (error) {
    return toolError(
      "boardpack.generate",
      error instanceof Error ? error.message : "Failed to generate board pack",
      ["abhi:board-pack"],
    );
  }
}
