import {
  buildNorthstarBoardPackData,
  northstarBoardDeckPdfFileName,
} from "@/lib/demo/northstar-board-pack-model";
import { buildOnwardAirBoardPackPdf } from "@/lib/onwardair/board-pack-pdf";

export const NORTHSTAR_BOARD_DECK_BUILD = "2026-08-16-v3";

export type NorthstarBoardDeckResult = {
  data: ReturnType<typeof buildNorthstarBoardPackData>;
  pdfBytes: Uint8Array;
  filename: string;
  pageCount: number;
  build: string;
};

async function loadNorthstarLogoDataUrl(): Promise<string | null> {
  try {
    const relative = NORTHSTAR_LOGO_SRC.replace(/^\//, "");
    const bytes = await readFile(join(process.cwd(), "public", relative));
    return `data:image/png;base64,${bytes.toString("base64")}`;
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
