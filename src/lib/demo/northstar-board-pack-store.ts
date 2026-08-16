/**
 * Northstar Demo — board pack / deck records (ABHI-style, Northstar branding).
 */

import {
  northstarBoardDeckPdfUrl,
} from "@/lib/demo/northstar-board-pack-model";
import { NORTHSTAR_LOGO_SRC } from "@/lib/demo/northstar-surface";

export type NorthstarBoardPackRecord = {
  id: string;
  packName: string;
  meetingDate: string;
  meetingId?: string;
  quarter: string;
  status: "Draft" | "Final" | "Approved";
  createdAt: string;
  pdfOpenUrl: string;
  pptxDownloadUrl?: string;
  folderPath: string;
  pageSummaries: string[];
  logoSrc: string;
};

const STORAGE_KEY = "unit311-northstar-board-packs-v3";

function packPdfUrls(meetingDate: string) {
  const api = northstarBoardDeckPdfUrl(meetingDate, "inline");
  const download = northstarBoardDeckPdfUrl(meetingDate, "attachment");
  return { api, download };
}

function seedPacks(): NorthstarBoardPackRecord[] {
  const q1 = packPdfUrls("2026-03-20");
  const q2 = packPdfUrls("2026-06-19");
  const q3 = packPdfUrls("2026-09-18");
  return [
    {
      id: "ns-deck-q1-2026",
      packName: "Northstar Board Pack — Q1 2026",
      meetingDate: "2026-03-20",
      meetingId: "NS-BM-2026-Q1",
      quarter: "Q1 2026",
      status: "Approved",
      createdAt: "2026-03-12T10:00:00.000Z",
      pdfOpenUrl: q1.api,
      pptxDownloadUrl: q1.download,
      folderPath: "Board/Northstar/2026/Q1",
      pageSummaries: [
        "CEO trading update",
        "Margin recovery dashboard",
        "Atlas programme status",
        "Risk register (board view)",
        "Cash & AR ageing",
      ],
      logoSrc: NORTHSTAR_LOGO_SRC,
    },
    {
      id: "ns-deck-q2-2026",
      packName: "Northstar Board Pack — Q2 2026",
      meetingDate: "2026-06-19",
      meetingId: "NS-BM-2026-Q2",
      quarter: "Q2 2026",
      status: "Approved",
      createdAt: "2026-06-11T10:00:00.000Z",
      pdfOpenUrl: q2.api,
      pptxDownloadUrl: q2.download,
      folderPath: "Board/Northstar/2026/Q2",
      pageSummaries: [
        "Q2 financial results",
        "US expansion update",
        "Supplier diversification MOU",
        "Sheffield QBR summary",
        "2026 outlook",
      ],
      logoSrc: NORTHSTAR_LOGO_SRC,
    },
    {
      id: "ns-deck-q3-2026-draft",
      packName: "Northstar Board Pack — Q3 2026 (Draft)",
      meetingDate: "2026-09-18",
      meetingId: "NS-BM-2026-Q3",
      quarter: "Q3 2026",
      status: "Draft",
      createdAt: "2026-08-20T14:00:00.000Z",
      pdfOpenUrl: q3.api,
      pptxDownloadUrl: q3.download,
      folderPath: "Board/Northstar/2026/Q3",
      pageSummaries: [
        "CEO update (draft)",
        "Atlas GA readiness",
        "Margin vs target",
        "Risk summary",
      ],
      logoSrc: NORTHSTAR_LOGO_SRC,
    },
  ];
}

function isLegacyPackUrl(url: string): boolean {
  return (
    url.includes("onwardair") ||
    url.includes("onwardair-board-deck") ||
    url.startsWith("/samples/")
  );
}

function readAll(): NorthstarBoardPackRecord[] {
  if (typeof window === "undefined") return seedPacks();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedPacks();
    const parsed = JSON.parse(raw) as NorthstarBoardPackRecord[];
    if (!Array.isArray(parsed) || parsed.length === 0) return seedPacks();
    if (parsed.some((p) => isLegacyPackUrl(p.pdfOpenUrl))) return seedPacks();
    return parsed;
  } catch {
    return seedPacks();
  }
}

function writeAll(records: NorthstarBoardPackRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function loadNorthstarBoardPacks(): NorthstarBoardPackRecord[] {
  return readAll().sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
}

export function getNorthstarBoardPack(id: string): NorthstarBoardPackRecord | null {
  return readAll().find((record) => record.id === id) ?? null;
}

export function saveNorthstarBoardPack(
  record: NorthstarBoardPackRecord,
): NorthstarBoardPackRecord {
  const current = readAll();
  const index = current.findIndex((item) => item.id === record.id);
  const next = index >= 0 ? [...current] : [record, ...current];
  if (index >= 0) next[index] = record;
  writeAll(next);
  return record;
}

export function deleteNorthstarBoardPack(id: string): boolean {
  if (typeof window === "undefined") return false;
  const current = readAll();
  const next = current.filter((record) => record.id !== id);
  if (next.length === current.length) return false;
  writeAll(next);
  return true;
}

export function createNorthstarBoardPackId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `ns-deck-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `ns-deck-${Date.now().toString(36)}`;
}

export function createNorthstarBoardPackDraft(input: {
  meetingId?: string;
  meetingDate: string;
  quarter: string;
}): NorthstarBoardPackRecord {
  const urls = packPdfUrls(input.meetingDate);
  const id = createNorthstarBoardPackId();
  return {
    id,
    packName: `Northstar Board Pack — ${input.quarter} (Draft)`,
    meetingDate: input.meetingDate,
    meetingId: input.meetingId,
    quarter: input.quarter,
    status: "Draft",
    createdAt: new Date().toISOString(),
    pdfOpenUrl: urls.api,
    pptxDownloadUrl: urls.download,
    folderPath: `Board/Northstar/${input.quarter.replace(/\s/g, "-")}`,
    pageSummaries: [
      "Executive summary",
      "Prior actions & decisions",
      "Financial overview",
      "Risk summary",
      "Strategic topics",
    ],
    logoSrc: NORTHSTAR_LOGO_SRC,
  };
}

/** Resolve preview/download URL — always use on-demand API so demo middleware never rewrites to the shell. */
export function resolveNorthstarPackPdfUrl(meetingDate: string, _storedUrl?: string): string {
  return northstarBoardDeckPdfUrl(meetingDate, "inline");
}

export function resolveNorthstarPackDownloadUrl(meetingDate: string, _storedUrl?: string): string {
  return northstarBoardDeckPdfUrl(meetingDate, "attachment");
}
