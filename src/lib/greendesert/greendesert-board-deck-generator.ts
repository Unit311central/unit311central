import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  buildGreenDesertBoardPackData,
  greendesertBoardDeckPdfFileName,
} from "@/lib/greendesert/greendesert-board-pack-model";
import {
  GREENDESERT_WORKSPACE_LOGO_SRC,
} from "@/lib/greendesert-surface";
import { buildOnwardAirBoardPackPdf } from "@/lib/onwardair/board-pack-pdf";

export const GREENDESERT_BOARD_DECK_BUILD = "2026-09-04-v1";

export type GreenDesertBoardDeckResult = {
  data: ReturnType<typeof buildGreenDesertBoardPackData>;
  pdfBytes: Uint8Array;
  filename: string;
  pageCount: number;
  build: string;
};

async function loadGreenDesertLogoDataUrl(): Promise<string | null> {
  try {
    const relative = GREENDESERT_WORKSPACE_LOGO_SRC.replace(/^\//, "");
    const bytes = await readFile(join(process.cwd(), "public", relative));
    return `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function generateGreenDesertBoardDeck(
  meetingDate?: string,
): Promise<GreenDesertBoardDeckResult> {
  const data = buildGreenDesertBoardPackData(meetingDate);
  const logoDataUrl = await loadGreenDesertLogoDataUrl();
  const pdfBytes = await buildOnwardAirBoardPackPdf(data, logoDataUrl);
  return {
    data,
    pdfBytes,
    filename: greendesertBoardDeckPdfFileName(data.meetingDate),
    pageCount: (data.pageSummaries?.length ?? 10) + 1,
    build: GREENDESERT_BOARD_DECK_BUILD,
  };
}
