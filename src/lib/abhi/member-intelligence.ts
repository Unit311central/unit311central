/**
 * ABHI Member Intelligence — portfolio health, renewal risk, relationship insight.
 * Executive relationship intelligence (not a CRM).
 */

import type { ManagedClient } from "@/lib/client-management-data";
import { isClientPreActiveStatus } from "@/lib/client-management-data";
import { ABHI_MEMBERSHIP_FEE_GBP } from "@/lib/abhi-billing";
import { ABHI_ACTIVE_MEMBER_COUNT } from "@/lib/abhi-surface";
import {
  buildAbhiFundingDashboard,
  formatFundingGbp,
} from "@/lib/abhi/member-funding-data";

export type AbhiMembershipType = "Corporate" | "SME" | "Accelerator" | "Sponsor";

export type AbhiRenewalRisk = "Low" | "Medium" | "High";

export type AbhiHealthBand = "Excellent" | "Healthy" | "Needs Attention" | "At Risk";

export type AbhiRelationshipStatus =
  | "Strategic"
  | "Strong"
  | "Stable"
  | "Needs Attention"
  | "At Risk";

export type AbhiMemberIntelFilter =
  | "all"
  | "corporate"
  | "sme"
  | "accelerator"
  | "sponsor"
  | "high-value"
  | "at-risk"
  | "renewal-90"
  | "low-engagement"
  | "high-engagement";

export type AbhiTimelineEventKind =
  | "joined"
  | "event"
  | "meeting"
  | "support"
  | "renewal"
  | "interaction";

export type AbhiMemberTimelineEvent = {
  id: string;
  date: string;
  kind: AbhiTimelineEventKind;
  title: string;
  detail: string;
};

export type AbhiMemberIntelligenceRow = {
  id: string;
  memberName: string;
  membershipType: AbhiMembershipType;
  memberSince: string;
  memberSinceYear: number;
  revenueToDateGbp: number;
  renewalDate: string;
  eventsAttended: number;
  workingGroupsJoined: number;
  trainingCompleted: number;
  portalUsageScore: number;
  supportInteractions: number;
  engagementScore: number;
  healthScore: number;
  healthBand: AbhiHealthBand;
  renewalRisk: AbhiRenewalRisk;
  relationshipStatus: AbhiRelationshipStatus;
  accountManager: string;
  primaryContact: string;
  membershipStatus: "Active" | "Pending" | "Lapsed";
  engagementTrend: "up" | "flat" | "down";
};

export type AbhiHealthTrendLabel = "Improving" | "Stable" | "Declining";

export type AbhiHealthAssessmentDetail = {
  healthScore: number;
  trend: AbhiHealthTrendLabel;
  riskLevel: AbhiRenewalRisk;
  reasoning: string[];
};

export type AbhiRenewalAssessmentDetail = {
  renewalProbability: number;
  confidence: "High" | "Medium" | "Low";
  drivers: string[];
  summary: string;
};

export type AbhiMemberExecutiveInsights = {
  relationshipSummary: string;
  recommendedNextAction: string;
  health: AbhiHealthAssessmentDetail;
  renewal: AbhiRenewalAssessmentDetail;
  /** Plain-language aliases used by AI Q&A and PDF brief. */
  healthAssessment: string;
  renewalAssessment: string;
  recommendedActions: string[];
  nextBestActions: string[];
};

export type AbhiMemberFundingStub = {
  fundingOpportunities: number;
  highMatchOpportunities: number;
  potentialFundingLabel: string;
};

export type AbhiMemberIntelligenceDetail = AbhiMemberIntelligenceRow & {
  timeline: AbhiMemberTimelineEvent[];
  insights: AbhiMemberExecutiveInsights;
  funding: AbhiMemberFundingStub;
};

export type AbhiPortfolioPriorityAction = {
  memberId: string;
  memberName: string;
  reasons: string[];
  urgencyScore: number;
};

export type AbhiPortfolioAiIntelligence = {
  membersRequiringAttention: number;
  highValueAtRisk: number;
  renewalsDueIn90Days: number;
  lowEngagementMembers: number;
  priorityActions: AbhiPortfolioPriorityAction[];
  recommendedAccountManagerActions: string[];
  interventionRecommendations: string[];
};

export type AbhiMemberIntelligencePortfolio = {
  rows: AbhiMemberIntelligenceRow[];
  summary: {
    /** Active members only — excludes onboarding / pre-active accounts. */
    activeMembers: number;
    healthyMembers: number;
    atRiskMembers: number;
    renewalsDueIn90Days: number;
    totalMembershipRevenueGbp: number;
    averageEngagementScore: number;
  };
  aiIntelligence: AbhiPortfolioAiIntelligence;
};

const ACCOUNT_MANAGERS = [
  "Sarah Mitchell",
  "James Okonkwo",
  "Priya Shah",
  "Tom Bradley",
  "Elena Vasquez",
] as const;

