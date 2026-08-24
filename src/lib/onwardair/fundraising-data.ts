/**
 * OnwardAir Fundraising — demo seed + helpers.
 * Pre-seed raised / investor counts derive from Cap Table Management.
 */

import type { CorporateShareholder } from "@/lib/corporate-data";

export const ONWARDAIR_CAPITAL_COMMITTED_USD = 1_700_000;
export const ONWARDAIR_SEED_RAISE_TARGET_USD = 5_000_000;

export type FundingRoundId = "pre-seed" | "seed" | "series-a" | "series-b";
export type FundingRoundStatus = "Active" | "Closed" | "Planned" | "Future";

export type FundingRoundSummary = {
  id: FundingRoundId;
  name: string;
  status: FundingRoundStatus;
  focus: string;
  typicalUse: string;
  targetUsd: number | null;
  notes: string;
};

export type FundraisingPipelineStage =
  | "Intro"
  | "Pitch sent"
  | "Meeting"
  | "Diligence"
  | "Term sheet"
  | "Passed";

export type FundraisingPipelineDeal = {
  id: string;
  investor: string;
  firm: string;
  stage: FundraisingPipelineStage;
  amountUsd: number;
  owner: string;
  lastTouch: string;
  notes: string;
};

export type FundraisingMeeting = {
  id: string;
  title: string;
  investor: string;
  firm: string;
  withWhom: string;
  date: string;
  time: string;
  meetingLink: string;
  pitchDeckSent: boolean;
  owner: string;
  status: "Scheduled" | "Confirmed";
};

export type PitchDeckVersion = {
  id: string;
  version: string;
  title: string;
  dateAdded: string;
  lastUpdatedAt: string;
  lastUpdatedBy: string;
  fileName: string;
  notes: string;
};

export type DataRoomRow = {
  id: string;
  investor: string;
  firm: string;
  folderLink: string;
  lastUpdatedAt: string;
  lastUpdatedBy: string;
  documents: number;
  status: "Open" | "Restricted" | "Revoked";
};

export const FUNDING_ROUNDS: FundingRoundSummary[] = [
  {
    id: "pre-seed",
    name: "Pre-Seed",
    status: "Closed",
    focus: "Founding capital & strategic angels",
    typicalUse:
      "Team, IP consolidation, early Vertex VTOL / FLEX Pod prototyping, and go-to-market proof points.",
    targetUsd: ONWARDAIR_CAPITAL_COMMITTED_USD,
    notes: "Closed against Cap Table Management. Raised and investor counts sync from the shareholder register.",
  },
  {
    id: "seed",
    name: "Seed",
    status: "Active",
    focus: "Prototype → flight-ready path",
    typicalUse:
      "Engineering scale-up, flight testing prep, certification pathway work, and first operator partnerships.",
    targetUsd: ONWARDAIR_SEED_RAISE_TARGET_USD,
    notes: "Active raise — pipeline in progress; not closed.",
  },
  {
    id: "series-a",
    name: "Series A",
    status: "Future",
    focus: "Certification & production readiness",
    typicalUse:
      "Type certification progress, manufacturing partners, and scaled logistics / defence pilot programs.",
    targetUsd: null,
    notes: "Future institutional round — not yet active.",
  },
  {
    id: "series-b",
    name: "Series B",
    status: "Future",
    focus: "Commercial scale",
    typicalUse:
      "Fleet production, operator network expansion, and multi-mission commercial deployment.",
    targetUsd: null,
    notes: "Future growth round — not yet active.",
  },
];

/** External capital investors on the OnwardAir cap table (excludes founders + ESOP). */
export function isCapTableExternalInvestor(row: CorporateShareholder): boolean {
  const id = String(row.id).toLowerCase();
  if (
    id.includes("founder") ||
    id.includes("esop") ||
    id === "sh-paul" ||
    id === "sh-hannes"
  ) {
    return false;
  }
  if (row.shareClass === "Options") return false;
  const name = row.shareholder.toLowerCase();
  if (
    name.includes("founding team") ||
    name.includes("employee option") ||
    name.includes("paul fotheringham") ||
    name.includes("hannes weber")
  ) {
    return false;
  }
  return true;
}

export function getPreSeedFromCapTable(shareholders: CorporateShareholder[]): {
  raisedUsd: number;
  investorCount: number;
  investors: CorporateShareholder[];
} {
  const investors = shareholders.filter(isCapTableExternalInvestor);
  return {
    raisedUsd: ONWARDAIR_CAPITAL_COMMITTED_USD,
    investorCount: investors.length,
    investors,
  };
}

