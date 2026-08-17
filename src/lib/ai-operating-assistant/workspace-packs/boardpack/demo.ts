import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { buildAbhiBoardPackPptx } from "@/lib/abhi/board-pack-pptx";
import type { AbhiBoardPackData } from "@/lib/abhi/board-pack-model";
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
    const deck = await generateNorthstarBoardDeck(meetingDate);
    const resolved = (deck.data ?? pack) as AbhiBoardPackData;
    const pptxBytes = await buildAbhiBoardPackPptx(resolved, logoDataUrl);
    return {
      pdfBytes: deck.pdfBytes,
      pptxBytes,
      pdfFilename: northstarBoardDeckPdfFileName(pack.meetingDate),
      pptxFilename: northstarBoardPackPptxFileName(pack.meetingDate),
      packName: pack.packName,
      meetingDate: pack.meetingDate,
      status: pack.status,
      folderPath: pack.folderPath,
      pageSummaries: pack.pageSummaries,
      sourceTags: [
        "northstar:board-pack",
        "northstar:financial-model",
        "northstar:board-data",
        "assistant:pptx",
        "assistant:pdf",
      ],
      successMessage: "Northstar Board Pack Generated Successfully",
    };
  },
};