const MEMBERSHIP_TYPES: AbhiMembershipType[] = [
  "Corporate",
  "SME",
  "Accelerator",
  "Sponsor",
];

/** Curated pilot overrides — ensure Abbott and key portals read clearly. */
const PROFILE_OVERRIDES: Record<
  string,
  Partial<AbhiMemberIntelligenceRow> & { id: string; memberName: string }
> = {
  "abhi-cli-abbott-diagnostics-ltd": {
    id: "abhi-cli-abbott-diagnostics-ltd",
    memberName: "Abbott Diagnostics Ltd",
    membershipType: "Corporate",
    memberSince: "2018-03-12",
    memberSinceYear: 2018,
    revenueToDateGbp: 24_000,
    renewalDate: "2026-10-24",
    eventsAttended: 8,
    workingGroupsJoined: 1,
    trainingCompleted: 4,
    portalUsageScore: 86,
    supportInteractions: 2,
    engagementScore: 91,
    healthScore: 92,
    healthBand: "Excellent",
    renewalRisk: "Low",
    relationshipStatus: "Strategic",
    accountManager: "Sarah Mitchell",
    primaryContact: "demo@abbotdiagnostics.com",
    membershipStatus: "Active",
    engagementTrend: "up",
  },
  "abhi-cli-centrak": {
    id: "abhi-cli-centrak",
    memberName: "Centrak",
    membershipType: "Corporate",
    memberSince: "2019-06-01",
    memberSinceYear: 2019,
    revenueToDateGbp: 21_000,
    renewalDate: "2026-09-15",
    eventsAttended: 6,
    workingGroupsJoined: 2,
    trainingCompleted: 3,
    portalUsageScore: 74,
    supportInteractions: 1,
    engagementScore: 82,
    healthScore: 84,
    healthBand: "Healthy",
    renewalRisk: "Low",
    relationshipStatus: "Strong",
    accountManager: "James Okonkwo",
    primaryContact: "demo@centrak.com",
    membershipStatus: "Active",
    engagementTrend: "up",
  },
  "abhi-cli-gama-healthcare-ltd": {
    id: "abhi-cli-gama-healthcare-ltd",
    memberName: "GAMA Healthcare Ltd",
    membershipType: "Corporate",
    memberSince: "2017-11-20",
    memberSinceYear: 2017,
    revenueToDateGbp: 27_000,
    renewalDate: "2026-08-30",
    eventsAttended: 5,
    workingGroupsJoined: 1,
    trainingCompleted: 2,
    portalUsageScore: 58,
    supportInteractions: 4,
    engagementScore: 61,
    healthScore: 58,
    healthBand: "Needs Attention",
    renewalRisk: "Medium",
    relationshipStatus: "Needs Attention",
    accountManager: "Priya Shah",
    primaryContact: "demo@gamahealthcare.com",
    membershipStatus: "Active",
    engagementTrend: "down",
  },
};

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function daysUntil(iso: string, asOf = new Date()) {
  const target = new Date(`${iso}T12:00:00`);
  return Math.ceil((target.getTime() - asOf.getTime()) / (1000 * 60 * 60 * 24));
}

/** Members flagged for relationship intervention — intentionally stricter than “medium renewal” alone. */
function requiresAttention(row: AbhiMemberIntelligenceRow, asOf = new Date()) {
  const renewalDays = daysUntil(row.renewalDate, asOf);

  if (row.healthBand === "At Risk" || row.renewalRisk === "High") {
    return true;
  }

  if (row.engagementScore < 40) {
    return true;
  }

  if (row.healthBand === "Needs Attention") {
    if (row.renewalRisk === "Medium" && (row.engagementScore < 60 || row.engagementTrend === "down")) {
      return true;
    }
    if (row.engagementScore < 50) {
      return true;
    }
  }

  if (renewalDays >= 0 && renewalDays <= 60) {
    if (row.renewalRisk === "Medium" && row.engagementScore < 65) {
      return true;
    }
    if (row.engagementTrend === "down" && row.engagementScore < 60) {
      return true;
    }
  }

  return false;
}

export const MEMBER_ATTENTION_CRITERIA_SUMMARY =
  "At-risk health, high renewal risk, or declining engagement inside the renewal window — not routine medium renewals.";

function priorityReasons(row: AbhiMemberIntelligenceRow, asOf = new Date()): string[] {
  const reasons: string[] = [];
  const renewalDays = daysUntil(row.renewalDate, asOf);
  if (renewalDays >= 0 && renewalDays <= 90) {
    reasons.push(`Renewal due in ${renewalDays} days.`);
  }
  if (row.engagementTrend === "down") {
    reasons.push("Engagement declining.");
  }
  if (row.eventsAttended <= 1) {
    reasons.push("No meaningful event attendance recently.");
  }
  if (row.workingGroupsJoined === 0) {
    reasons.push(
      row.membershipType === "Sponsor" || row.revenueToDateGbp >= 18_000
        ? "High-value member with no working group activity."
        : "No working group activity.",
    );
  }
  if (row.engagementScore < 55) {
    reasons.push(`Low engagement (${row.engagementScore}/100).`);
  }
  if (row.renewalRisk === "High") {
    reasons.push("High renewal risk.");
  } else if (row.renewalRisk === "Medium") {
    reasons.push("Medium renewal risk.");
  }
  if (row.portalUsageScore < 40) {
    reasons.push("Low portal activity.");
  }
  if (reasons.length === 0) {
    reasons.push(`${row.healthBand} health · ${row.relationshipStatus} relationship.`);
  }
  return reasons.slice(0, 3);
}

