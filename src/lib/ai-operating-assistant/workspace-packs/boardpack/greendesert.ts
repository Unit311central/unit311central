import type { AbhiBoardPackData } from "@/lib/abhi/board-pack-model";
import { generateGreenDesertBoardDeck } from "@/lib/greendesert/greendesert-board-deck-generator";
import {
  buildGreenDesertBoardPackData,
  greendesertBoardDeckPdfFileName,
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

export const greendesertBoardPackConfig: EaBoardPackConfig = {
  supportsBoardPack: true,
  stages: GREENDESERT_BOARD_PACK_STAGES,
  buildPackData: (meetingDate) => buildGreenDesertBoardPackData(meetingDate),
  loadLogoDataUrl: loadLogo,
  async generateArtifacts(_data, _logoDataUrl, meetingDate) {
    const pack = buildGreenDesertBoardPackData(meetingDate);
    const deck = await generateGreenDesertBoardDeck(meetingDate);
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
      ],
      successMessage: "Green Desert Board Deck Generated Successfully",
    };
  },
};