export function formatUsdCompact(amount: number): string {
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${Math.round(amount / 1_000)}k`;
  }
  return `$${amount.toLocaleString("en-US")}`;
}

export function formatUsdFull(amount: number): string {
  return `$${amount.toLocaleString("en-US")}`;
}

/** Seed round pipeline — ongoing / not finished. */
export const FUNDRAISING_PIPELINE: FundraisingPipelineDeal[] = [
  {
    id: "oa-pipe-01",
    investor: "Elena Vasquez",
    firm: "Horizon Aero Capital",
    stage: "Diligence",
    amountUsd: 1_250_000,
    owner: "Dr. Scott Parazynski",
    lastTouch: "2026-07-28",
    notes: "Seed lead candidate · data room open · term sheet draft in review",
  },
  {
    id: "oa-pipe-02",
    investor: "Marcus Chen",
    firm: "Pacific Flight Partners",
    stage: "Meeting",
    amountUsd: 750_000,
    owner: "Rick Perez",
    lastTouch: "2026-07-30",
    notes: "Second call scheduled · interest in defence-logistics thesis",
  },
  {
    id: "oa-pipe-03",
    investor: "Priya Nair",
    firm: "Atlas Ventures Mobility",
    stage: "Pitch sent",
    amountUsd: 500_000,
    owner: "Dr. Scott Parazynski",
    lastTouch: "2026-08-01",
    notes: "Deck v1.5 sent · awaiting IC feedback",
  },
  {
    id: "oa-pipe-04",
    investor: "Jordan Blake",
    firm: "Skyline Angels",
    stage: "Intro",
    amountUsd: 250_000,
    owner: "Dylan Taylor",
    lastTouch: "2026-08-02",
    notes: "Warm intro via Taylor network · angel syndicate seat",
  },
  {
    id: "oa-pipe-05",
    investor: "Sofia Rahman",
    firm: "Northstar Deep Tech",
    stage: "Term sheet",
    amountUsd: 1_000_000,
    owner: "Rick Perez",
    lastTouch: "2026-07-25",
    notes: "Soft circle · legal reviewing preferred terms",
  },
  {
    id: "oa-pipe-06",
    investor: "Tom Hughes",
    firm: "Vector Seed Fund",
    stage: "Passed",
    amountUsd: 400_000,
    owner: "Cameron Burr",
    lastTouch: "2026-07-18",
    notes: "Passed on timing — revisit after first flight demo",
  },
];

export const FUNDRAISING_MEETINGS: FundraisingMeeting[] = [
  {
    id: "oa-meet-01",
    title: "Seed diligence deep-dive",
    investor: "Elena Vasquez",
    firm: "Horizon Aero Capital",
    withWhom: "Dr. Scott Parazynski, Rick Perez",
    date: "2026-08-06",
    time: "10:00 CT",
    meetingLink: "https://meet.onwardair.example/seed-horizon-0608",
    pitchDeckSent: true,
    owner: "Dr. Scott Parazynski",
    status: "Confirmed",
  },
  {
    id: "oa-meet-02",
    title: "Partnership & capital intro",
    investor: "Marcus Chen",
    firm: "Pacific Flight Partners",
    withWhom: "Rick Perez, Cameron Burr",
    date: "2026-08-07",
    time: "14:30 CT",
    meetingLink: "https://meet.onwardair.example/seed-pacific-0708",
    pitchDeckSent: true,
    owner: "Rick Perez",
    status: "Confirmed",
  },
  {
    id: "oa-meet-03",
    title: "First pitch — Atlas Mobility",
    investor: "Priya Nair",
    firm: "Atlas Ventures Mobility",
    withWhom: "Dr. Scott Parazynski",
    date: "2026-08-08",
    time: "09:00 CT",
    meetingLink: "https://meet.onwardair.example/seed-atlas-0808",
    pitchDeckSent: true,
    owner: "Dr. Scott Parazynski",
    status: "Scheduled",
  },
  {
    id: "oa-meet-04",
    title: "Angel syndicate coffee",
    investor: "Jordan Blake",
    firm: "Skyline Angels",
    withWhom: "Dylan Taylor, Dr. Scott Parazynski",
    date: "2026-08-11",
    time: "16:00 CT",
    meetingLink: "https://meet.onwardair.example/seed-skyline-1108",
    pitchDeckSent: false,
    owner: "Dylan Taylor",
    status: "Scheduled",
  },
  {
    id: "oa-meet-05",
    title: "Term sheet walkthrough",
    investor: "Sofia Rahman",
    firm: "Northstar Deep Tech",
    withWhom: "Rick Perez, Outside Counsel",
    date: "2026-08-13",
    time: "11:30 CT",
    meetingLink: "https://meet.onwardair.example/seed-northstar-1308",
    pitchDeckSent: true,
    owner: "Rick Perez",
    status: "Confirmed",
  },
];

export const FUNDRAISING_PITCH_DECKS: PitchDeckVersion[] = [
  {
    id: "oa-deck-15",
    version: "1.5",
    title: "OnwardAir Seed Pitch — Flight Path",
    dateAdded: "2026-07-28",
    lastUpdatedAt: "2026-08-01T16:40:00.000Z",
    lastUpdatedBy: "Dr. Scott Parazynski",
    fileName: "OnwardAir_Pitch_v1.5.pdf",
    notes: "Current investor deck · certification timeline + seed ask",
  },
  {
    id: "oa-deck-14",
    version: "1.4",
    title: "OnwardAir Seed Pitch — Flight Path",
    dateAdded: "2026-06-20",
    lastUpdatedAt: "2026-07-12T11:15:00.000Z",
    lastUpdatedBy: "Rick Perez",
    fileName: "OnwardAir_Pitch_v1.4.pdf",
    notes: "Added FLEX Pod unit economics slide",
  },
  {
    id: "oa-deck-13",
    version: "1.3",
    title: "OnwardAir Pre-Seed / Seed Bridge",
    dateAdded: "2026-05-02",
    lastUpdatedAt: "2026-05-18T09:00:00.000Z",
    lastUpdatedBy: "Cameron Burr",
    fileName: "OnwardAir_Pitch_v1.3.pdf",
    notes: "Pre-close update for network angels",
  },
  {
    id: "oa-deck-12",
    version: "1.2",
    title: "OnwardAir Investor Overview",
    dateAdded: "2026-03-14",
    lastUpdatedAt: "2026-04-02T14:22:00.000Z",
    lastUpdatedBy: "Dylan Taylor",
    fileName: "OnwardAir_Pitch_v1.2.pdf",
    notes: "Market sizing refresh",
  },
  {
    id: "oa-deck-11",
    version: "1.1",
    title: "OnwardAir Investor Overview",
    dateAdded: "2026-01-22",
    lastUpdatedAt: "2026-02-08T10:05:00.000Z",
    lastUpdatedBy: "Dr. Scott Parazynski",
    fileName: "OnwardAir_Pitch_v1.1.pdf",
    notes: "Team + IP narrative tightened",
  },
];

/** Five active data rooms for current investors. */
export const FUNDRAISING_DATA_ROOMS: DataRoomRow[] = [
  {
    id: "oa-dr-01",
    investor: "Elena Vasquez",
    firm: "Horizon Aero Capital",
    folderLink: "https://files.onwardair.example/data-rooms/horizon-aero",
    lastUpdatedAt: "2026-08-01T18:20:00.000Z",
    lastUpdatedBy: "Rick Perez",
    documents: 42,
    status: "Open",
  },
  {
    id: "oa-dr-02",
    investor: "Sofia Rahman",
    firm: "Northstar Deep Tech",
    folderLink: "https://files.onwardair.example/data-rooms/northstar",
    lastUpdatedAt: "2026-07-29T12:05:00.000Z",
    lastUpdatedBy: "Dr. Scott Parazynski",
    documents: 38,
    status: "Open",
  },
  {
    id: "oa-dr-03",
    investor: "Rick Perez",
    firm: "1588 Ventures",
    folderLink: "https://files.onwardair.example/data-rooms/1588-ventures",
    lastUpdatedAt: "2026-07-22T09:40:00.000Z",
    lastUpdatedBy: "Cameron Burr",
    documents: 51,
    status: "Open",
  },
  {
    id: "oa-dr-04",
    investor: "Marcus Chen",
    firm: "Pacific Flight Partners",
    folderLink: "https://files.onwardair.example/data-rooms/pacific-flight",
    lastUpdatedAt: "2026-07-30T15:10:00.000Z",
    lastUpdatedBy: "Rick Perez",
    documents: 24,
    status: "Restricted",
  },
  {
    id: "oa-dr-05",
    investor: "Dylan Taylor",
    firm: "Network Angel (Taylor)",
    folderLink: "https://files.onwardair.example/data-rooms/taylor-angel",
    lastUpdatedAt: "2026-07-15T11:00:00.000Z",
    lastUpdatedBy: "Dylan Taylor",
    documents: 19,
    status: "Open",
  },
];