function urgencyScore(row: AbhiMemberIntelligenceRow, asOf = new Date()) {
  let score = 0;
  const renewalDays = daysUntil(row.renewalDate, asOf);
  if (row.renewalRisk === "High") score += 40;
  else if (row.renewalRisk === "Medium") score += 22;
  if (renewalDays >= 0 && renewalDays <= 45) score += 28;
  else if (renewalDays >= 0 && renewalDays <= 90) score += 16;
  if (row.revenueToDateGbp >= 18_000) score += 14;
  if (row.engagementTrend === "down") score += 12;
  if (row.engagementScore < 55) score += 12;
  if (row.eventsAttended <= 1) score += 8;
  if (row.workingGroupsJoined === 0) score += 6;
  return score;
}

export function buildPortfolioAiIntelligence(
  rows: AbhiMemberIntelligenceRow[],
  asOf = new Date(),
): AbhiPortfolioAiIntelligence {
  const attention = rows.filter((r) => requiresAttention(r, asOf));
  const highValueAtRisk = rows.filter(
    (r) =>
      r.revenueToDateGbp >= 18_000 &&
      (r.renewalRisk === "High" ||
        r.renewalRisk === "Medium" ||
        r.healthBand === "At Risk" ||
        r.engagementTrend === "down"),
  );
  const renewalsDueIn90Days = rows.filter((r) => {
    const d = daysUntil(r.renewalDate, asOf);
    return d >= 0 && d <= 90;
  });
  const lowEngagement = rows.filter((r) => r.engagementScore < 55);

  const priorityActions = [...attention]
    .map((row) => ({
      memberId: row.id,
      memberName: row.memberName,
      reasons: priorityReasons(row, asOf),
      urgencyScore: urgencyScore(row, asOf),
    }))
    .sort((a, b) => b.urgencyScore - a.urgencyScore || a.memberName.localeCompare(b.memberName))
    .slice(0, 8);

  const renewalMeetings = Math.min(
    8,
    renewalsDueIn90Days.filter((r) => r.renewalRisk !== "Low" || r.engagementTrend === "down")
      .length || Math.min(3, renewalsDueIn90Days.length),
  );
  const lowEngagementContacts = Math.min(8, Math.max(2, lowEngagement.length));
  const wgInvites = Math.min(
    12,
    rows.filter((r) => r.workingGroupsJoined === 0 && r.engagementScore < 80).length,
  );
  const sponsorReviews = rows.filter(
    (r) =>
      (r.membershipType === "Sponsor" || r.revenueToDateGbp >= 22_000) &&
      (r.engagementScore < 70 || r.workingGroupsJoined === 0 || r.engagementTrend === "down"),
  ).length;

  const recommendedAccountManagerActions = [
    `Schedule ${Math.max(1, renewalMeetings)} renewal meeting${renewalMeetings === 1 ? "" : "s"}.`,
    `Contact ${lowEngagementContacts} low-engagement member${lowEngagementContacts === 1 ? "" : "s"}.`,
    `Invite ${Math.max(1, wgInvites)} members to Digital Health Working Group.`,
    sponsorReviews > 0
      ? `Review sponsor engagement plan (${sponsorReviews} account${sponsorReviews === 1 ? "" : "s"}).`
      : "Maintain strategic check-ins with high-value corporate members.",
  ];

  const interventionRecommendations = [
    attention.length > 0
      ? `${attention.length} members require attention — prioritise the top ${Math.min(3, priorityActions.length)} accounts this week.`
      : "Portfolio health is stable — keep proactive cadence on renewals within 90 days.",
    highValueAtRisk.length > 0
      ? `${highValueAtRisk.length} high-value members show risk signals — escalate to senior relationship owners.`
      : "No high-value members currently flagged at elevated risk.",
    lowEngagement.length > 0
      ? `Re-engage ${lowEngagement.length} low-engagement members via events, working groups, or portal walkthroughs.`
      : "Engagement levels are broadly healthy across the portfolio.",
  ];

  return {
    membersRequiringAttention: attention.length,
    highValueAtRisk: highValueAtRisk.length,
    renewalsDueIn90Days: renewalsDueIn90Days.length,
    lowEngagementMembers: lowEngagement.length,
    priorityActions,
    recommendedAccountManagerActions,
    interventionRecommendations,
  };
}

