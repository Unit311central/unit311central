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
  if (
    process.env.EA_SKIP_BOARDPACK_STAGES === "1" ||
    process.env.VERCEL === "1" ||
    process.env.NODE_ENV === "production"
  ) {
    return;
  }
  for (let index = 0; index < stages.length; index += 1) {
    await sleep(STAGE_MS[index] ?? 1000);
  }
}

async function fetchDemoNorthstarBoardDeckPdf(meetingDate: string): Promise<Uint8Array | null> {
  const origins = [
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    "https://demo.unit311central.com",
    "https://unit311central.com",
  ].filter((value): value is string => Boolean(value));

  for (const origin of origins) {
    try {
      const res = await fetch(
        `${origin}/api/demo/board-deck?meetingDate=${encodeURIComponent(meetingDate)}`,
        {
          cache: "no-store",
          headers: {
            "x-unit311-demo": "1",
            "x-unit311-workspace-slug": "demo",
          },
        },
      );
      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok || !contentType.includes("pdf")) continue;
      return new Uint8Array(await res.arrayBuffer());
    } catch {
      /* try next origin */
    }
  }
  return null;
}

function northstarPackNameForDate(meetingDate: string): string {
  const d = new Date(`${meetingDate}T12:00:00`);
  const quarter = Math.floor(d.getMonth() / 3) + 1;
  return `Northstar Board Pack — Q${quarter} ${d.getFullYear()}`;
}

async function tryNorthstarProductionBoardPackBridge(
  meetingDate: string | undefined,
  ctx: AssistantToolExecutionContext,
  stages: readonly EaBoardPackStage[],
): Promise<AssistantToolResult | null> {
  if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") return null;

  const resolvedMeetingDate = meetingDate || "2026-03-20";
  const pdfBytes = await fetchDemoNorthstarBoardDeckPdf(resolvedMeetingDate);
  if (!pdfBytes) {
    return toolError(
      "boardpack.generate",
      "Northstar board deck PDF is temporarily unavailable. Please try again in a moment.",
    );
  }

  const { northstarBoardDeckPdfFileName } = await import("@/lib/demo/northstar-board-pack-model");
  const packName = northstarPackNameForDate(resolvedMeetingDate);
  const filename = northstarBoardDeckPdfFileName(resolvedMeetingDate);
  const slug = ctx.business.workspace.slug?.trim() || "demo";

  let pdfArtifact = putAssistantArtifact({
    id: createArtifactId(),
    kind: "pdf",
    title: packName,
    filename,
    mimeType: "application/pdf",
    bytes: Buffer.from(pdfBytes),
    userId: ctx.business.user.id,
    meta: {
      workspaceSlug: slug,
      packName,
      meetingDate: resolvedMeetingDate,
      status: "draft",
      format: "pdf",
    },
  });
  pdfArtifact = await persistArtifactToStorage(pdfArtifact);

  const pdfOpenUrl = `/api/executive-assistant/artifacts/${pdfArtifact.id}?disposition=inline`;
  const pdfDownloadUrl = `/api/executive-assistant/artifacts/${pdfArtifact.id}?disposition=attachment`;

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
    ],
    {
      source: ["northstar:board-pack", "assistant:pdf", "northstar:api-bridge"],
      pageSize: 1,
      summary: {
        executed: true,
        message: "Northstar Board Pack Generated Successfully",
        artifactId: pdfArtifact.id,
        pdfArtifactId: pdfArtifact.id,
        pdfOpenUrl,
        pdfDownloadUrl,
        title: packName,
        filename,
        meetingDate: resolvedMeetingDate,
        status: "draft",
        folderPath: `Board/Northstar/${packName}`,
        boardDeckHref: "/dashboard?view=board-pack",
        pageSummaries: [
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
        ],
        stages: [...stages],
      },
    },
  );
}

export async function generateBoardPackTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  ensureEaWorkspacePacksRegistered();
  const slug = ctx.business.workspace.slug?.trim() || null;
  let boardPack = await getEaWorkspacePackBoardPackConfig(slug);
  if (
    slug === "demo" &&
    (!boardPack || typeof boardPack.generateArtifacts !== "function")
  ) {
    const { demoBoardPackConfig } = await import(
      "@/lib/ai-operating-assistant/workspace-packs/boardpack/demo"
    );
    boardPack = demoBoardPackConfig;
  }
  if (!slug || !boardPack?.supportsBoardPack) {
    return toolForbidden(
      "boardpack.generate",
      "Board Pack Generation is available on the ABHI, Talanton Impact, OnwardAir, and Northstar workspaces only.",
    );
  }

  const meetingDate = parseMeetingDate(
    asString(args.meetingDate) || asString(args.date) || asString(args.when),
  );

  if (slug === "demo") {
    const bridged = await tryNorthstarProductionBoardPackBridge(
      meetingDate,
      ctx,
      boardPack.stages,
    );
    if (bridged) return bridged;
  }

  try {
    if (typeof boardPack.generateArtifacts !== "function") {
      return toolError(
        "boardpack.generate",
        "Board pack artifact generator is unavailable for this workspace.",
      );
    }
    const meetingDateArg = meetingDate;
    const data = boardPack.buildPackData(meetingDateArg);
    const logoDataUrl = await boardPack.loadLogoDataUrl();
    const analysisPromise = runStagedAnalysis(boardPack.stages);
    const generated = await boardPack.generateArtifacts(data, logoDataUrl, meetingDateArg);
    await analysisPromise;

    const packRecord = data as {
      packName?: string;
      meetingDate?: string;
      status?: string;
      pageSummaries?: string[];
      folderPath?: string;
    };

    const packName = generated.packName || packRecord.packName || "Board Pack";
    const resolvedMeetingDate =
      generated.meetingDate || packRecord.meetingDate || meetingDateArg || "";
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

    let pptxArtifact: typeof pdfArtifact | null = null;
    let pptxDownloadUrl = "";
    if (generated.pptxBytes && generated.pptxBytes.length > 0 && generated.pptxFilename) {
      pptxArtifact = putAssistantArtifact({
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
      pptxDownloadUrl = `/api/executive-assistant/artifacts/${pptxArtifact.id}?disposition=attachment`;
    }

    const pdfOpenUrl = `/api/executive-assistant/artifacts/${pdfArtifact.id}?disposition=inline`;
    const pdfDownloadUrl = `/api/executive-assistant/artifacts/${pdfArtifact.id}?disposition=attachment`;
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
        ...(pptxArtifact
          ? [
              {
                artifactId: pptxArtifact.id,
                title: pptxArtifact.title,
                filename: pptxArtifact.filename,
                openUrl: pptxDownloadUrl,
                downloadUrl: pptxDownloadUrl,
                kind: "pptx" as const,
                contentBase64: pptxArtifact.contentBase64,
              },
            ]
          : []),
      ],
      {
        source: generated.sourceTags,
        pageSize: pptxArtifact ? 2 : 1,
        summary: {
          executed: true,
          message: generated.successMessage,
          artifactId: pdfArtifact.id,
          pdfArtifactId: pdfArtifact.id,
          pptxArtifactId: pptxArtifact?.id,
          pdfOpenUrl,
          pdfDownloadUrl,
          pptxDownloadUrl: pptxDownloadUrl || undefined,
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
