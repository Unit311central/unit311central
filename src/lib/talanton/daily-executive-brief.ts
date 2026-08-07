/**
 * Talanton Impact — daily executive brief from stewardship intelligence (Phase 1).
 */

import type { DailyExecutiveBrief } from "@/lib/ai-operating-assistant/executive-types";
import { briefDateKey } from "@/lib/ai-operating-assistant/date-keys";
import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import {
  buildTalantonExecutiveBriefing,
  formatTalantonExecutiveBriefingText,
  queryTalantonActionCentre,
  queryTalantonFunds,
  queryTalantonImpact,
  queryTalantonPortfolio,
} from "@/lib/talanton/executive-intelligence";
import { queryTalantonStories } from "@/lib/talanton/executive-stories-intelligence";

export function buildTalantonDailyExecutiveBrief(
  context: AssistantBusinessContext,
): DailyExecutiveBrief {
  const brief = buildTalantonExecutiveBriefing();
  const portfolio = queryTalantonPortfolio();
  const funds = queryTalantonFunds();
  const impact = queryTalantonImpact();
  const overdue = queryTalantonActionCentre("overdue");
  const stories = queryTalantonStories({
    companyIds: "all",
    storyTypes: "both",
    statusFilter: "include_review",
    categories: "all",
    outputFormat: "narrative",
  });

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning." : hour < 18 ? "Good afternoon." : "Good evening.";

  const priorities = [
    ...brief.risksRequiringAttention.slice(0, 2),
    ...brief.openActions.slice(0, 2),
    portfolio.briefing.health.companiesRequiringAttention > 0
      ? `${portfolio.briefing.health.companiesRequiringAttention} portfolio companies require attention`
      : null,
  ]
    .filter(Boolean)
    .slice(0, 5) as string[];

  const sections: DailyExecutiveBrief["sections"] = [
    {
      id: "stewardship_status",
      title: "Organisation status",
      bullets: [
        `Overall: ${brief.organisationStatus} — ${brief.organisationStatusReason}`,
        brief.nextBoardMeeting ? `Next board meeting: ${brief.nextBoardMeeting}` : "Board date: see Board portal",
      ],
    },
    {
      id: "portfolio",
      title: "Portfolio",
      bullets: [
        `Health score: ${portfolio.briefing.health.portfolioHealthScore}`,
        `Companies requiring attention: ${portfolio.briefing.health.companiesRequiringAttention}`,
        ...portfolio.briefing.attentionCompanies.slice(0, 3).map((c) => c.companyName),
      ],
    },
    {
      id: "funds",
      title: "Funds & capital",
      bullets: [
        `Committed: ${funds.overview.capitalCommittedUsd.toLocaleString("en-US")} USD`,
        `Deployed: ${funds.overview.capitalDeployedUsd.toLocaleString("en-US")} USD`,
        `Available: ${funds.overview.availableCapitalUsd.toLocaleString("en-US")} USD`,
      ],
    },
    {
      id: "impact",
      title: "Impact",
      bullets: [
        `Jobs created (portfolio): ${impact.briefing.summary.jobsCreated.toLocaleString("en-US")}`,
        `People served: ${impact.briefing.summary.peopleServed.toLocaleString("en-US")}`,
        `Impact health score: ${impact.briefing.health.score}`,
      ],
    },
    {
      id: "governance",
      title: "Governance & actions",
      bullets: [
        overdue.actions.length > 0
          ? `${overdue.actions.length} overdue board/governance action(s)`
          : "No overdue board actions in the current register",
        ...overdue.actions.slice(0, 3).map((a) => `${a.title} · ${a.owner} · due ${a.due}`),
      ],
    },
    {
      id: "stories",
      title: "Stories pipeline",
      bullets: [
        `${stories.rows.length} portfolio/journey stories in scope`,
        `${stories.counts.portfolio} portfolio submissions · ${stories.counts.journey} journey visits`,
      ],
    },
    {
      id: "executive_summary",
      title: "Executive briefing excerpt",
      bullets: formatTalantonExecutiveBriefingText(brief)
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .slice(0, 6),
    },
  ];

  return {
    id: `brief_ti_${briefDateKey()}_${context.user.id}`,
    dateKey: briefDateKey(),
    greeting,
    headline: `Talanton stewardship · ${brief.organisationStatus}`,
    narrative: priorities[0] ?? "Portfolio, funds, and impact metrics are available for review.",
    priorities,
    sections,
    insights: [],
    recommendedWorkflows: [],
    followUpActions: [
      { id: "fu_ti_brief", label: "Give me an executive briefing", kind: "generate" },
      { id: "fu_ti_portfolio", label: "What requires attention across the portfolio?", kind: "generate" },
      { id: "fu_ti_stories", label: "Summarise impact stories", kind: "generate" },
      { id: "fu_ti_pack", label: "Create Board Pack", kind: "generate" },
    ],
    dataGaps: [],
    generatedAt: new Date().toISOString(),
  };
}
