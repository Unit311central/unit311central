import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  buildNorthstarBoardPackData,
  northstarBoardDeckPdfFileName,
} from "@/lib/demo/northstar-board-pack-model";
import { generateNorthstarBoardDeck } from "@/lib/demo/northstar-board-deck-generator";
import { NORTHSTAR_BOARD_PACK_STAGES } from "@/lib/demo/northstar-board-pack-stages";
import { NORTHSTAR_LOGO_SRC } from "@/lib/demo/northstar-surface";
import type { EaBoardPackConfig } from "@/lib/ai-operating-assistant/workspace-packs/types";

async function loadLogo(): Promise<string | null> {
  try {
    const relative = NORTHSTAR_LOGO_SRC.replace(/^\//, "");
    const bytes = await readFile(join(process.cwd(), "public", relative));
    return `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

async function loadStaticNorthstarBoardDeckPdf(meetingDate: string): Promise<Uint8Array | null> {
  const candidates = [
    northstarBoardDeckPdfFileName(meetingDate),
    "northstar-board-deck-2026-09-18.pdf",
    "northstar-board-deck-2026-06-19.pdf",
    "northstar-board-deck-2026-03-20.pdf",
  ];

  if (process.env.VERCEL === "1") {
    const apiPdf = await fetchNorthstarBoardDeckPdf(meetingDate);
    if (apiPdf) return apiPdf;

    const origin =
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "https://demo.unit311central.com";
    for (const filename of candidates) {
      try {
        const res = await fetch(`${origin}/samples/${filename}`, { cache: "no-store" });
        const contentType = res.headers.get("content-type") ?? "";
        if (res.ok && contentType.includes("pdf")) {
          return new Uint8Array(await res.arrayBuffer());
        }
      } catch {
        /* try next */
      }
    }
  }

  for (const filename of candidates) {
    try {
      const bytes = await readFile(join(process.cwd(), "public", "samples", filename));
      if (bytes.length > 0) return new Uint8Array(bytes);
    } catch {
      /* try next */
    }
  }
  return null;
}

async function fetchNorthstarBoardDeckPdf(meetingDate: string): Promise<Uint8Array | null> {
  const origin = "https://demo.unit311central.com";
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
    if (!res.ok || !contentType.includes("pdf")) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export function northstarBoardPackPptxFileName(meetingDate: string): string {
  return `northstar-board-deck-${meetingDate}.pptx`;
}

export const demoBoardPackConfig: EaBoardPackConfig = {
  supportsBoardPack: true,
  stages: NORTHSTAR_BOARD_PACK_STAGES,
  buildPackData: (meetingDate) => buildNorthstarBoardPackData(meetingDate),
  loadLogoDataUrl: loadLogo,
  async generateArtifacts(_data, logoDataUrl, meetingDate) {
    const pack = buildNorthstarBoardPackData(meetingDate);
    let deck: Awaited<ReturnType<typeof generateNorthstarBoardDeck>> | null = null;

    if (process.env.VERCEL === "1") {
      const staticPdf = await loadStaticNorthstarBoardDeckPdf(pack.meetingDate);
      if (staticPdf) {
        deck = {
          data: pack,
          pdfBytes: staticPdf,
          filename: northstarBoardDeckPdfFileName(pack.meetingDate),
          pageCount: pack.pageSummaries?.length ?? 11,
          build: "static-fallback",
        };
      }
    }

    if (!deck) {
      try {
        deck = await generateNorthstarBoardDeck(meetingDate);
      } catch (error) {
        const staticPdf = await loadStaticNorthstarBoardDeckPdf(pack.meetingDate);
        if (!staticPdf) {
          const detail = error instanceof Error ? error.message : "PDF generation failed";
          throw new Error(`Northstar board deck PDF: ${detail}`);
        }
        console.error("[northstar-board-pack] live PDF failed — static sample fallback", error);
        deck = {
          data: pack,
          pdfBytes: staticPdf,
          filename: northstarBoardDeckPdfFileName(pack.meetingDate),
          pageCount: pack.pageSummaries?.length ?? 11,
          build: "static-fallback",
        };
      }
    }

    const resolved = (deck.data ?? pack) as import("@/lib/abhi/board-pack-model").AbhiBoardPackData;
    let pptxBytes: Uint8Array | undefined;
    if (process.env.VERCEL !== "1") {
      try {
        const { buildAbhiBoardPackPptx } = await import("@/lib/abhi/board-pack-pptx");
        pptxBytes = await buildAbhiBoardPackPptx(resolved, logoDataUrl);
      } catch (error) {
        console.error("[northstar-board-pack] PPTX generation failed — PDF only", error);
        pptxBytes = undefined;
      }
    }
    return {
      pdfBytes: deck.pdfBytes,
      pptxBytes,
      pdfFilename: northstarBoardDeckPdfFileName(pack.meetingDate),
      pptxFilename: pptxBytes
        ? northstarBoardPackPptxFileName(pack.meetingDate)
        : undefined,
      packName: pack.packName,
      meetingDate: pack.meetingDate,
      status: pack.status,
      folderPath: pack.folderPath,
      pageSummaries: pack.pageSummaries,
      sourceTags: [
        "northstar:board-pack",
        "northstar:financial-model",
        "northstar:board-data",
        ...(pptxBytes ? ["assistant:pptx"] : []),
        "assistant:pdf",
      ],
      successMessage: "Northstar Board Pack Generated Successfully",
    };
  },
};