export function healthBandForScore(score: number): AbhiHealthBand {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Healthy";
  if (score >= 50) return "Needs Attention";
  return "At Risk";
}

export function computeHealthScore(input: {
  eventsAttended: number;
  workingGroupsJoined: number;
  trainingCompleted: number;
  portalUsageScore: number;
  renewalsOnTime: number;
  supportInteractions: number;
}): number {
  const events = clamp(input.eventsAttended * 6, 0, 24);
  const wg = clamp(input.workingGroupsJoined * 10, 0, 20);
  const training = clamp(input.trainingCompleted * 5, 0, 15);
  const portal = clamp(Math.round(input.portalUsageScore * 0.2), 0, 20);
  const renewal = clamp(input.renewalsOnTime * 8, 0, 16);
  // Light support contact is healthy; heavy volume lowers score.
  const support =
    input.supportInteractions <= 2
      ? 5
      : input.supportInteractions <= 5
        ? 2
        : -6;
  return clamp(Math.round(events + wg + training + portal + renewal + support + 20), 0, 100);
}

export function computeRenewalRisk(input: {
  engagementScore: number;
  engagementTrend: "up" | "flat" | "down";
  renewalDate: string;
  eventsAttended: number;
  portalUsageScore: number;
  supportInteractions: number;
  manualOverride?: AbhiRenewalRisk | null;
  asOf?: Date;
}): AbhiRenewalRisk {
  if (input.manualOverride) return input.manualOverride;

  let points = 0;
  const days = daysUntil(input.renewalDate, input.asOf);
  if (days <= 60) points += 2;
  else if (days <= 90) points += 1;
  if (input.engagementScore < 50) points += 3;
  else if (input.engagementScore < 70) points += 1;
  if (input.engagementTrend === "down") points += 2;
  if (input.eventsAttended <= 1) points += 1;
  if (input.portalUsageScore < 40) points += 1;
  if (input.supportInteractions >= 5) points += 1;

  if (points >= 5) return "High";
  if (points >= 2) return "Medium";
  return "Low";
}

function relationshipFromScores(
  health: number,
  risk: AbhiRenewalRisk,
  membershipType: AbhiMembershipType,
): AbhiRelationshipStatus {
  if (risk === "High" || health < 50) return "At Risk";
  if (health < 70 || risk === "Medium") return "Needs Attention";
  if (membershipType === "Corporate" || membershipType === "Sponsor") {
    if (health >= 88) return "Strategic";
  }
  if (health >= 80) return "Strong";
  return "Stable";
}

function deriveRowFromClient(client: ManagedClient, asOf = new Date()): AbhiMemberIntelligenceRow {
  const override = PROFILE_OVERRIDES[client.id];
  if (override) {
    return {
      ...override,
      memberName: client.companyName || override.memberName,
      primaryContact:
        client.email || client.primaryContact || override.primaryContact,
      membershipStatus:
        client.accountStatus === "Active"
          ? "Active"
          : client.accountStatus === "Dormant" || client.accountStatus === "Archived"
            ? "Lapsed"
            : "Pending",
    } as AbhiMemberIntelligenceRow;
  }

  const seed = hashSeed(client.id);
  const membershipType = MEMBERSHIP_TYPES[seed % MEMBERSHIP_TYPES.length]!;
  const years = 1 + (seed % 10);
  const memberSinceYear = asOf.getFullYear() - years;
  const memberSince = `${memberSinceYear}-${String(1 + (seed % 12)).padStart(2, "0")}-${String(1 + (seed % 27)).padStart(2, "0")}`;
  const renewal = client.renewalDate
    ? client.renewalDate.slice(0, 10)
    : formatIso(
        new Date(asOf.getFullYear(), asOf.getMonth() + (seed % 8), 1 + (seed % 25)),
      );
  const eventsAttended = seed % 9;
  const workingGroupsJoined = seed % 4;
  const trainingCompleted = seed % 6;
  const portalUsageScore = 20 + (seed % 75);
  const supportInteractions = seed % 7;
  const renewalsOnTime = Math.min(years, 2 + (seed % 4));
  const engagementTrend: "up" | "flat" | "down" =
    seed % 5 === 0 ? "down" : seed % 3 === 0 ? "flat" : "up";

  const healthScore = computeHealthScore({
    eventsAttended,
    workingGroupsJoined,
    trainingCompleted,
    portalUsageScore,
    renewalsOnTime,
    supportInteractions,
  });
  const engagementScore = clamp(
    Math.round(
      healthScore * 0.55 +
        portalUsageScore * 0.25 +
        eventsAttended * 3 +
        (engagementTrend === "up" ? 6 : engagementTrend === "down" ? -8 : 0),
    ),
    0,
    100,
  );
  const renewalRisk = computeRenewalRisk({
    engagementScore,
    engagementTrend,
    renewalDate: renewal,
    eventsAttended,
    portalUsageScore,
    supportInteractions,
    asOf,
  });
  const healthBand = healthBandForScore(healthScore);
  const revenueYears = Math.max(1, years);
  const tierMultiplier =
    membershipType === "Sponsor" ? 2.5 : membershipType === "Corporate" ? 1.4 : 1;

  return {
    id: client.id,
    memberName: client.companyName,
    membershipType,
    memberSince,
    memberSinceYear,
    revenueToDateGbp: Math.round(ABHI_MEMBERSHIP_FEE_GBP * revenueYears * tierMultiplier),
    renewalDate: renewal,
    eventsAttended,
    workingGroupsJoined,
    trainingCompleted,
    portalUsageScore,
    supportInteractions,
    engagementScore,
    healthScore,
    healthBand,
    renewalRisk,
    relationshipStatus: relationshipFromScores(healthScore, renewalRisk, membershipType),
    accountManager: ACCOUNT_MANAGERS[seed % ACCOUNT_MANAGERS.length]!,
    primaryContact: client.primaryContact || client.email || "—",
    membershipStatus:
      client.accountStatus === "Active"
        ? "Active"
        : client.accountStatus === "Dormant" || client.accountStatus === "Archived"
          ? "Lapsed"
          : "Pending",
    engagementTrend,
  };
}

