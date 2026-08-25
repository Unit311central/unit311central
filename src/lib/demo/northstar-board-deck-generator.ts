import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  buildNorthstarBoardPackData,
  northstarBoardDeckPdfFileName,
} from "@/lib/demo/northstar-board-pack-model";
import { NORTHSTAR_LOGO_PRINT_SRC } from "@/lib/demo/northstar-surface";
import { buildOnwardAirBoardPackPdf } from "@/lib/onwardair/board-pack-pdf";

export const NORTHSTAR_BOARD_DECK_BUILD = "2026-08-24-v5";

export type NorthstarBoardDeckResult = {
  data: ReturnType<typeof buildNorthstarBoardPackData>;
  pdfBytes: Uint8Array;
  filename: string;
  pageCount: number;
  build: string;
};

async function loadNorthstarLogoDataUrl(): Promise<string | null> {
  try {
    const relative = NORTHSTAR_LOGO_PRINT_SRC.replace(/^\//, "");
    const bytes = await readFile(join(process.cwd(), "public", relative));
    return `data:image/jpeg;base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function generateNorthstarBoardDeck(
  meetingDate?: string,
): Promise<NorthstarBoardDeckResult> {
  const data = buildNorthstarBoardPackData(meetingDate);
  const pdfBytes = await buildOnwardAirBoardPackPdf(data, null);
  return {
    data,
    pdfBytes,
    filename: northstarBoardDeckPdfFileName(data.meetingDate),
    pageCount: data.pageSummaries?.length ?? 11,
    build: NORTHSTAR_BOARD_DECK_BUILD,
  };
}
