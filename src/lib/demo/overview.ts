import { getDemoEnterpriseFixtures } from "@/lib/demo-enterprise";
import {
  NORTHSTAR_BOARD_ACTIONS,
  NORTHSTAR_BOARD_MEETINGS,
  NORTHSTAR_BOARD_RISKS,
  NORTHSTAR_BOARD_DIRECTORS,
} from "@/lib/demo/board-data";
import {
  NORTHSTAR_FUNDING_ROUNDS,
  NORTHSTAR_INVESTORS,
  NORTHSTAR_TOTAL_RAISED_GBP,
} from "@/lib/demo/fundraising-data";
import {
  NORTHSTAR_ENGINEERING_PROGRAMS,
  NORTHSTAR_ENGINEERING_MILESTONES,
} from "@/lib/demo/engineering-data";

export type NorthstarOverviewSnapshot = {
  company: {
    legalName: string;
    tradingName: string;
    foundedYear: number;
    description: string;
    website: string;
  };
  offices: Array<{
    city: string;
    country: string;
    headcount: number;
    leaderName: string;
    leaderTitle: string;
  }>;
  metrics: {
    employees: number;
    clients: number;
    activeProjects: number;
    /** Annual revenue recognised in 2025 (GBP). */
    annualRevenue2025Gbp: number;
    targetGmPct: number;
    actualGmPct: number;
    /** Revenue growth since 2023 baseline (%). */
    revenueGrowthSince2023Pct: number;
    investmentToDateGbp: number;
    ebitdaGbp: number;
    cashGbp: number;
    arGbp: number;
    apGbp: number;
    pipelineGbp: number;
  };
  wins: string[];
  losses: string[];
  peopleChanges: string[];
  board: {
    nextMeeting: string;
    openActions: number;
    topRisks: string[];
  };
  priorities: string[];
  intelligenceHeadline: string;
  fundingRounds: typeof NORTHSTAR_FUNDING_ROUNDS;
};

export function buildNorthstarOverviewSnapshot(): NorthstarOverviewSnapshot {
  const fixtures = getDemoEnterpriseFixtures();
  const summary = fixtures.summary ?? {};
  const narrative = fixtures.narrative ?? {};

  const openActions = NORTHSTAR_BOARD_ACTIONS.filter((a) => a.status !== "closed").length;
  const nextMeeting =
    NORTHSTAR_BOARD_MEETINGS.find((m) => m.status === "scheduled")?.title ?? "Board Meeting";

  return {
    company: {
      legalName: fixtures.company.legalName,
      tradingName: fixtures.company.tradingName,
      foundedYear: narrative.foundedYear ?? 2023,
      description: fixtures.company.description,
      website: fixtures.company.website,
    },
    offices: fixtures.offices.map((o, index) => {
      const leaders = [
        { name: "Elena Hart", title: "Managing Director" },
        { name: "James Okonkwo", title: "Engineering Director" },
        { name: "Marcus Reed", title: "US General Manager" },
      ];
      const leader = leaders[index] ?? { name: "Site lead", title: "Office manager" };
      return {
        city: o.city,
        country: o.country,
        headcount: o.headcountTarget,
        leaderName: leader.name,
        leaderTitle: leader.title,
      };
    }),
    metrics: {
      employees: summary.employees ?? 25,
      clients: summary.clients ?? 100,
      activeProjects: summary.activeProjects ?? 20,
      annualRevenue2025Gbp: narrative.arrGbp ?? fixtures.company.arrGbp ?? 4_800_000,
      targetGmPct: fixtures.company.targetGmPct ?? narrative.targetGmPct ?? 58,
      actualGmPct: fixtures.company.actualGmPct ?? narrative.actualGmPct ?? 54,
      revenueGrowthSince2023Pct: 823,
      investmentToDateGbp: NORTHSTAR_TOTAL_RAISED_GBP,
      ebitdaGbp: 1_080_000,
      cashGbp: narrative.cashGbp ?? 1_900_000,
      arGbp: narrative.arGbp ?? 620_000,
      apGbp: narrative.apGbp ?? 210_000,
      pipelineGbp: narrative.pipelineGbp ?? 1_200_000,
    },
    wins: narrative.wins ?? [
      "Sheffield Precision expansion — £180k ARR add-on",
      "Dec 2025 strong close — 4 new logos",
      "£1M pre-seed closed 2023 — five strategic investors",
    ],
    losses: narrative.losses ?? [
      "Harbor Forge churned — integration failure lesson",
      "Jun 2025 margin dip — Voltex supplier delays",
    ],
    peopleChanges: narrative.peopleChanges ?? [
      "Headcount 5 → 25 since Apr 2023 (UK FY growth)",
      "Hired: US Solutions Engineer (Austin), Senior Firmware Engineer (Bristol)",
      "Promoted: Delivery lead → Delivery Director",
      "Open roles: US Account Executive, Firmware Engineer, CSM",
    ],
    board: {
      nextMeeting,
      openActions,
      topRisks: NORTHSTAR_BOARD_RISKS.filter((r) => r.rating === "High" || r.rating === "Critical")
        .slice(0, 3)
        .map((r) => r.title),
    },
    priorities: narrative.priorities ?? [
      "Margin recovery to 58% target",
      "Atlas Monitoring Platform go-live for Peak District Breweries",
      "US pipeline conversion without burn spike",
      "Supplier diversification away from Voltex",
    ],
    intelligenceHeadline:
      narrative.intelligenceHeadline ??
      "Sheffield renewal risk elevated; Voltex supply-chain delay affecting Atlas delivery.",
    fundingRounds: NORTHSTAR_FUNDING_ROUNDS,
  };
}

export {
  NORTHSTAR_BOARD_MEETINGS,
  NORTHSTAR_BOARD_ACTIONS,
  NORTHSTAR_BOARD_RISKS,
  NORTHSTAR_BOARD_DIRECTORS,
  NORTHSTAR_INVESTORS,
  NORTHSTAR_ENGINEERING_PROGRAMS,
  NORTHSTAR_ENGINEERING_MILESTONES,
};
