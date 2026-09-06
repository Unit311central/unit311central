import {
  createArtifactId,
  persistArtifactToStorage,
  putAssistantArtifact,
} from "@/lib/ai-operating-assistant/artifact-store";
import {
  toolError,
  toolOk,
  type AssistantToolExecutionContext,
  type AssistantToolResult,
} from "@/lib/ai-operating-assistant/tool-result";
import type { EaBoardPackStage } from "@/lib/ai-operating-assistant/workspace-packs/types";

function northstarPackNameForDate(meetingDate: string): string {
  const d = new Date(`${meetingDate}T12:00:00`);
  const quarter = Math.floor(d.getMonth() / 3) + 1;
  return `Northstar Board Pack — Q${quarter} ${d.getFullYear()}`;
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

async function fetchGreenDesertBoardDeckPdf(meetingDate: string): Promise<Uint8Array | null> {
  const origins = [
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    "https://greendesert.unit311central.com",
    "https://unit311central.com",
  ].filter((value): value is string => Boolean(value));

  for (const origin of origins) {
    try {
      const res = await fetch(
        `${origin}/api/greendesert/board-deck?meetingDate=${encodeURIComponent(meetingDate)}`,
        {
          cache: "no-store",
          headers: {
            "x-unit311-workspace-slug": "greendesert",
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

function greenDesertPackNameForDate(meetingDate: string): string {
  const d = new Date(`${meetingDate}T12:00:00`);
  const quarter = Math.floor(d.getMonth() / 3) + 1;
  return `Green Desert Board Pack — Q${quarter} ${d.getFullYear()}`;
}

export async function tryGreenDesertProductionBoardPackBridge(
  meetingDate: string | undefined,
  ctx: AssistantToolExecutionContext,
  stages: readonly EaBoardPackStage[] = [],
): Promise<AssistantToolResult | null> {
  if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") return null;

  const { GREENDESERT_BOARD_DEFAULT_MEETING_DATE } = await import(
    "@/lib/greendesert/greendesert-board-pack-model"
  );
  const resolvedMeetingDate = meetingDate || GREENDESERT_BOARD_DEFAULT_MEETING_DATE;
  const pdfBytes = await fetchGreenDesertBoardDeckPdf(resolvedMeetingDate);
  if (!pdfBytes) {
    return toolError(
      "boardpack.generate",
      "Green Desert board deck PDF is temporarily unavailable. Please try again in a moment.",
    );
  }

  const { greendesertBoardDeckPdfFileName, buildGreenDesertBoardPackData } = await import(
    "@/lib/greendesert/greendesert-board-pack-model"
  );
  const pack = buildGreenDesertBoardPackData(resolvedMeetingDate);
  const packName = pack.packName || greenDesertPackNameForDate(resolvedMeetingDate);
  const filename = greendesertBoardDeckPdfFileName(resolvedMeetingDate);
  const slug = ctx.business.workspace.slug?.trim() || "greendesert";

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
      source: ["greendesert:board-pack", "assistant:pdf", "greendesert:api-bridge"],
      pageSize: 1,
      summary: {
        executed: true,
        message: "Green Desert Board Deck Generated Successfully",
        artifactId: pdfArtifact.id,
        pdfArtifactId: pdfArtifact.id,
        pdfOpenUrl,
        pdfDownloadUrl,
        packName,
        title: packName,
        filename,
        meetingDate: resolvedMeetingDate,
        status: pack.status ?? "draft",
        folderPath: pack.folderPath ?? `Corporate Information / Board Deck / ${packName}`,
        boardDeckHref: "/dashboard?view=board-pack",
        pageSummaries: pack.pageSummaries ?? [
          "Cover Page",
          "Executive Summary",
          "Previous Actions",
          "Risk Register",
          "KPI Dashboard",
          "Financial Overview",
          "Operating Performance",
          "Cash & Balance Sheet",
          "Fundraising & Pipeline",
          "Team & Organisation",
          "Strategic Discussion & AOB",
        ],
        stages: [...stages],
      },
    },
  );
}

export async function tryNorthstarProductionBoardPackBridge(
  meetingDate: string | undefined,
  ctx: AssistantToolExecutionContext,
  stages: readonly EaBoardPackStage[] = [],
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