/** Fallback seed when the clients API has not loaded yet. */
const FALLBACK_CLIENTS: ManagedClient[] = Object.values(PROFILE_OVERRIDES).map((row) => ({
  id: row.id,
  companyName: row.memberName,
  industry: "Other",
  primaryContact: row.primaryContact ?? "—",
  email: row.primaryContact ?? "",
  phone: "",
  region: "United Kingdom",
  accountStatus: "Active",
  contractType: "Retainer",
  taxId: "",
  billingAddress: "",
  activeProjects: 0,
  notes: "",
  renewalDate: row.renewalDate,
}));

/** Curated ABHI member clients for intelligence + CRM when DB rows are unavailable. */
export function getAbhiMemberFixtureClients(): ManagedClient[] {
  return FALLBACK_CLIENTS.map((client) => ({ ...client }));
}

function isActiveMemberClient(client: ManagedClient) {
  if (isClientPreActiveStatus(client.accountStatus)) return false;
  if (client.accountStatus === "Dormant" || client.accountStatus === "Archived") {
    return false;
  }
  return client.accountStatus === "Active";
}

export function buildMemberIntelligencePortfolio(
  clients: ManagedClient[],
  asOf = new Date(),
): AbhiMemberIntelligencePortfolio {
  const source =
    clients.length > 0
      ? clients.filter(
          (c) => !String(c.id).startsWith("ti-cli-") && isActiveMemberClient(c),
        )
      : FALLBACK_CLIENTS;

  const rows = source
    .map((c) => deriveRowFromClient(c, asOf))
    .filter((row) => row.membershipStatus === "Active")
    .sort((a, b) => a.memberName.localeCompare(b.memberName, "en-GB"));

  const healthyMembers = rows.filter(
    (r) => r.healthBand === "Excellent" || r.healthBand === "Healthy",
  ).length;
  const atRiskMembers = rows.filter(
    (r) => r.renewalRisk === "High" || r.healthBand === "At Risk",
  ).length;
  const renewalsDueIn90Days = rows.filter((r) => {
    const d = daysUntil(r.renewalDate, asOf);
    return d >= 0 && d <= 90;
  }).length;
  const totalMembershipRevenueGbp = rows.reduce((sum, r) => sum + r.revenueToDateGbp, 0);
  const averageEngagementScore = rows.length
    ? Math.round(rows.reduce((sum, r) => sum + r.engagementScore, 0) / rows.length)
    : 0;

  const activeMembers = ABHI_ACTIVE_MEMBER_COUNT;

  return {
    rows,
    summary: {
      activeMembers,
      healthyMembers,
      atRiskMembers,
      renewalsDueIn90Days,
      totalMembershipRevenueGbp,
      averageEngagementScore,
    },
    aiIntelligence: buildPortfolioAiIntelligence(rows, asOf),
  };
}

function memberSummariesForRows(
  rows: AbhiMemberIntelligenceRow[],
  asOf = new Date(),
): AbhiPortfolioPriorityAction[] {
  return rows
    .map((row) => ({
      memberId: row.id,
      memberName: row.memberName,
      reasons: priorityReasons(row, asOf),
      urgencyScore: urgencyScore(row, asOf),
    }))
    .sort((a, b) => b.urgencyScore - a.urgencyScore || a.memberName.localeCompare(b.memberName));
}

export function listAtRiskMemberSummaries(
  rows: AbhiMemberIntelligenceRow[],
  asOf = new Date(),
): AbhiPortfolioPriorityAction[] {
  return memberSummariesForRows(filterMemberIntelligenceRows(rows, "at-risk", asOf), asOf);
}

