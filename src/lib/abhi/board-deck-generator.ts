import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ABHI_LOGO_SRC } from "@/lib/abhi-surface";
import { buildAbhiBoardPackData } from "@/lib/abhi/board-pack-model";
import { abhiBoardPackPdfFileName, buildAbhiBoardPackPdf } from "@/lib/abhi/board-pack-pdf";
import { resolveAbhiBoardPackMeetingDate } from "@/lib/abhi/board-pack-date";

/** Bump when board deck layout changes — shown in PDF footer and /testing UI. */
export const ABHI_BOARD_DECK_BUILD = "2026-08-09-v1";

export type AbhiBoardDeckResult = {
  data: ReturnType<typeof buildAbhiBoardPackData>;
  pdfBytes: Uint8Array;
  filename: string;
  pageCount: number;
  build: string;
};

async function loadAbhiLogoDataUrl(): Promise<string | null> {
  try {
    const relative = ABHI_LOGO_SRC.replace(/^\//, "");
    const primaryPath = join(process.cwd(), "public", relative);
    try {
      const bytes = await readFile(primaryPath);
      return `data:image/png;base64,${bytes.toString("base64")}`;
    } catch {
      const jpgPath = join(process.cwd(), "public", "images", "workspaces", "abhi.jpg");
      const bytes = await readFile(jpgPath);
      return `data:image/jpeg;base64,${bytes.toString("base64")}`;
    }
  } catch {
    return null;
  }
}

export async function generateAbhiBoardDeck(meetingDate?: string): Promise<AbhiBoardDeckResult> {
  const resolved = resolveAbhiBoardPackMeetingDate({ explicitDate: meetingDate });
  const meetingDateIso = resolved.ok ? resolved.meetingDate : undefined;
  const data = buildAbhiBoardPackData(meetingDateIso);
  const logoDataUrl = await loadAbhiLogoDataUrl();
  const pdfBytes = await buildAbhiBoardPackPdf(data, logoDataUrl);
  return {
    data,
    pdfBytes,
    filename: abhiBoardPackPdfFileName(data.meetingDate),
    pageCount: data.pageSummaries?.length ?? 11,
    build: ABHI_BOARD_DECK_BUILD,
  };
}
