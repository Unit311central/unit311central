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
  /** Expected close date for in-progress rounds (ISO date). */
  expectedCloseDate?: string;
};

export type InvestorType = "VC" | "Family office" | "Angel" | "Corporate" | "Strategic" | "Other";

export type ShareClassLabel = "Ordinary shares" | "Preference shares" | "Options";

export type ShareTypeLabel = "Equity" | "Options";

export type InvestorDocuments = {
  articlesOfAssociation?: string;
  shareholderAgreement?: string;
  shareCertificate?: string;
};

export type DemoInvestor = {
  id: string;
  /** Company / fund name */
  fundName: string;
  leadContact: string;
  investorType: InvestorType;
  investmentAmountGbp: number;
  ownershipPct: number;
  sharesIssued: number;
  shareClass: ShareClassLabel;
  shareType: ShareTypeLabel;
  round: string;
  status: "portfolio" | "pipeline" | "passed";
  lastContact: string;
  documents: InvestorDocuments;
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
      "Webb Capital Partners (UK private investor)",
      "Austin Industrial Partners (US private investor)",
    ],
  },
  {
    id: "seed-2026",
    label: "Seed (in progress)",
    amountGbp: 5_000_000,
    year: 2026,
    lead: "Midlands Growth Partners",
    status: "in_progress",
    expectedCloseDate: "2026-12-15",
    investors: ["Midlands Growth Partners", "Industrial Innovation Fund", "Pipeline investors"],
  },
];

export const NORTHSTAR_SERIES_A_TARGET_GBP = 15_000_000;

export const NORTHSTAR_TOTAL_RAISED_GBP = 1_000_000;

export const NORTHSTAR_SEED_EXPECTED_CLOSE = "2026-12-15";

