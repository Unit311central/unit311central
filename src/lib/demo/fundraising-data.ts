/**
 * Northstar Demo — generic fundraising data (not OnwardAir-specific).
 */

export type DemoFundingRound = {
  id: string;
  label: string;
  amountGbp: number;
  year: number;
  lead: string;
  status: "closed" | "in_progress";
  investors: string[];
};

export type DemoInvestor = {
  id: string;
  firm: string;
  contact: string;
  stage: string;
  status: "portfolio" | "pipeline" | "passed";
  lastContact: string;
};

/** £1M pre-seed (2023) — sole closed round to date. */
export const NORTHSTAR_FUNDING_ROUNDS: readonly DemoFundingRound[] = [
  {
    id: "pre-seed-2023",
    label: "Pre-seed",
    amountGbp: 1_000_000,
    year: 2023,
    lead: "Northern Tech Ventures",
    status: "closed",
    investors: [
      "Northern Tech Ventures (UK VC)",
      "Harwood Family Capital (UK family office)",
      "Selby Private Investments (UK family office)",
      "Elena Hart (UK angel)",
      "Austin Industrial Partners (US angel)",
    ],
  },
  {
    id: "seed-2026",
    label: "Seed (in progress)",
    amountGbp: 5_000_000,
    year: 2026,
    lead: "Midlands Growth Partners",
    status: "in_progress",
    investors: ["Midlands Growth Partners", "Industrial Innovation Fund", "Pipeline investors"],
  },
];

export const NORTHSTAR_SERIES_A_TARGET_GBP = 15_000_000;

export const NORTHSTAR_TOTAL_RAISED_GBP = 1_000_000;

export const NORTHSTAR_INVESTORS: readonly DemoInvestor[] = [
  {
    id: "inv-ntv",
    firm: "Northern Tech Ventures",
    contact: "David Chen",
    stage: "Pre-seed lead",
    status: "portfolio",
    lastContact: "2026-07-14",
  },
  {
    id: "inv-hfc",
    firm: "Harwood Family Capital",
    contact: "Sarah Harwood",
    stage: "Pre-seed",
    status: "portfolio",
    lastContact: "2026-06-02",
  },
  {
    id: "inv-selby",
    firm: "Selby Private Investments",
    contact: "Mark Selby",
    stage: "Pre-seed",
    status: "portfolio",
    lastContact: "2026-05-18",
  },
  {
    id: "inv-hart",
    firm: "Elena Hart (angel)",
    contact: "Elena Hart",
    stage: "Pre-seed",
    status: "portfolio",
    lastContact: "2026-08-01",
  },
  {
    id: "inv-aip",
    firm: "Austin Industrial Partners",
    contact: "Robert Klein",
    stage: "Pre-seed (US)",
    status: "portfolio",
    lastContact: "2026-04-22",
  },
  {
    id: "inv-mgp",
    firm: "Midlands Growth Partners",
    contact: "Simon Wright",
    stage: "Seed (£5M target)",
    status: "pipeline",
    lastContact: "2026-08-12",
  },
  {
    id: "inv-iif",
    firm: "Industrial Innovation Fund",
    contact: "Helena Voigt",
    stage: "Seed diligence",
    status: "pipeline",
    lastContact: "2026-08-08",
  },
];

export const NORTHSTAR_FUNDRAISING_PIPELINE = [
  {
    id: "pipe-seed-mgp",
    firm: "Midlands Growth Partners",
    stage: "Term sheet discussion",
    amountGbp: 2_500_000,
    probability: 45,
    nextStep: "Partner meeting Manchester — Aug 2026",
  },
  {
    id: "pipe-seed-iif",
    firm: "Industrial Innovation Fund",
    stage: "Due diligence",
    amountGbp: 1_500_000,
    probability: 35,
    nextStep: "Technical diligence workshop",
  },
  {
    id: "pipe-seed-ntv",
    firm: "Northern Tech Ventures",
    stage: "Follow-on conversations",
    amountGbp: 1_000_000,
    probability: 55,
    nextStep: "Pro-rata for seed round",
  },
];

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
  amountGbp: number;
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

export const NORTHSTAR_SEED_TARGET_GBP = 5_000_000;
