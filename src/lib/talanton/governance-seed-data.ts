/**
 * Server-side seed fixtures for Talanton workspace governance (DB bootstrap only).
 */

import { TI_BOARD_MEMBERS, TI_BOARD_RISKS } from "@/lib/talanton/board-portal-data";
import type {
  GovernanceMeeting,
  GovernanceAction,
  GovernanceDecision,
} from "@/lib/talanton/governance-types";
import { computeTiRiskRating } from "@/lib/talanton/risk-register-store";

export const TALANTON_GOVERNANCE_MEETING_SEED: GovernanceMeeting[] = [
  {
    id: "gov-bm-2026-08",
    meetingDate: "2026-08-20",
    meetingType: "Board Meeting",
    title: "Talanton Impact Board — August 2026",
    status: "Scheduled",
    attendees: [
      { name: "Kathy Drake", role: "Board Chair" },
      { name: "Christian Hilliard", role: "Vice Chair" },
      { name: "Herve Sarteau", role: "IC Chair" },
      { name: "Harry Turner", role: "Management" },
      { name: "David Simms", role: "Portfolio Ops" },
    ],
    minutes: "Agenda circulated. Capital call status and East Africa pipeline scheduled for review.",
    decisions: [
      {
        id: "d-aug-1",
        text: "Confirm August board pack distribution timeline",
        status: "Proposed",
        owner: "Harry Turner",
      },
    ],
    actions: [
      {
        id: "a-aug-1",
        title: "Circulate Q3 portfolio scorecards to Board",
        owner: "David Simms",
        dueDate: "2026-08-15",
        status: "Underway",
      },
      {
        id: "a-aug-2",
        title: "Finalise board pack PDF",
        owner: "Portfolio Ops",
        dueDate: "2026-08-18",
        status: "Open",
      },
    ],
    meetingInviteUrl: "",
    archived: false,
    createdAt: "2026-07-28T10:00:00.000Z",
    updatedAt: "2026-08-01T09:00:00.000Z",
  },
  {
    id: "gov-bm-2026-05",
    meetingDate: "2026-05-14",
    meetingType: "Board Meeting",
    title: "Talanton Impact Board — May 2026",
    status: "Held",
    attendees: [
      { name: "Kathy Drake", role: "Board Chair" },
      { name: "Christian Hilliard", role: "Vice Chair" },
      { name: "Dave Tolmie", role: "Board / IC" },
      { name: "Dana Wichterman", role: "Board Member" },
      { name: "Herve Sarteau", role: "IC Chair" },
      { name: "Jeff Meyer", role: "Board Member" },
      { name: "Peter Thorrington", role: "Founding Chair" },
      { name: "Sam Mwale", role: "Board Member" },
      { name: "Harry Turner", role: "Management" },
    ],
    minutes:
      "Quorum confirmed. NAV, capital calls, and East Africa pipeline reviewed. Follow-on framework approved.",
    decisions: [
      {
        id: "d-may-1",
        text: "Approve follow-on allocation framework for top-quartile portfolio companies",
        status: "Approved",
        owner: "Investment Committee",
      },
    ],
    actions: [
      {
        id: "a-may-1",
        title: "Update LP reporting pack template",
        owner: "Andy Moore",
        dueDate: "2026-06-30",
        status: "Completed",
      },
    ],
    meetingInviteUrl: "",
    archived: false,
    createdAt: "2026-05-01T08:00:00.000Z",
    updatedAt: "2026-05-14T12:00:00.000Z",
  },
];

export function seedBoardMembersFromFixtures(): { member: typeof TI_BOARD_MEMBERS[number]; sortOrder: number }[] {
  return TI_BOARD_MEMBERS.map((member, index) => ({
    member,
    sortOrder: (index + 1) * 10,
  }));
}

export function seedRisksFromFixtures() {
  return TI_BOARD_RISKS.map((risk, index) => ({
    id: risk.id,
    description: risk.description,
    owner: risk.owner,
    impact: risk.impact,
    likelihood: risk.likelihood,
    rating: risk.rating ?? computeTiRiskRating(risk.impact, risk.likelihood),
    mitigation: risk.mitigation,
    status: risk.status,
    dateAdded: index < 2 ? "2026-05-14" : index < 3 ? "2026-06-01" : "2026-07-10",
    reviewDate: "2026-08-20",
    boardPackId: index === 0 ? "ti-bp-may" : index === 1 ? "ti-bp-may" : "",
    boardPackLabel:
      index === 0 || index === 1 ? "Talanton Impact Board Pack — May 2026" : "",
    archived: false,
    createdAt: `${index < 2 ? "2026-05-14" : "2026-06-01"}T10:00:00.000Z`,
    updatedAt: `${index < 2 ? "2026-05-14" : "2026-06-01"}T10:00:00.000Z`,
  }));
}

export type { GovernanceMeeting, GovernanceAction, GovernanceDecision };
