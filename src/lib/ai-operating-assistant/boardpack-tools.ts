/**
 * Board Pack Generation — EA tool `boardpack.generate`.
 * Available on ABHI and Talanton Impact. Generates PowerPoint + PDF with staged analysis delay.
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
import { isTalantonImpactSlug } from "@/lib/talanton-surface";

const TALANTON_LOGO_SRC = "/images/workspaces/talantonimpact-t.jpg";

function canGenerateBoardPack(slug: string | null | undefined) {
  return isAbhiSlug(slug) || isTalantonImpactSlug(slug);
}

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
      isTalantonImpactSlug(slug) ? TALANTON_LOGO_SRC : ABHI_LOGO_SRC
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
      if (isTalantonImpactSlug(slug)) return null;
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

function brandBoardPackForWorkspace(
  data: AbhiBoardPackData,
  slug: string,
): AbhiBoardPackData {
  if (!isTalantonImpactSlug(slug)) return data;
  const rebrand = (value: string) =>
    value
      .replace(/\bABHI\b/g, "Talanton Impact")
      .replace(/Association of British HealthTech Industries/gi, "Talanton Impact");
  return {
    ...data,
    packName: rebrand(data.packName).replace(
      /Talanton Impact Board Meeting Pack/i,
      "Talanton Impact Board Pack",
    ),
    folderPath: rebrand(data.folderPath),
    pageSummaries: data.pageSummaries?.map(rebrand),
  };
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
  const slug = ctx.business.workspace.slug;
  if (!canGenerateBoardPack(slug)) {
    return toolForbidden(
      "boardpack.generate",
      "Board Pack Generation is available on the ABHI and Talanton Impact workspaces only.",
    );
  }

  try {
    const meetingDate = parseMeetingDate(
      asString(args.meetingDate) || asString(args.date) || asString(args.when),
    );
    const data: AbhiBoardPackData = brandBoardPackForWorkspace(
      buildAbhiBoardPackData(meetingDate),
      slug,
    );
    const logoDataUrl = await loadLogoDataUrl(slug);

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

    // Never stream file bytes in the tool result — PDF/PPTX base64 blows up the SSE
    // frame and the client never receives the success card / done event.
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
          status: data.status,
          orgStatus: data.orgStatus,
          folderPath,
          boardDeckHref,
          pageSummaries,
          stages: ABHI_BOARD_PACK_STAGES,
          pdfOpenUrl,
          pdfDownloadUrl,
          pptxDownloadUrl,
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
            id: "edit_board_pack",
            label: "Edit Board Pack",
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
      ["abhi:board-pack"],
    );
  }
}