export function listMembersRequiringAttentionSummaries(
  rows: AbhiMemberIntelligenceRow[],
  asOf = new Date(),
): AbhiPortfolioPriorityAction[] {
  return memberSummariesForRows(rows.filter((row) => requiresAttention(row, asOf)), asOf);
}

export function filterMemberIntelligenceRows(
  rows: AbhiMemberIntelligenceRow[],
  filter: AbhiMemberIntelFilter,
  asOf = new Date(),
): AbhiMemberIntelligenceRow[] {
  switch (filter) {
    case "corporate":
      return rows.filter((r) => r.membershipType === "Corporate");
    case "sme":
      return rows.filter((r) => r.membershipType === "SME");
    case "accelerator":
      return rows.filter((r) => r.membershipType === "Accelerator");
    case "sponsor":
      return rows.filter((r) => r.membershipType === "Sponsor");
    case "high-value":
      return rows.filter((r) => r.revenueToDateGbp >= 18_000);
    case "at-risk":
      return rows.filter((r) => r.renewalRisk === "High" || r.healthBand === "At Risk");
    case "renewal-90":
      return rows.filter((r) => {
        const d = daysUntil(r.renewalDate, asOf);
        return d >= 0 && d <= 90;
      });
    case "low-engagement":
      return rows.filter((r) => r.engagementScore < 55);
    case "high-engagement":
      return rows.filter((r) => r.engagementScore >= 80);
    case "all":
    default:
      return rows;
  }
}

function buildTimeline(row: AbhiMemberIntelligenceRow): AbhiMemberTimelineEvent[] {
  const events: AbhiMemberTimelineEvent[] = [
    {
      id: `${row.id}-joined`,
      date: row.memberSince,
      kind: "joined",
      title: "Membership joined",
      detail: `${row.memberName} joined ABHI as ${row.membershipType}.`,
    },
  ];

  for (let i = 0; i < Math.min(row.eventsAttended, 4); i += 1) {
    const year = row.memberSinceYear + 1 + (i % 3);
    events.push({
      id: `${row.id}-evt-${i}`,
      date: `${year}-0${(i % 8) + 1}-15`,
      kind: "event",
      title: "Event attended",
      detail: i % 2 === 0 ? "ABHI Digital Health Conference" : "Member Group Meeting",
    });
  }

  if (row.workingGroupsJoined > 0) {
    events.push({
      id: `${row.id}-wg`,
      date: `${row.memberSinceYear + 1}-05-10`,
      kind: "interaction",
      title: "Working group joined",
      detail: "Digital Health Working Group",
    });
  }

  events.push({
    id: `${row.id}-meet`,
    date: "2026-05-14",
    kind: "meeting",
    title: "Account review meeting",
    detail: `Quarterly relationship review with ${row.accountManager}.`,
  });

  if (row.supportInteractions > 0) {
    events.push({
      id: `${row.id}-sup`,
      date: "2026-06-22",
      kind: "support",
      title: "Support case",
      detail: "Member portal access / programme enquiry resolved.",
    });
  }

  events.push({
    id: `${row.id}-ren`,
    date: row.renewalDate,
    kind: "renewal",
    title: "Renewal due",
    detail: `Next membership renewal — ${row.renewalRisk} risk.`,
  });

  return events.sort((a, b) => b.date.localeCompare(a.date));
}

function trendLabel(trend: AbhiMemberIntelligenceRow["engagementTrend"]): AbhiHealthTrendLabel {
  if (trend === "up") return "Improving";
  if (trend === "down") return "Declining";
  return "Stable";
}

function buildHealthAssessment(row: AbhiMemberIntelligenceRow): AbhiHealthAssessmentDetail {
  const reasoning: string[] = [];
  if (row.eventsAttended >= 4) reasoning.push("Strong event participation.");
  else if (row.eventsAttended <= 1) reasoning.push("Limited recent event participation.");
  else reasoning.push("Moderate event participation.");

  if (row.workingGroupsJoined > 0) {
    reasoning.push("Active working-group involvement.");
  } else {
    reasoning.push("No current working-group involvement.");
  }

  if (row.memberSinceYear <= 2020) {
    reasoning.push("Good renewal history as a long-standing member.");
  } else if (row.renewalRisk === "Low") {
    reasoning.push("Renewal history appears stable.");
  } else {
    reasoning.push("Renewal history needs closer monitoring.");
  }

  if (row.portalUsageScore >= 70) reasoning.push("Healthy portal usage.");
  else if (row.portalUsageScore < 40) reasoning.push("Low portal activity.");

  if (row.engagementTrend === "down") reasoning.push("Engagement trend is declining.");
  else if (row.engagementTrend === "up") reasoning.push("Engagement trend is improving.");

  return {
    healthScore: row.healthScore,
    trend: trendLabel(row.engagementTrend),
    riskLevel: row.renewalRisk,
    reasoning: reasoning.slice(0, 4),
  };
}

