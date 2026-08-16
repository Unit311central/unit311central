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

export const NORTHSTAR_FUNDING_ROUNDS: readonly DemoFundingRound[] = [
  {
    id: "seed-2023",
    label: "Seed",
    amountGbp: 750_000,
    year: 2023,
    lead: "Northern Tech Ventures",
    status: "closed",
    investors: ["Northern Tech Ventures", "Angel syndicate (12)"],
  },
  {
    id: "series-a-2024",
    label: "Series A",
    amountGbp: 1_750_000,
    year: 2024,
    lead: "Northern Tech Ventures",
    status: "closed",
    investors: ["Northern Tech Ventures", "Cedar Bridge Capital"],
  },
  {
    id: "growth-2025",
    label: "Growth",
    amountGbp: 2_000_000,
    year: 2025,
    lead: "Cedar Bridge Capital",
    status: "closed",
    investors: ["Cedar Bridge Capital", "Northern Tech Ventures"],
  },
];

export const NORTHSTAR_TOTAL_RAISED_GBP = NORTHSTAR_FUNDING_ROUNDS.reduce(
  (sum, round) => sum + round.amountGbp,
  0,
);

export const NORTHSTAR_INVESTORS: readonly DemoInvestor[] = [
  {
    id: "inv-ntv",
    firm: "Northern Tech Ventures",
    contact: "David Chen",
    stage: "Series A / Growth",
    status: "portfolio",
    lastContact: "2026-02-10",
  },
  {
    id: "inv-cbc",
    firm: "Cedar Bridge Capital",
    contact: "Rachel Okon",
    stage: "Growth",
    status: "portfolio",
    lastContact: "2026-01-22",
  },
  {
    id: "inv-mid",
    firm: "Midlands Growth Partners",
    contact: "Simon Wright",
    stage: "Series B (future)",
    status: "pipeline",
    lastContact: "2026-03-01",
  },
  {
    id: "inv-ind",
    firm: "Industrial Innovation Fund",
    contact: "Helena Voigt",
    stage: "Strategic",
    status: "pipeline",
    lastContact: "2026-02-28",
  },
];

export const NORTHSTAR_FUNDRAISING_PIPELINE = [
  {
    id: "pipe-1",
    firm: "Midlands Growth Partners",
    stage: "Introductory",
    amountGbp: 3_000_000,
    probability: 25,
    nextStep: "Partner meeting Apr 2026",
  },
  {
    id: "pipe-2",
    firm: "Industrial Innovation Fund",
    stage: "Due diligence",
    amountGbp: 1_500_000,
    probability: 40,
    nextStep: "Site visit Manchester",
  },
];
