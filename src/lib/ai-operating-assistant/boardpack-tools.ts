/**
 * Board Pack Generation — EA tool `boardpack.generate`.
 * ABHI, Talanton Impact, and OnwardAir. PowerPoint + PDF with staged analysis delay.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ABHI_LOGO_SRC, isAbhiSlug } from "@/lib/abhi-surface";
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
import { TALANTON_BOARD_PACK_STAGES } from "@/lib/talanton/board-pack-stages";
import { buildOnwardAirBoardPackData } from "@/lib/onwardair/board-pack-model";
import {
  oaBoardPackPdfFileName,
  buildOnwardAirBoardPackPdf,
} from "@/lib/onwardair/board-pack-pdf";
import {
  oaBoardPackPptxFileName,
  buildOnwardAirBoardPackPptx,
} from "@/lib/onwardair/board-pack-pptx";
import { OA_BOARD_PACK_STAGES } from "@/lib/onwardair/board-pack-stages";
import {
  ONWARDAIR_LOGO_DARK_PNG_SRC,
  isOnwardAirSlug,
} from "@/lib/onwardair-surface";
import {
  buildTalantonBoardPackData,
  isTalantonBoardPackData,
  talantonBoardPackPdfFileName,
  talantonBoardPackPptxFileName,
} from "@/lib/talanton/board-pack-model";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";

const TALANTON_LOGO_SRC = "/images/workspaces/talantonimpact-t.jpg";

function canGenerateBoardPack(slug: string | null | undefined) {
  return isAbhiSlug(slug) || isTalantonImpactSlug(slug) || isOnwardAirSlug(slug);
}

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

async function loadLogoDataUrl(slug: string): Promise<string | null> {
  try {
    const relative = (
      isOnwardAirSlug(slug)
        ? ONWARDAIR_LOGO_DARK_PNG_SRC
        : isTalantonImpactSlug(slug)
          ? TALANTON_LOGO_SRC
          : ABHI_LOGO_SRC
    ).replace(/^\//, "");
    const primaryPath = join(process.cwd(), "public", relative);
    try {
      const bytes = await readFile(primaryPath);
      const mime = relative.endsWith(".png")
        ? "image/png"
        : relative.endsWith(".jpg") || relative.endsWith(".jpeg")
          ? "image/jpeg"
          : "image/png";
      return `data:${mime};base64,${bytes.toString("base64")}`;
    } catch {
      if (isTalantonImpactSlug(slug) || isOnwardAirSlug(slug)) return null;
      const jpgPath = join(
        process.cwd(),
        "public",
        "images",
        "workspaces",
        "abhi.jpg",
      );
      const bytes = await readFile(jpgPath);
      return `data:image/jpeg;base64,${bytes.toString("base64")}`;
    }
  } catch {
    return null;
  }
}

async function runStagedAnalysis(slug: string): Promise<void> {
  const stages = isOnwardAirSlug(slug)
    ? OA_BOARD_PACK_STAGES
    : isTalantonImpactSlug(slug)
      ? TALANTON_BOARD_PACK_STAGES
      : ABHI_BOARD_PACK_STAGES;
  for (let index = 0; index < stages.length; index += 1) {
    await sleep(STAGE_MS[index] ?? 1000);
  }
}

export async function generateBoardPackTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const slug = ctx.business.workspace.slug?.trim() || null;
  if (!slug || !canGenerateBoardPack(slug)) {
    return toolForbidden(
      "boardpack.generate",
      "Board Pack Generation is available on the ABHI, Talanton Impact, and OnwardAir workspaces only.",
    );
  }

  const isOa = isOnwardAirSlug(slug);
  const isTi = isTalantonImpactSlug(slug);
  const stages = isOa ? OA_BOARD_PACK_STAGES : isTi ? TALANTON_BOARD_PACK_STAGES : ABHI_BOARD_PACK_STAGES;

  try {
    const meetingDate = parseMeetingDate(
      asString(args.meetingDate) || asString(args.date) || asString(args.when),
    );
    const data: AbhiBoardPackData = isOa
      ? buildOnwardAirBoardPackData(meetingDate)
      : isTalantonImpactSlug(slug)
        ? buildTalantonBoardPackData(meetingDate)
        : buildAbhiBoardPackData(meetingDate);
    const logoDataUrl = await loadLogoDataUrl(slug);

    const analysisPromise = runStagedAnalysis(slug);
    const [pdfBytes, pptxBytes] = await Promise.all([
      isOa
        ? buildOnwardAirBoardPackPdf(data, logoDataUrl)
        : buildAbhiBoardPackPdf(data, logoDataUrl),
      isOa
        ? buildOnwardAirBoardPackPptx(data, logoDataUrl)
        : buildAbhiBoardPackPptx(data, logoDataUrl),
    ]);
    await analysisPromise;

    const pdfFilename = isOa
      ? oaBoardPackPdfFileName(data.meetingDate)
      : isTalantonBoardPackData(data)
        ? talantonBoardPackPdfFileName(data.meetingDate)
        : abhiBoardPackPdfFileName(data.meetingDate);
    const pptxFilename = isOa
      ? oaBoardPackPptxFileName(data.meetingDate)
      : isTalantonBoardPackData(data)
        ? talantonBoardPackPptxFileName(data.meetingDate)
        : abhiBoardPackPptxFileName(data.meetingDate);

    let pdfArtifact = putAssistantArtifact({
      id: createArtifactId(),
      kind: "pdf",
      title: data.packName,
      filename: pdfFilename,
      mimeType: "application/pdf",
      bytes: Buffer.from(pdfBytes),
      userId: ctx.business.user.id,
      meta: {
        workspaceSlug: slug,
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
        workspaceSlug: slug,
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
    const folderPath = isOa
      ? data.folderPath
      : `Corporate Information / Board Deck / ${data.packName}`;

    const pageSummaries = data.pageSummaries?.length
      ? data.pageSummaries
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
        },
        {
          artifactId: pptxArtifact.id,
          title: pptxArtifact.title,
          filename: pptxArtifact.filename,
          openUrl: pptxDownloadUrl,
          downloadUrl: pptxDownloadUrl,
          kind: "pptx",
        },
      ],
      {
        source: isOa
          ? [
              "onwardair:board-pack",
              "onwardair:financials",
              "onwardair:fundraising",
              "onwardair:board-data",
              "assistant:pptx",
              "assistant:pdf",
            ]
          : [
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
          message: isOa
            ? "OnwardAir Board Deck Generated Successfully"
            : isTi
              ? "Talanton Board Deck Generated Successfully"
              : "Board Pack Generated Successfully",
          artifactId: pdfArtifact.id,
          pdfArtifactId: pdfArtifact.id,
          pptxArtifactId: pptxArtifact.id,
          title: data.packName,
          filename: pdfFilename,
          pptxFilename,
          packName: data.packName,
          meetingDate: data.meetingDate,
          status: data.status,
          orgStatus: data.orgStatus,
          folderPath,
          boardDeckHref,
          pageSummaries,
          stages,
          pdfOpenUrl,
          pdfDownloadUrl,
          pptxDownloadUrl,
        },
        followUpActions: [
          {
            id: "preview_board_pack",
            label: isOa ? "Preview Board Deck" : "Preview Board Pack",
            kind: "open",
            artifactId: pdfArtifact.id,
            href: pdfOpenUrl,
          },
          {
            id: "edit_board_pack",
            label: isOa ? "Open Board Decks" : "Edit Board Pack",
            kind: "navigate",
            href: boardDeckHref,
          },
          {
            id: "download_pptx",
            label: "Download PowerPoint",
            kind: "download",
            artifactId: pptxArtifact.id,
            href: pptxDownloadUrl,
          },
          {
            id: "download_pdf",
            label: "Download PDF",
            kind: "download",
            artifactId: pdfArtifact.id,
            href: pdfDownloadUrl,
          },
        ],
      },
    );
  } catch (error) {
    return toolError(
      "boardpack.generate",
      error instanceof Error ? error.message : "Failed to generate board pack",
      isOa ? ["onwardair:board-pack"] : ["abhi:board-pack"],
    );
  }
}