function buildRenewalAssessment(row: AbhiMemberIntelligenceRow): AbhiRenewalAssessmentDetail {
  let probability = 78;
  if (row.renewalRisk === "Low") probability = 90 + Math.min(8, Math.floor(row.engagementScore / 20));
  else if (row.renewalRisk === "Medium") probability = 62 + Math.floor(row.engagementScore / 10);
  else probability = 35 + Math.floor(row.engagementScore / 5);

  if (row.engagementTrend === "down") probability -= 8;
  if (row.engagementTrend === "up") probability += 4;
  if (row.revenueToDateGbp >= 18_000 && row.renewalRisk !== "High") probability += 2;
  probability = clamp(probability, 18, 97);

  const drivers: string[] = [];
  if (row.engagementScore >= 75) drivers.push("High engagement.");
  else if (row.engagementScore < 55) drivers.push("Low engagement.");
  else drivers.push("Moderate engagement.");

  if (row.eventsAttended >= 3 || row.workingGroupsJoined > 0) {
    drivers.push("Positive participation history.");
  } else {
    drivers.push("Limited participation history.");
  }

  if (
    row.relationshipStatus === "Strategic" ||
    row.relationshipStatus === "Strong" ||
    row.relationshipStatus === "Stable"
  ) {
    drivers.push("Strong relationship status.");
  } else {
    drivers.push("Relationship status needs attention.");
  }

  if (row.renewalRisk === "High") drivers.push("Proximity to renewal with risk signals.");

  const confidence: AbhiRenewalAssessmentDetail["confidence"] =
    row.renewalRisk === "High" || row.engagementTrend === "down"
      ? "Medium"
      : row.engagementScore >= 70 && row.eventsAttended >= 2
        ? "High"
        : "Medium";

  const summary =
    row.renewalRisk === "High"
      ? `Renewal probability is ${probability}% with elevated risk. Immediate relationship intervention is required before ${formatMemberIntelDate(row.renewalDate)}.`
      : row.renewalRisk === "Medium"
        ? `Renewal probability is ${probability}%. Schedule a proactive account conversation before the renewal window closes.`
        : `Renewal probability is ${probability}%. Relationship is on track — maintain cadence and surface relevant opportunities.`;

  return {
    renewalProbability: probability,
    confidence,
    drivers: drivers.slice(0, 4),
    summary,
  };
}

function buildInsights(row: AbhiMemberIntelligenceRow): AbhiMemberExecutiveInsights {
  const health = buildHealthAssessment(row);
  const renewal = buildRenewalAssessment(row);
  const renewalDays = daysUntil(row.renewalDate);

  const relationshipSummary = [
    `${row.memberName} has been an ABHI ${row.membershipType.toLowerCase()} member since ${row.memberSinceYear}.`,
    row.engagementScore >= 70
      ? `Engagement remains healthy with participation in ${row.eventsAttended} events and ${row.workingGroupsJoined} working groups.`
      : `Engagement needs attention (${row.engagementScore}/100) with ${row.eventsAttended} events and ${row.workingGroupsJoined} working groups recorded.`,
    `Renewal risk is currently ${row.renewalRisk}${
      renewalDays >= 0 && renewalDays <= 90 ? ` — renewal due in ${renewalDays} days` : ""
    }.`,
  ].join(" ");

  const recommendedActions: string[] = [];
  if (row.renewalRisk !== "Low" || (renewalDays >= 0 && renewalDays <= 90)) {
    recommendedActions.push("Arrange quarterly relationship review ahead of renewal.");
  }
  if (row.workingGroupsJoined === 0) {
    recommendedActions.push("Invite to Digital Health Working Group.");
  }
  recommendedActions.push("Discuss WHX Dubai participation.");
  recommendedActions.push("Share relevant ABHI initiatives and programme briefings.");
  if (row.membershipType === "Corporate" || row.membershipType === "Sponsor" || row.eventsAttended >= 4) {
    recommendedActions.push("Explore speaking opportunities at flagship ABHI events.");
  }
  if (row.engagementScore < 70) {
    recommendedActions.push("Invite to the upcoming Digital Health Conference.");
  }
  const uniqueActions = [...new Set(recommendedActions)].slice(0, 5);

  const nextBestActions: string[] = [
    "Schedule call with primary contact.",
    row.eventsAttended < 3
      ? "Send event invitation for the next ABHI programme."
      : "Send personalised thank-you and VIP event invitation.",
  ];
  if (row.workingGroupsJoined === 0) {
    nextBestActions.push("Introduce to working group chair.");
  } else {
    nextBestActions.push("Confirm next working group attendance.");
  }
  if (row.membershipType === "Sponsor" || row.revenueToDateGbp >= 18_000) {
    nextBestActions.push("Discuss sponsorship and partnership opportunities.");
  } else {
    nextBestActions.push("Share funding and growth opportunities relevant to their sector.");
  }

  const recommendedNextAction =
    row.renewalRisk === "High" || (renewalDays >= 0 && renewalDays <= 60 && row.engagementTrend === "down")
      ? `Book a renewal readiness call within 7 days and agree a 90-day engagement plan with ${row.accountManager}.`
      : row.workingGroupsJoined === 0 || row.eventsAttended < 3
        ? `Invite ${row.memberName.replace(/ Ltd$/i, "")} to the upcoming Digital Health Conference and discuss participation in future innovation programmes.`
        : `Maintain the strategic cadence — confirm the next quarterly review and surface 1–2 high-fit opportunities.`;

  const healthAssessment = `Health Score: ${health.healthScore}. Trend: ${health.trend}. Risk: ${health.riskLevel}. ${health.reasoning.join(" ")}`;

  return {
    relationshipSummary,
    recommendedNextAction,
    health,
    renewal,
    healthAssessment,
    renewalAssessment: renewal.summary,
    recommendedActions: uniqueActions,
    nextBestActions: nextBestActions.slice(0, 4),
  };
}

