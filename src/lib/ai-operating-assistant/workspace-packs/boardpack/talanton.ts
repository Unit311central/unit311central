import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { generateTalantonBoardDeck } from "@/lib/talanton/board-deck-generator";
import {
  buildTalantonBoardPackData,
  talantonBoardPackPdfFileName,
  talantonBoardPackPptxFileName,
} from "@/lib/talanton/board-pack-model";
import type { AbhiBoardPackData } from "@/lib/abhi/board-pack-model";
import { TALANTON_BOARD_PACK_STAGES } from "@/lib/talanton/board-pack-stages";
import type { EaBoardPackConfig } from "@/lib/ai-operating-assistant/workspace-packs/types";

async function loadLogo(): Promise<string | null> {
  try {
    const relative = "images/workspaces/talantonimpact-logo.png";
    const bytes = await readFile(join(process.cwd(), "public", relative));
    return `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

export const talantonBoardPackConfig: EaBoardPackConfig = {
  supportsBoardPack: true,
  stages: TALANTON_BOARD_PACK_STAGES,
  buildPackData: (meetingDate) => buildTalantonBoardPackData(meetingDate),
  loadLogoDataUrl: loadLogo,
  async generateArtifacts(_data, _logoDataUrl, meetingDate) {
    const pack = buildTalantonBoardPackData(meetingDate);
    const deck = await generateTalantonBoardDeck(meetingDate);
    const resolved = (deck.data ?? pack) as AbhiBoardPackData;
    const { buildAbhiBoardPackPptx } = await import("@/lib/abhi/board-pack-pptx");
    const pptxBytes = await buildAbhiBoardPackPptx(resolved, _logoDataUrl);
    return {
      pdfBytes: deck.pdfBytes,
      pptxBytes,
      pdfFilename: talantonBoardPackPdfFileName(pack.meetingDate),
      pptxFilename: talantonBoardPackPptxFileName(pack.meetingDate),
      packName: pack.packName,
      meetingDate: pack.meetingDate,
      status: pack.status,
      folderPath: `Corporate Information / Board Deck / ${pack.packName}`,
      pageSummaries: pack.pageSummaries,
      sourceTags: [
        "talanton:board-pack",
        "talanton:portfolio",
        "talanton:impact",
        "assistant:pptx",
        "assistant:pdf",
      ],
      successMessage: "Talanton Board Deck Generated Successfully",
    };
  },
};
