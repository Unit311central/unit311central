/**
 * SAEC fundraising demo — single historical seed round (closed ~5 years ago).
 * Display amounts in ZAR; original round US$5M.
 */

import type { CorporateShareholder } from "@/lib/corporate-data";
import type {
  DataRoomRow,
  FundraisingMeeting,
  FundraisingPipelineDeal,
  FundingRoundSummary,
  PitchDeckVersion,
} from "@/lib/onwardair/fundraising-data";
import { SAEC_DIRECTORS, SAEC_DEMO_INVESTORS } from "@/lib/saec/demo/people";
import {
  SAEC_HISTORICAL_SEED_ROUND,
  SAEC_LEGAL_NAME,
  SAEC_PRIMARY_CURRENCY,
} from "@/lib/saec/demo/company";

export const SAEC_HISTORICAL_SEED_ZAR = SAEC_HISTORICAL_SEED_ROUND.displayZar;
export const SAEC_HISTORICAL_SEED_USD = SAEC_HISTORICAL_SEED_ROUND.originalUsd;

export const SAEC_FUNDING_ROUNDS: FundingRoundSummary[] = [
  {
    id: "seed",
    name: "Seed (closed)",
    status: "Closed",
    focus: "National expansion and service footprint",
    typicalUse: "Fleet, warehouse, and Gauteng/Western Cape service depots.",
    targetUsd: SAEC_HISTORICAL_SEED_USD,
    notes: SAEC_HISTORICAL_SEED_ROUND.displayLabel,
  },
];

export const SAEC_FUNDRAISING_PIPELINE: FundraisingPipelineDeal[] = [
  {
    id: "saec-pipe-veld",
    investor: "Thabo Nkosi",
    firm: "Veld Capital Partners",
    stage: "Term sheet",
    amountUsd: SAEC_HISTORICAL_SEED_USD,
    owner: "Dewald Lassen",
    lastTouch: "2021-06-14",
    notes: "Closed seed allocation · demo record",
  },
  {
    id: "saec-pipe-karoo",
    investor: "Naledi Mokoena",
    firm: "Karoo Growth Fund",
    stage: "Diligence",
    amountUsd: 1_500_000,
    owner: "John Andrew Ligeti",
    lastTouch: "2021-05-22",
    notes: "Historical diligence — round closed",
  },
];

export const SAEC_FUNDRAISING_MEETINGS: FundraisingMeeting[] = [
  {
    id: "saec-meet-1",
    title: "Seed round close — board ratification",
    investor: "Thabo Nkosi",
    firm: "Veld Capital Partners",
    withWhom: "Dewald Lassen",
    date: "2021-07-02",
    time: "10:00",
    meetingLink: "",
    pitchDeckSent: true,
    owner: "Dewald Lassen",
    status: "Confirmed",
  },
  {
    id: "saec-meet-2",
    title: "Investor update (historical)",
    investor: "Naledi Mokoena",
    firm: "Karoo Growth Fund",
    withWhom: "John Andrew Ligeti",
    date: "2021-05-18",
    time: "14:30",
    meetingLink: "",
    pitchDeckSent: true,
    owner: "John Andrew Ligeti",
    status: "Confirmed",
  },
];

export const SAEC_FUNDRAISING_PITCH_DECKS: PitchDeckVersion[] = [
  {
    id: "saec-deck-seed",
    version: "v3.2",
    title: "OmniTransit Seed Deck (2021)",
    dateAdded: "2021-04-10",
    lastUpdatedAt: "2021-06-01",
    lastUpdatedBy: "John Andrew Ligeti",
    fileName: "OMT_Seed_2021.pdf",
    notes: "Historical seed materials · no active raise",
  },
];

export const SAEC_FUNDRAISING_DATA_ROOMS: DataRoomRow[] = [
  {
    id: "saec-dr-seed",
    investor: "Thabo Nkosi",
    firm: "Veld Capital Partners",
    folderLink: "https://dataroom.demo.saec.biz/seed-2021",
    lastUpdatedAt: "2021-06-30",
    lastUpdatedBy: "Dewald Lassen",
    documents: 24,
    status: "Restricted",
  },
];

export const SAEC_DEMO_INVESTOR_ROWS = SAEC_DEMO_INVESTORS.map((inv) => ({
  id: inv.id,
  name: inv.name,
  city: inv.city,
  type: inv.type,
  demoFictitious: inv.demoFictitious,
}));

export function formatSaecZarCompact(value: number): string {
  if (value >= 1_000_000) return `R ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R ${Math.round(value / 1_000)}k`;
  return `R ${value}`;
}

export function getSaecPreSeedFromCapTable(shareholders: CorporateShareholder[]): {
  raisedUsd: number;
  investorCount: number;
  investors: CorporateShareholder[];
} {
  const directors = new Set(SAEC_DIRECTORS.map((person) => person.fullName));
  const investors = shareholders.filter((row) => !directors.has(row.shareholder));
  return {
    raisedUsd: SAEC_HISTORICAL_SEED_ZAR,
    investorCount: SAEC_DEMO_INVESTORS.length,
    investors,
  };
}

export const SAEC_FUNDRAISING_EYEBROW = `${SAEC_LEGAL_NAME} · Fundraising`;
export const SAEC_FUNDRAISING_CURRENCY_LABEL = `${SAEC_PRIMARY_CURRENCY} (demo display)`;
