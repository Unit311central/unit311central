import type {
  CustomerFundraisingInvestor,
  CustomerFundraisingPipelineDeal,
} from "@/lib/customer-fundraising-store";

/** Seed fundraising records for Green Desert investor view. */
export const GREENDESERT_FUNDRAISING_INVESTORS: CustomerFundraisingInvestor[] = [
  {
    id: "gd-inv-1",
    name: "Vision 2030 Agritech Fund",
    type: "Strategic",
    stage: "Term sheet",
    amount: 4_500_000,
    currency: "USD",
    notes: "Series A — lead investor focused on Saudi food security.",
  },
  {
    id: "gd-inv-2",
    name: "GCC Climate Ventures",
    type: "VC",
    stage: "Due diligence",
    amount: 2_000_000,
    currency: "USD",
    notes: "Co-investor — carbon-negative algae positioning.",
  },
  {
    id: "gd-inv-3",
    name: "RedSea Strategic Partners",
    type: "Corporate",
    stage: "Prospect",
    amount: 1_500_000,
    currency: "USD",
    notes: "Strategic alignment with RedSea ecosystem.",
  },
];

export const GREENDESERT_FUNDRAISING_PIPELINE: CustomerFundraisingPipelineDeal[] = [
  {
    id: "gd-deal-1",
    name: "Series A — Green Desert Tech",
    stage: "Negotiation",
    amount: 8_000_000,
    currency: "USD",
    expectedClose: "2026-12-15",
    notes: "Primary round for Jeddah pilot scale-up and powder production line.",
  },
  {
    id: "gd-deal-2",
    name: "Strategic grant — KSA agriculture",
    stage: "Qualified",
    amount: 1_200_000,
    currency: "USD",
    expectedClose: "2026-11-30",
    notes: "Non-dilutive funding for water-efficiency instrumentation.",
  },
];

export const GREENDESERT_FUNDRAISING_ROUND_SUMMARY = {
  activeRound: "Series A",
  roundType: "Equity",
  targetAmount: 8_000_000,
  committedAmount: 6_500_000,
  currency: "USD",
};
