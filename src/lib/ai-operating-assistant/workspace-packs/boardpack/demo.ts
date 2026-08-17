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
    let deck;
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
