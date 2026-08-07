import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { AbhiBoardPackData } from "@/lib/abhi/board-pack-model";
import { buildTalantonBoardPackData, talantonBoardPackPdfFileName } from "@/lib/talanton/board-pack-model";
import { buildTalantonBoardPackPdf } from "@/lib/talanton/board-pack-pdf";
import { loadTalantonBoardPackAssets } from "@/lib/talanton/board-pack-assets";
import { listJourneyStoriesForBoard } from "@/lib/talanton/journey-stories-store";

const TALANTON_LOGO_SRC = "/images/workspaces/talantonimpact-t.jpg";

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

async function loadTalantonLogoDataUrl(): Promise<string | null> {
  try {
    const relative = TALANTON_LOGO_SRC.replace(/^\//, "");
    const bytes = await readFile(join(process.cwd(), "public", relative));
    return `data:image/jpeg;base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

export type TalantonBoardDeckResult = {
  data: AbhiBoardPackData;
  pdfBytes: Uint8Array;
  filename: string;
  pageCount: number;
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
  };
}
