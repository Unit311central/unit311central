/**
 * Green Desert board pack / deck records (localStorage, Northstar-style).
 */

import {
  GREENDESERT_BOARD_DEFAULT_MEETING_DATE,
  GREENDESERT_COMPANY_SHORT_NAME,
  greendesertBoardDeckPdfUrl,
} from "@/lib/greendesert/greendesert-board-pack-model";

export type GreenDesertBoardPackRecord = {
  id: string;
  packName: string;
  meetingDate: string;
  meetingId?: string;
  quarter: string;
  status: "Draft" | "Final" | "Approved" | "Archived";
  createdAt: string;
  pdfOpenUrl: string;
  pptxDownloadUrl?: string;
  folderPath: string;
  pageSummaries: string[];
};

const STORAGE_KEY = "unit311-greendesert-board-packs-v1";

function packPdfUrls(meetingDate: string) {
  const api = greendesertBoardDeckPdfUrl(meetingDate, "inline");
  const download = greendesertBoardDeckPdfUrl(meetingDate, "attachment");
  return { api, download };
}

function seedPacks(): GreenDesertBoardPackRecord[] {
  const approved = packPdfUrls(GREENDESERT_BOARD_DEFAULT_MEETING_DATE);
  const draft = packPdfUrls("2026-09-18");
  return [
    {
      id: "gd-deck-sep-2026",
      packName: `${GREENDESERT_COMPANY_SHORT_NAME} Board Pack — September 2026`,
      meetingDate: GREENDESERT_BOARD_DEFAULT_MEETING_DATE,
      meetingId: "GD-BM-2026-09",
      quarter: "Q3 2026",
      status: "Approved",
      createdAt: "2026-09-01T10:00:00.000Z",
      pdfOpenUrl: approved.api,
      pptxDownloadUrl: approved.download,
      folderPath: "Board/GreenDesert/2026/Q3",
      pageSummaries: [
        "Executive Summary",
        "Previous Actions",
        "Risk Register",
        "KPI Dashboard",
        "Financial Overview",
        "Operating Performance",
        "Cash & Balance Sheet",
        "Fundraising & Pipeline",
        "Team & Organisation",
        "Strategic Discussion & AOB",
      ],
    },
    {
      id: "gd-deck-q3-draft",
      packName: `${GREENDESERT_COMPANY_SHORT_NAME} Board Pack — Q3 2026 (Draft)`,
      meetingDate: "2026-09-18",
      meetingId: "GD-BM-2026-Q3",
      quarter: "Q3 2026",
      status: "Draft",
      createdAt: "2026-08-28T14:00:00.000Z",
      pdfOpenUrl: draft.api,
      pptxDownloadUrl: draft.download,
      folderPath: "Board/GreenDesert/2026/Q3-draft",
      pageSummaries: [
        "Executive summary (draft)",
        "Jeddah pilot update",
        "Series A pipeline",
        "Risk summary",
      ],
    },
  ];
}

function readAll(): GreenDesertBoardPackRecord[] {
  if (typeof window === "undefined") return seedPacks();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedPacks();
    const parsed = JSON.parse(raw) as GreenDesertBoardPackRecord[];
    if (!Array.isArray(parsed) || parsed.length === 0) return seedPacks();
    if (parsed.some((row) => !row.pdfOpenUrl.includes("/api/greendesert/board-deck"))) {
      return seedPacks();
    }
    return parsed;
  } catch {
    return seedPacks();
  }
}

function writeAll(records: GreenDesertBoardPackRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function loadGreenDesertBoardPacks(): GreenDesertBoardPackRecord[] {
  return readAll().sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
}

export function getGreenDesertBoardPack(id: string): GreenDesertBoardPackRecord | null {
  return readAll().find((record) => record.id === id) ?? null;
}

export function saveGreenDesertBoardPack(record: GreenDesertBoardPackRecord): GreenDesertBoardPackRecord {
  const current = readAll();
  const index = current.findIndex((item) => item.id === record.id);
  const next = index >= 0 ? [...current] : [record, ...current];
  if (index >= 0) next[index] = record;
  writeAll(next);
  return record;
}

export function deleteGreenDesertBoardPack(id: string): boolean {
  if (typeof window === "undefined") return false;
  const current = readAll();
  const next = current.filter((record) => record.id !== id);
  if (next.length === current.length) return false;
  writeAll(next);
  return true;
}

export function createGreenDesertBoardPackId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `gd-deck-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `gd-deck-${Date.now().toString(36)}`;
}

export function archiveGreenDesertBoardPack(id: string): boolean {
  const record = getGreenDesertBoardPack(id);
  if (!record || record.status === "Archived") return false;
  saveGreenDesertBoardPack({ ...record, status: "Archived" });
  return true;
}

export function createGreenDesertBoardPackDraft(input: {
  meetingId?: string;
  meetingDate: string;
  quarter: string;
}): GreenDesertBoardPackRecord {
  const urls = packPdfUrls(input.meetingDate);
  const id = createGreenDesertBoardPackId();
  return {
    id,
    packName: `${GREENDESERT_COMPANY_SHORT_NAME} Board Pack — ${input.quarter} (Draft)`,
    meetingDate: input.meetingDate,
    meetingId: input.meetingId,
    quarter: input.quarter,
    status: "Draft",
    createdAt: new Date().toISOString(),
    pdfOpenUrl: urls.api,
    pptxDownloadUrl: urls.download,
    folderPath: `Board/GreenDesert/${input.quarter.replace(/\s/g, "-")}`,
    pageSummaries: [
      "Executive summary",
      "Prior actions & decisions",
      "Financial overview",
      "Risk summary",
      "Strategic topics",
    ],
  };
}

export function resolveGreenDesertPackPdfUrl(meetingDate: string): string {
  return greendesertBoardDeckPdfUrl(meetingDate, "inline");
}

export function resolveGreenDesertPackDownloadUrl(meetingDate: string): string {
  return greendesertBoardDeckPdfUrl(meetingDate, "attachment");
}

export function listApprovedGreenDesertBoardPacks(): GreenDesertBoardPackRecord[] {
  return loadGreenDesertBoardPacks().filter(
    (pack) => pack.status === "Approved" || pack.status === "Final",
  );
}
