/**
 * Generic workspace fundraising seed data for customer tenants (non-Demo, non-OnwardAir).
 * Keeps OnwardAir fixtures isolated while restoring functional Fundraising UI shells.
 */

import type { CorporateShareholder } from "@/lib/corporate-data";
import {
  isCapTableExternalInvestor,
  type DataRoomRow,
  type FundraisingMeeting,
  type FundraisingPipelineDeal,
  type FundingRoundSummary,
  type PitchDeckVersion,
} from "@/lib/onwardair/fundraising-data";

export const WORKSPACE_FUNDRAISING_PIPELINE: FundraisingPipelineDeal[] = [];

export const WORKSPACE_FUNDRAISING_MEETINGS: FundraisingMeeting[] = [];

export const WORKSPACE_FUNDRAISING_PITCH_DECKS: PitchDeckVersion[] = [];

export const WORKSPACE_FUNDRAISING_DATA_ROOMS: DataRoomRow[] = [];

export const WORKSPACE_FUNDING_ROUNDS: FundingRoundSummary[] = [
  {
    id: "pre-seed",
    name: "Pre-Seed",
    status: "Closed",
    focus: "Founding capital",
    typicalUse: "Team, product development, and early commercial validation.",
    targetUsd: null,
    notes: "Closed against Cap Table Management when external investors are recorded.",
  },
  {
    id: "seed",
    name: "Seed",
    status: "Planned",
    focus: "Growth capital",
    typicalUse: "Scale operations, expand the team, and accelerate go-to-market.",
    targetUsd: null,
    notes: "Planned raise — add pipeline deals as outreach begins.",
  },
  {
    id: "series-a",
    name: "Series A",
    status: "Future",
    focus: "Scale",
    typicalUse: "Commercial expansion and platform maturity.",
    targetUsd: null,
    notes: "Future institutional round — not yet active.",
  },
];

export function getWorkspacePreSeedFromCapTable(shareholders: CorporateShareholder[]): {
  raisedUsd: number;
  investorCount: number;
  investors: CorporateShareholder[];
} {
  const investors = shareholders.filter(isCapTableExternalInvestor);
  return {
    raisedUsd: 0,
    investorCount: investors.length,
    investors,
  };
}
