/**
 * Generic Demo workspace company identity — not Northstar Industrial Technologies.
 * Used for Fundraising, Cap Table, Board, and other Demo content surfaces.
 */

export const DEMO_COMPANY_LEGAL_NAME = "Unit311 Central Demo Ltd";
export const DEMO_COMPANY_SHORT_NAME = "Unit311 Central Demo";
export const DEMO_COMPANY_FOUNDER = "Paul Fotheringham";
export const DEMO_DATAROOM_BASE = "https://demo.unit311central.com/dataroom";

/** Funding round labels for Demo Fundraising workspace selector. */
export const DEMO_FUNDING_ROUND_OPTIONS = [
  { id: "pre-seed", label: "Pre-seed", status: "closed" as const },
  { id: "seed", label: "Seed", status: "in_progress" as const },
  { id: "series-a", label: "Series A", status: "planned" as const },
  { id: "series-b", label: "Series B", status: "planned" as const },
] as const;

export type DemoFundingRoundId = (typeof DEMO_FUNDING_ROUND_OPTIONS)[number]["id"];
