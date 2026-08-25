/**
 * Northstar Demo — board pack / deck records (ABHI-style, Northstar branding).
 */

import {
  northstarBoardDeckPdfUrl,
} from "@/lib/demo/northstar-board-pack-model";
import { DEMO_COMPANY_SHORT_NAME } from "@/lib/demo/demo-company-identity";

export type NorthstarBoardPackRecord = {
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

const STORAGE_KEY = "unit311-demo-board-packs-v4";

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
      id: "demo-deck-q1-2026",
      packName: `${DEMO_COMPANY_SHORT_NAME} Board Pack — Q1 2026`,
      meetingDate: "2026-03-20",
      meetingId: "DEMO-BM-2026-Q1",
      quarter: "Q1 2026",
      status: "Approved",
      createdAt: "2026-03-12T10:00:00.000Z",
      pdfOpenUrl: q1.api,
      pptxDownloadUrl: q1.download,
      folderPath: "Board/Demo/2026/Q1",
      pageSummaries: [
        "CEO trading update",
        "Margin recovery dashboard",
        "Platform delivery status",
        "Risk register (board view)",
        "Cash & AR ageing",
      ],
    },
    {
      id: "demo-deck-q2-2026",
      packName: `${DEMO_COMPANY_SHORT_NAME} Board Pack — Q2 2026`,
      meetingDate: "2026-06-19",
      meetingId: "DEMO-BM-2026-Q2",
      quarter: "Q2 2026",
      status: "Approved",
      createdAt: "2026-06-11T10:00:00.000Z",
      pdfOpenUrl: q2.api,
      pptxDownloadUrl: q2.download,
      folderPath: "Board/Demo/2026/Q2",
      pageSummaries: [
        "Q2 financial results",
        "UK SME growth update",
        "Supplier diversification MOU",
        "Customer QBR summary",
        "2026 outlook",
      ],
    },
    {
      id: "demo-deck-q3-2026-draft",
      packName: `${DEMO_COMPANY_SHORT_NAME} Board Pack — Q3 2026 (Draft)`,
      meetingDate: "2026-09-18",
      meetingId: "DEMO-BM-2026-Q3",
      quarter: "Q3 2026",
      status: "Draft",
      createdAt: "2026-08-20T14:00:00.000Z",
      pdfOpenUrl: q3.api,
      pptxDownloadUrl: q3.download,
      folderPath: "Board/Demo/2026/Q3",
      pageSummaries: [
        "CEO update (draft)",
        "Product GA readiness",
        "Margin vs target",
        "Risk summary",
      ],
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

export function archiveNorthstarBoardPack(id: string): boolean {
  const record = getNorthstarBoardPack(id);
  if (!record || record.status === "Archived") return false;
  saveNorthstarBoardPack({ ...record, status: "Archived" });
  return true;
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
    packName: `${DEMO_COMPANY_SHORT_NAME} Board Pack — ${input.quarter} (Draft)`,
    meetingDate: input.meetingDate,
    meetingId: input.meetingId,
    quarter: input.quarter,
    status: "Draft",
    createdAt: new Date().toISOString(),
    pdfOpenUrl: urls.api,
    pptxDownloadUrl: urls.download,
    folderPath: `Board/Demo/${input.quarter.replace(/\s/g, "-")}`,
    pageSummaries: [
      "Executive summary",
      "Prior actions & decisions",
      "Financial overview",
      "Risk summary",
      "Strategic topics",
    ],
  };
}

/** Resolve preview/download URL — always use on-demand API so demo middleware never rewrites to the shell. */
export function resolveNorthstarPackPdfUrl(meetingDate: string, _storedUrl?: string): string {
  return northstarBoardDeckPdfUrl(meetingDate, "inline");
}

export function resolveNorthstarPackDownloadUrl(meetingDate: string, _storedUrl?: string): string {
  return northstarBoardDeckPdfUrl(meetingDate, "attachment");
}