export const NORTHSTAR_INVESTORS: readonly DemoInvestor[] = [
  {
    id: "inv-ntv",
    fundName: "Northern Tech Ventures",
    leadContact: "David Chen",
    investorType: "VC",
    investmentAmountGbp: 400_000,
    ownershipPct: 16.5,
    sharesIssued: 1_650_000,
    shareClass: "Ordinary shares",
    shareType: "Equity",
    round: "Pre-seed (2023)",
    status: "portfolio",
    lastContact: "2026-07-14",
    documents: {
      articlesOfAssociation: "https://dataroom.northstar.demo/legal/articles-v2.pdf",
      shareholderAgreement: "https://dataroom.northstar.demo/legal/ssa-ntv.pdf",
      shareCertificate: "https://dataroom.northstar.demo/certificates/ntv-ord-001.pdf",
    },
  },
  {
    id: "inv-hfc",
    fundName: "Harwood Family Capital",
    leadContact: "Sarah Harwood",
    investorType: "Family office",
    investmentAmountGbp: 150_000,
    ownershipPct: 4.125,
    sharesIssued: 412_500,
    shareClass: "Ordinary shares",
    shareType: "Equity",
    round: "Pre-seed (2023)",
    status: "portfolio",
    lastContact: "2026-06-02",
    documents: {
      shareholderAgreement: "https://dataroom.northstar.demo/legal/ssa-hfc.pdf",
      shareCertificate: "https://dataroom.northstar.demo/certificates/hfc-ord-001.pdf",
    },
  },
  {
    id: "inv-selby",
    fundName: "Selby Private Investments",
    leadContact: "Mark Selby",
    investorType: "Family office",
    investmentAmountGbp: 150_000,
    ownershipPct: 4.125,
    sharesIssued: 412_500,
    shareClass: "Ordinary shares",
    shareType: "Equity",
    round: "Pre-seed (2023)",
    status: "portfolio",
    lastContact: "2026-05-18",
    documents: {
      shareholderAgreement: "https://dataroom.northstar.demo/legal/ssa-selby.pdf",
      shareCertificate: "https://dataroom.northstar.demo/certificates/selby-ord-001.pdf",
    },
  },
  {
    id: "inv-webb",
    fundName: "Webb Capital Partners",
    leadContact: "Jonathan Webb",
    investorType: "Angel",
    investmentAmountGbp: 150_000,
    ownershipPct: 4.95,
    sharesIssued: 495_000,
    shareClass: "Ordinary shares",
    shareType: "Equity",
    round: "Pre-seed (2023)",
    status: "portfolio",
    lastContact: "2026-07-22",
    documents: {
      shareholderAgreement: "https://dataroom.northstar.demo/legal/ssa-webb.pdf",
      shareCertificate: "https://dataroom.northstar.demo/certificates/webb-ord-001.pdf",
    },
  },
  {
    id: "inv-aip",
    fundName: "Austin Industrial Partners",
    leadContact: "Robert Klein",
    investorType: "Angel",
    investmentAmountGbp: 150_000,
    ownershipPct: 4.125,
    sharesIssued: 412_500,
    shareClass: "Ordinary shares",
    shareType: "Equity",
    round: "Pre-seed (2023)",
    status: "portfolio",
    lastContact: "2026-04-22",
    documents: {
      shareholderAgreement: "https://dataroom.northstar.demo/legal/ssa-aip.pdf",
      shareCertificate: "https://dataroom.northstar.demo/certificates/aip-ord-001.pdf",
    },
  },
  {
    id: "inv-mgp",
    fundName: "Midlands Growth Partners",
    leadContact: "Simon Wright",
    investorType: "VC",
    investmentAmountGbp: 0,
    ownershipPct: 0,
    sharesIssued: 0,
    shareClass: "Preference shares",
    shareType: "Equity",
    round: "Seed (2026)",
    status: "pipeline",
    lastContact: "2026-08-12",
    documents: {},
  },
  {
    id: "inv-iif",
    fundName: "Industrial Innovation Fund",
    leadContact: "Helena Voigt",
    investorType: "VC",
    investmentAmountGbp: 0,
    ownershipPct: 0,
    sharesIssued: 0,
    shareClass: "Preference shares",
    shareType: "Equity",
    round: "Seed (2026)",
    status: "pipeline",
    lastContact: "2026-08-08",
    documents: {},
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
  introDate?: string;
  pitchSentDate?: string;
};

export const NORTHSTAR_FUNDRAISING_PIPELINE_SEED: readonly FundraisingPipelineDeal[] = [
  {
    id: "nst-pipe-seed-mgp",
    investor: "Simon Wright",
    firm: "Midlands Growth Partners",
    stage: "Term sheet",
    amountGbp: 2_500_000,
    owner: "Elena Hart",
    lastTouch: "2026-08-12",
    notes: "Lead candidate for £5M seed round.",
    introDate: "2026-05-10",
    pitchSentDate: "2026-05-28",
  },
  {
    id: "nst-pipe-seed-iif",
    investor: "Helena Voigt",
    firm: "Industrial Innovation Fund",
    stage: "Diligence",
    amountGbp: 1_500_000,
    owner: "Priya Shah",
    lastTouch: "2026-08-08",
    notes: "Technical diligence — Manchester site visit completed.",
    introDate: "2026-06-02",
    pitchSentDate: "2026-06-18",
  },
  {
    id: "nst-pipe-seed-ntv",
    investor: "David Chen",
    firm: "Northern Tech Ventures",
    stage: "Meeting",
    amountGbp: 1_000_000,
    owner: "Elena Hart",
    lastTouch: "2026-08-14",
    notes: "Pre-seed lead — pro-rata for seed round.",
    introDate: "2026-07-01",
    pitchSentDate: "2026-07-12",
  },
  {
    id: "nst-pipe-intro-1",
    investor: "Amelia Hughes",
    firm: "Yorkshire Growth Capital",
    stage: "Intro",
    amountGbp: 750_000,
    owner: "Paul Fotheringham",
    lastTouch: "2026-08-05",
    notes: "Warm intro via Sheffield Precision board contact.",
    introDate: "2026-08-05",
  },
  {
    id: "nst-pipe-intro-2",
    investor: "Chris Palmer",
    firm: "Midlands Systems Integrators",
    stage: "Intro",
    amountGbp: 250_000,
    owner: "Marcus Reed",
    lastTouch: "2026-08-09",
    notes: "Strategic angel — industrial automation network.",
    introDate: "2026-08-09",
  },
  {
    id: "nst-pipe-pitch-1",
    investor: "Simon Wright",
    firm: "Midlands Growth Partners",
    stage: "Pitch sent",
    amountGbp: 2_500_000,
    owner: "Elena Hart",
    lastTouch: "2026-08-03",
    notes: "Deck v3.2 sent — partner review in progress.",
    introDate: "2026-05-10",
    pitchSentDate: "2026-08-03",
  },
  {
    id: "nst-pipe-pitch-2",
    investor: "Robert Klein",
    firm: "Gulf Coast Ventures",
    stage: "Pitch sent",
    amountGbp: 500_000,
    owner: "Marcus Reed",
    lastTouch: "2026-08-11",
    notes: "US co-investor intro — pitch deck + data room access.",
    introDate: "2026-07-22",
    pitchSentDate: "2026-08-11",
  },
  {
    id: "nst-pipe-passed-1",
    investor: "Mark Townsend",
    firm: "Peak District Angels",
    stage: "Passed",
    amountGbp: 100_000,
    owner: "Elena Hart",
    lastTouch: "2026-07-20",
    notes: "Ticket size too small for seed round.",
    introDate: "2026-06-15",
    pitchSentDate: "2026-06-28",
  },
];

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
