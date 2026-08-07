import { join } from "node:path";

import sharp from "sharp";

import type { AbhiBoardPackData } from "@/lib/abhi/board-pack-model";
import { buildTalantonBoardPackData, talantonBoardPackPdfFileName } from "@/lib/talanton/board-pack-model";
import { buildTalantonBoardPackPdf } from "@/lib/talanton/board-pack-pdf";
import { loadTalantonBoardPackAssets } from "@/lib/talanton/board-pack-assets";
import { listJourneyStoriesForBoard } from "@/lib/talanton/journey-stories-store";

/** Bump when board deck layout changes — shown in PDF footer and /testing UI. */
export const TALANTON_BOARD_DECK_BUILD = "2026-08-08-v3";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function parseTalantonBoardMeetingDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const lower = trimmed.toLowerCase();
  if (/\btomorrow\b/.test(lower)) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toIso(d);
  }
  if (/\btoday\b/.test(lower)) {
    return toIso(new Date());
  }
  if (/\bnext\s+week\b/.test(lower)) {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return toIso(d);
  }
  const iso = trimmed.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso?.[1]) return iso[1];
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return undefined;
  return toIso(new Date(parsed));
}

const TALANTON_LOGO_PATH = join(process.cwd(), "public", "images", "workspaces", "talantonimpact-logo.png");

export async function loadTalantonLogoDataUrl(): Promise<string | null> {
  try {
    const png = await sharp(TALANTON_LOGO_PATH)
      .resize({ width: 1200, withoutEnlargement: false })
      .png({ compressionLevel: 6 })
      .toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

export type TalantonBoardDeckResult = {
  data: AbhiBoardPackData;
  pdfBytes: Uint8Array;
  filename: string;
  pageCount: number;
  build: string;
};

export async function generateTalantonBoardDeck(meetingDate?: string): Promise<TalantonBoardDeckResult> {
  const resolvedDate = parseTalantonBoardMeetingDate(meetingDate);
  const data = buildTalantonBoardPackData(resolvedDate);
  const journeys = listJourneyStoriesForBoard().slice(0, 2);
  const [logoDataUrl, assets] = await Promise.all([
    loadTalantonLogoDataUrl(),
    loadTalantonBoardPackAssets(journeys),
  ]);
  const pdfBytes = await buildTalantonBoardPackPdf(data, logoDataUrl, assets);
  return {
    data,
    pdfBytes,
    filename: talantonBoardPackPdfFileName(data.meetingDate),
    pageCount: data.pageSummaries?.length ?? 10,
    build: TALANTON_BOARD_DECK_BUILD,
  };
}
