import type { AbhiBoardPackData } from "@/lib/abhi/board-pack-model";
import { generateGreenDesertBoardDeck } from "@/lib/greendesert/greendesert-board-deck-generator";
import {
  buildGreenDesertBoardPackData,
  greendesertBoardDeckPdfFileName,
  greendesertBoardDeckSampleFileNames,
} from "@/lib/greendesert/greendesert-board-pack-model";
import { GREENDESERT_BOARD_PACK_STAGES } from "@/lib/greendesert/greendesert-board-pack-stages";
import type { EaBoardPackConfig } from "@/lib/ai-operating-assistant/workspace-packs/types";

async function loadLogo(): Promise<string | null> {
  const { GREENDESERT_WORKSPACE_LOGO_SRC } = await import("@/lib/greendesert-surface");
  try {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const relative = GREENDESERT_WORKSPACE_LOGO_SRC.replace(/^\//, "");
    const bytes = await readFile(join(process.cwd(), "public", relative));
    return `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
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

async function loadStaticGreenDesertBoardDeckPdf(meetingDate: string): Promise<Uint8Array | null> {
  if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
    const apiPdf = await fetchGreenDesertBoardDeckPdf(meetingDate);
    if (apiPdf) return apiPdf;

    const origin =
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "https://greendesert.unit311central.com";
    for (const sampleName of greendesertBoardDeckSampleFileNames(meetingDate)) {
      try {
        const res = await fetch(`${origin}/samples/${sampleName}`, { cache: "no-store" });
        const contentType = res.headers.get("content-type") ?? "";
        if (res.ok && contentType.includes("pdf")) {
          return new Uint8Array(await res.arrayBuffer());
        }
      } catch {
        /* try next */
      }
    }
  }

  const { readFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  for (const sampleName of greendesertBoardDeckSampleFileNames(meetingDate)) {
    try {
      const bytes = await readFile(join(process.cwd(), "public", "samples", sampleName));
      if (bytes.length > 0) return new Uint8Array(bytes);
    } catch {
      /* try next */
    }
  }
  return null;
}

export const greendesertBoardPackConfig: EaBoardPackConfig = {
  supportsBoardPack: true,
  stages: GREENDESERT_BOARD_PACK_STAGES,
  buildPackData: (meetingDate) => buildGreenDesertBoardPackData(meetingDate),
  loadLogoDataUrl: loadLogo,
  async generateArtifacts(_data, _logoDataUrl, meetingDate) {
    const pack = buildGreenDesertBoardPackData(meetingDate);
    let deck: Awaited<ReturnType<typeof generateGreenDesertBoardDeck>> | null = null;

    if (process.env.VERCEL === "1" || process.env.NODE_ENV === "production") {
      const staticPdf = await loadStaticGreenDesertBoardDeckPdf(pack.meetingDate);
      if (staticPdf) {
        deck = {
          data: pack,
          pdfBytes: staticPdf,
          filename: greendesertBoardDeckPdfFileName(pack.meetingDate),
          pageCount: pack.pageSummaries?.length ?? 11,
          build: "static-fallback",
        };
      }
    }

    if (!deck) {
      try {
        deck = await generateGreenDesertBoardDeck(meetingDate);
      } catch (error) {
        const staticPdf = await loadStaticGreenDesertBoardDeckPdf(pack.meetingDate);
        if (!staticPdf) {
          const detail = error instanceof Error ? error.message : "PDF generation failed";
          throw new Error(`Green Desert board deck PDF: ${detail}`);
        }
        console.error("[greendesert-board-pack] live PDF failed — static sample fallback", error);
        deck = {
          data: pack,
          pdfBytes: staticPdf,
          filename: greendesertBoardDeckPdfFileName(pack.meetingDate),
          pageCount: pack.pageSummaries?.length ?? 11,
          build: "static-fallback",
        };
      }
    }

    const resolved = (deck.data ?? pack) as AbhiBoardPackData;

    return {
      pdfBytes: deck.pdfBytes,
      pdfFilename: greendesertBoardDeckPdfFileName(resolved.meetingDate),
      packName: resolved.packName,
      meetingDate: resolved.meetingDate,
      status: resolved.status,
      folderPath: resolved.folderPath,
      pageSummaries: resolved.pageSummaries,
      sourceTags: [
        "greendesert:board-pack",
        "greendesert:engineering",
        "greendesert:fundraising",
        "greendesert:board-data",
        "assistant:pdf",
        ...(deck.build === "static-fallback" ? ["greendesert:api-bridge"] : []),
      ],
      successMessage: "Green Desert Board Deck Generated Successfully",
    };
  },
};
