import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { buildOnwardAirBoardPackData } from "@/lib/onwardair/board-pack-model";
import type { AbhiBoardPackData } from "@/lib/abhi/board-pack-model";
import {
  oaBoardPackPdfFileName,
  buildOnwardAirBoardPackPdf,
} from "@/lib/onwardair/board-pack-pdf";
import {
  oaBoardPackPptxFileName,
  buildOnwardAirBoardPackPptx,
} from "@/lib/onwardair/board-pack-pptx";
import { OA_BOARD_PACK_STAGES } from "@/lib/onwardair/board-pack-stages";
import { ONWARDAIR_LOGO_DARK_PNG_SRC } from "@/lib/onwardair-surface";
import type { EaBoardPackConfig } from "@/lib/ai-operating-assistant/workspace-packs/types";

async function loadLogo(): Promise<string | null> {
  try {
    const relative = ONWARDAIR_LOGO_DARK_PNG_SRC.replace(/^\//, "");
    const bytes = await readFile(join(process.cwd(), "public", relative));
    return `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

export const onwardAirBoardPackConfig: EaBoardPackConfig = {
  supportsBoardPack: true,
  stages: OA_BOARD_PACK_STAGES,
  buildPackData: (meetingDate) => buildOnwardAirBoardPackData(meetingDate),
  loadLogoDataUrl: loadLogo,
  async generateArtifacts(data, logoDataUrl, meetingDate) {
    const pack = buildOnwardAirBoardPackData(meetingDate);
    const resolved = (data ?? pack) as AbhiBoardPackData;
    const [pdfBytes, pptxBytes] = await Promise.all([
      buildOnwardAirBoardPackPdf(resolved, logoDataUrl),
      buildOnwardAirBoardPackPptx(resolved, logoDataUrl),
    ]);
    return {
      pdfBytes,
      pptxBytes,
      pdfFilename: oaBoardPackPdfFileName(pack.meetingDate),
      pptxFilename: oaBoardPackPptxFileName(pack.meetingDate),
      packName: pack.packName,
      meetingDate: pack.meetingDate,
      status: pack.status,
      folderPath: pack.folderPath,
      pageSummaries: pack.pageSummaries,
      sourceTags: [
        "onwardair:board-pack",
        "onwardair:financials",
        "onwardair:fundraising",
        "onwardair:board-data",
        "assistant:pptx",
        "assistant:pdf",
      ],
      successMessage: "OnwardAir Board Deck Generated Successfully",
    };
  },
};
