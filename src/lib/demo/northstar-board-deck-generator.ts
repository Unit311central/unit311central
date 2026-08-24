import {
  buildNorthstarBoardPackData,
  northstarBoardDeckPdfFileName,
} from "@/lib/demo/northstar-board-pack-model";
import { NORTHSTAR_LOGO_SRC } from "@/lib/demo/northstar-surface";
import { buildOnwardAirBoardPackPdf } from "@/lib/onwardair/board-pack-pdf";
import { flattenPngLogoForPdf } from "@/lib/pdf/flatten-logo-for-pdf";

export const NORTHSTAR_BOARD_DECK_BUILD = "2026-08-24-v4";

export type NorthstarBoardDeckResult = {
  data: ReturnType<typeof buildNorthstarBoardPackData>;
  pdfBytes: Uint8Array;
  filename: string;
  pageCount: number;
  build: string;
};

async function loadNorthstarLogoDataUrl(): Promise<string | null> {
  return flattenPngLogoForPdf(NORTHSTAR_LOGO_SRC);
}

export async function generateNorthstarBoardDeck(
  meetingDate?: string,
): Promise<NorthstarBoardDeckResult> {
  const data = buildNorthstarBoardPackData(meetingDate);
  const logoDataUrl = await loadNorthstarLogoDataUrl();
  const pdfBytes = await buildOnwardAirBoardPackPdf(data, logoDataUrl);
  return {
    data,
    pdfBytes,
    filename: northstarBoardDeckPdfFileName(data.meetingDate),
    pageCount: data.pageSummaries?.length ?? 11,
    build: NORTHSTAR_BOARD_DECK_BUILD,
  };
}