function buildFundingStub(row: AbhiMemberIntelligenceRow): AbhiMemberFundingStub {
  try {
    const dash = buildAbhiFundingDashboard(row.id, row.memberName);
    return {
      fundingOpportunities: dash.openCount,
      highMatchOpportunities: dash.highMatchCount,
      potentialFundingLabel: formatFundingGbp(dash.potentialFundingGbp),
    };
  } catch {
    return {
      fundingOpportunities: 0,
      highMatchOpportunities: 0,
      potentialFundingLabel: "—",
    };
  }
}

export function getMemberIntelligenceDetail(
  memberId: string,
  clients: ManagedClient[],
  asOf = new Date(),
): AbhiMemberIntelligenceDetail | null {
  const portfolio = buildMemberIntelligencePortfolio(clients, asOf);
  const row = portfolio.rows.find((r) => r.id === memberId);
  if (!row) return null;
  return {
    ...row,
    timeline: buildTimeline(row),
    insights: buildInsights(row),
    funding: buildFundingStub(row),
  };
}

export function answerMemberIntelligenceQuestion(
  question: string,
  detail: AbhiMemberIntelligenceDetail,
): string {
  const q = question.toLowerCase();
  const name = detail.memberName;

  if (/summar|relationship/.test(q)) {
    return `${detail.insights.relationshipSummary} Recommended next action: ${detail.insights.recommendedNextAction}`;
  }
  if (/risk|non-renewal|renew|probability/.test(q)) {
    return `${detail.insights.renewalAssessment} Renewal probability ${detail.insights.renewal.renewalProbability}% (${detail.insights.renewal.confidence} confidence). Drivers: ${detail.insights.renewal.drivers.join(" ")}`;
  }
  if (/health/.test(q)) {
    return detail.insights.healthAssessment;
  }
  if (/discuss|meeting|agenda/.test(q)) {
    return `For the next meeting with ${name}: ${detail.insights.recommendedNextAction} Also cover: ${detail.insights.nextBestActions.slice(0, 2).join(" ")}`;
  }
  if (/opportunit|funding|grant/.test(q)) {
    return `${name} currently has ${detail.funding.fundingOpportunities} open funding opportunities with ${detail.funding.highMatchOpportunities} high matches (~${detail.funding.potentialFundingLabel} potential). Open Funding & Opportunities on the member portal for detail.`;
  }
  if (/event/.test(q)) {
    return detail.eventsAttended < 3
      ? `${name} has attended ${detail.eventsAttended} events — prioritise Digital Health Conference and Member Group Meetings to lift engagement.`
      : `${name} is an active event participant (${detail.eventsAttended} attended). Keep them on VIP invite lists for flagship programmes.`;
  }
  if (/action|account manager|should/.test(q)) {
    return `Actions for ${detail.accountManager}: ${detail.insights.recommendedActions.join("; ")}.`;
  }

  return `${name} — health ${detail.healthScore} (${detail.healthBand}), engagement ${detail.engagementScore}, renewal risk ${detail.renewalRisk}, relationship ${detail.relationshipStatus}. Ask about relationship, renewal risk, meeting agenda, opportunities, events, or account-manager actions.`;
}

export function formatMemberIntelGbp(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMemberIntelDate(iso: string) {
  const date = new Date(`${iso}T09:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export const MEMBER_INTEL_FILTERS: { id: AbhiMemberIntelFilter; label: string }[] = [
  { id: "all", label: "All Members" },
  { id: "corporate", label: "Corporate" },
  { id: "sme", label: "SME" },
  { id: "accelerator", label: "Accelerator" },
  { id: "sponsor", label: "Sponsor" },
  { id: "high-value", label: "High Value Members" },
  { id: "at-risk", label: "At Risk Members" },
  { id: "renewal-90", label: "Renewal Due In 90 Days" },
  { id: "low-engagement", label: "Low Engagement" },
  { id: "high-engagement", label: "High Engagement" },
];
