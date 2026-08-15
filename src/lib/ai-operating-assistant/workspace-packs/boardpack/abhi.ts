import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ABHI_LOGO_SRC } from "@/lib/abhi-surface";
import { buildAbhiBoardPackData, type AbhiBoardPackData } from "@/lib/abhi/board-pack-model";
import {
  abhiBoardPackPdfFileName,
  buildAbhiBoardPackPdf,
} from "@/lib/abhi/board-pack-pdf";
import {
  abhiBoardPackPptxFileName,
  buildAbhiBoardPackPptx,
} from "@/lib/abhi/board-pack-pptx";
import { ABHI_BOARD_PACK_STAGES } from "@/lib/abhi/board-pack-stages";
import type { EaBoardPackConfig } from "@/lib/ai-operating-assistant/workspace-packs/types";

async function loadLogo(relativePath: string): Promise<string | null> {
  try {
    const path = join(process.cwd(), "public", relativePath.replace(/^\//, ""));
    const bytes = await readFile(path);
    const mime = relativePath.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
    return `data:${mime};base64,${bytes.toString("base64")}`;
  } catch {
    try {
      const jpgPath = join(process.cwd(), "public", "images", "workspaces", "abhi.jpg");
      const bytes = await readFile(jpgPath);
      return `data:image/jpeg;base64,${bytes.toString("base64")}`;
    } catch {
      return null;
    }
  }
}

export const abhiBoardPackConfig: EaBoardPackConfig = {
  supportsBoardPack: true,
  stages: ABHI_BOARD_PACK_STAGES,
  buildPackData: (meetingDate) => buildAbhiBoardPackData(meetingDate),
  loadLogoDataUrl: () => loadLogo(ABHI_LOGO_SRC),
  async generateArtifacts(data, logoDataUrl, meetingDate) {
    const pack = buildAbhiBoardPackData(meetingDate);
    const resolved = (data ?? pack) as AbhiBoardPackData;
    const [pdfBytes, pptxBytes] = await Promise.all([
      buildAbhiBoardPackPdf(resolved, logoDataUrl),
      buildAbhiBoardPackPptx(resolved, logoDataUrl),
    ]);
    return {
      pdfBytes,
      pptxBytes,
      pdfFilename: abhiBoardPackPdfFileName(pack.meetingDate),
      pptxFilename: abhiBoardPackPptxFileName(pack.meetingDate),
      packName: pack.packName,
      meetingDate: pack.meetingDate,
      status: pack.status,
      folderPath: `Corporate Information / Board Deck / ${pack.packName}`,
      pageSummaries: pack.pageSummaries,
      sourceTags: [
        "abhi:board-pack",
        "abhi:financials",
        "abhi:membership",
        "abhi:risk-register",
        "assistant:pptx",
        "assistant:pdf",
      ],
      successMessage: "Board Pack Generated Successfully",
    };
  },
};
