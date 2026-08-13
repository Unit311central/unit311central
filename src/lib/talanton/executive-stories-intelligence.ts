/**
 * Talanton impact / portfolio / journey stories — EA query layer.
 */

import {
  getTalantonMarketingStoriesSnapshot,
  type ImpactCategory,
  type PortfolioStory,
  type StoryStatus,
} from "@/lib/talanton/marketing-stories-store";
import {
  filterJourneyStories,
  listJourneyStories,
  type JourneyPublishStatus,
  type JourneyStory,
} from "@/lib/talanton/journey-stories-store";
import { TALANTON_PORTFOLIO_COMPANIES } from "@/lib/talanton/portfolio-data";

export const IMPACT_CATEGORY_OPTIONS: ImpactCategory[] = [
  "Jobs & Livelihoods",
  "Women & Youth",
  "Community Development",
  "Climate & Environment",
  "Financial Inclusion",
  "Health & Wellbeing",
  "Faith & Dignity of Work",
];

export type StoryTypeFilter = "portfolio" | "journey" | "both";

export type StoryStatusFilter = "approved_only" | "include_review" | "all";

export type StoriesOutputFormat = "narrative" | "pdf" | "newsletter";

export type StoriesScope = {
  companyIds: string[] | "all";
  storyTypes: StoryTypeFilter;
  statusFilter: StoryStatusFilter;
  categories: ImpactCategory[] | "all";
  outputFormat: StoriesOutputFormat;
  periodFrom?: string;
  periodTo?: string;
};

export type StoryRow = {
  id: string;
  kind: "portfolio" | "journey";
  title: string;
  companyNames: string[];
  country: string;
  status: string;
  categoryOrSector: string;
  date: string;
  summary: string;
};

export type StoriesQueryResult = {
  asOf: string;
  scope: StoriesScope;
  rows: StoryRow[];
  counts: {
    portfolio: number;
    journey: number;
    companies: number;
    categories: number;
  };
  prose: string;
};

const PORTFOLIO_APPROVED: StoryStatus[] = ["Approved", "Published"];
const PORTFOLIO_REVIEW: StoryStatus[] = ["Approved", "Published", "Under Review", "Submitted"];

function portfolioStatusAllowed(status: StoryStatus, filter: StoryStatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "approved_only") return PORTFOLIO_APPROVED.includes(status);
  return PORTFOLIO_REVIEW.includes(status);
}

function journeyStatusAllowed(status: JourneyPublishStatus, filter: StoryStatusFilter): boolean {
  if (filter === "all") return status !== "Archived";
  if (filter === "approved_only") return status === "Approved" || status === "Published";
  return status === "Approved" || status === "Published" || status === "Review" || status === "Draft";
}

function inPeriod(date: string, from?: string, to?: string): boolean {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function mapPortfolioStory(story: PortfolioStory): StoryRow {
  return {
    id: story.id,
    kind: "portfolio",
    title: story.title,
    companyNames: [story.companyName],
    country: story.country,
    status: story.status,
    categoryOrSector: story.impactCategory,
    date: story.submissionDate,
    summary: story.summary,
  };
}

function mapJourneyStory(story: JourneyStory): StoryRow {
  return {
    id: story.id,
    kind: "journey",
    title: story.title,
    companyNames: story.companyNames,
    country: story.country,
    status: story.status,
    categoryOrSector: story.sector,
    date: story.endDate || story.startDate,
    summary: story.generated?.executiveSummary?.slice(0, 280) || story.purpose,
  };
}

export function queryTalantonStories(scope: StoriesScope): StoriesQueryResult {
  const portfolioRows: StoryRow[] = [];
  const journeyRows: StoryRow[] = [];

  if (scope.storyTypes === "portfolio" || scope.storyTypes === "both") {
    const stories = getTalantonMarketingStoriesSnapshot().stories;
    for (const story of stories) {
      if (!portfolioStatusAllowed(story.status, scope.statusFilter)) continue;
      if (scope.categories !== "all" && !scope.categories.includes(story.impactCategory)) continue;
      if (scope.companyIds !== "all" && !scope.companyIds.includes(story.companyId)) continue;
      if (!inPeriod(story.submissionDate, scope.periodFrom, scope.periodTo)) continue;
      portfolioRows.push(mapPortfolioStory(story));
    }
  }

  if (scope.storyTypes === "journey" || scope.storyTypes === "both") {
    const journeys = filterJourneyStories({
      status: scope.statusFilter === "all" ? "all" : undefined,
      dateFrom: scope.periodFrom,
      dateTo: scope.periodTo,
    });
    for (const story of journeys) {
      if (!journeyStatusAllowed(story.status, scope.statusFilter)) continue;
      if (scope.companyIds !== "all") {
        const hit = story.companyIds.some((id) => scope.companyIds.includes(id));
        if (!hit) continue;
      }
      journeyRows.push(mapJourneyStory(story));
    }
  }

  const rows = [...portfolioRows, ...journeyRows].sort((a, b) => b.date.localeCompare(a.date));
  const companySet = new Set(rows.flatMap((r) => r.companyNames));
  const categorySet = new Set(
    rows.map((r) => r.categoryOrSector).filter(Boolean),
  );

  const scopeLabel = describeScope(scope);
  const lines = [
    `Impact & portfolio stories (${scopeLabel})`,
    `${rows.length} stor${rows.length === 1 ? "y" : "ies"} — ${portfolioRows.length} portfolio submission(s), ${journeyRows.length} journey visit(s).`,
    "",
  ];

  if (rows.length === 0) {
    lines.push(
      "No stories match this scope. Try all portfolio companies, include under-review items, or widen impact categories.",
    );
  } else {
    for (const row of rows.slice(0, 12)) {
      lines.push(
        `• ${row.title} (${row.kind}, ${row.companyNames.join(" / ")}, ${row.country}) — ${row.status}, ${row.categoryOrSector}, ${row.date}`,
      );
      lines.push(`  ${row.summary}`);
    }
    if (rows.length > 12) {
      lines.push(`… plus ${rows.length - 12} more matching stor${rows.length - 12 === 1 ? "y" : "ies"}.`);
    }
  }

  return {
    asOf: new Date().toISOString(),
    scope,
    rows,
    counts: {
      portfolio: portfolioRows.length,
      journey: journeyRows.length,
      companies: companySet.size,
      categories: categorySet.size,
    },
    prose: lines.join("\n"),
  };
}

export function describeScope(scope: StoriesScope): string {
  const companies =
    scope.companyIds === "all"
      ? "all portfolio companies"
      : scope.companyIds
          .map((id) => TALANTON_PORTFOLIO_COMPANIES.find((c) => c.id === id)?.name ?? id)
          .join(", ");
  const types =
    scope.storyTypes === "both"
      ? "portfolio + journey stories"
      : scope.storyTypes === "portfolio"
        ? "portfolio submissions"
        : "journey visits";
  const status =
    scope.statusFilter === "approved_only"
      ? "approved/published only"
      : scope.statusFilter === "include_review"
        ? "including under review"
        : "all statuses";
  const cats =
    scope.categories === "all"
      ? "all impact areas"
      : scope.categories.join(", ");
  return `${companies}; ${types}; ${status}; ${cats}`;
}

export function defaultStoriesScopeForView(activeView?: string): Partial<StoriesScope> {
  if (activeView === "portfolio-stories") return { storyTypes: "portfolio" };
  if (activeView === "journey-stories") return { storyTypes: "journey" };
  if (activeView === "stories-newsletter") return { storyTypes: "portfolio", statusFilter: "approved_only" };
  return {};
}

export function parseCompanyIdsFromText(text: string): string[] | "all" | null {
  const lower = text.toLowerCase();
  if (/\ball\s+(portfolio\s+)?companies\b/.test(lower) || /\bentire\s+portfolio\b/.test(lower)) {
    return "all";
  }
  if (/\ball\b/.test(lower) && /\bcompan/.test(lower)) return "all";

  const ids: string[] = [];
  for (const company of TALANTON_PORTFOLIO_COMPANIES) {
    if (lower.includes(company.name.toLowerCase())) ids.push(company.id);
  }
  return ids.length ? ids : null;
}

export function parseCategoriesFromText(text: string): ImpactCategory[] | "all" | null {
  const lower = text.toLowerCase();
  if (/\ball\s+(impact\s+)?(areas?|categories?)\b/.test(lower) || /\bevery\s+category\b/.test(lower) || /\ball\s+impact\b/.test(lower)) {
    return "all";
  }

  const hits: ImpactCategory[] = [];
  for (const cat of IMPACT_CATEGORY_OPTIONS) {
    const token = cat.toLowerCase();
    if (lower.includes(token)) hits.push(cat);
    if (cat === "Women & Youth" && /\bwomen\b/.test(lower) && !hits.includes(cat)) hits.push(cat);
    if (cat === "Jobs & Livelihoods" && /\bjobs\b/.test(lower) && !hits.includes(cat)) hits.push(cat);
    if (cat === "Climate & Environment" && /\bclimate\b/.test(lower) && !hits.includes(cat)) hits.push(cat);
  }
  return hits.length ? hits : null;
}

export function parseStoriesScopeFromMessage(
  message: string,
  activeView?: string,
): StoriesScope {
  const lower = message.toLowerCase();
  const viewDefaults = defaultStoriesScopeForView(activeView);

  const wantsPdf =
    /\b(pdf|export|document)\b/.test(lower) ||
    (/\b(report|pack)\b/.test(lower) && /\b(stor|impact|journey|portfolio)\b/.test(lower));
  const wantsNewsletter = /\bnewsletter\b/.test(lower);

  let storyTypes: StoryTypeFilter = viewDefaults.storyTypes ?? "both";
  if (/\bjourney\b/.test(lower) && !/\bportfolio\b/.test(lower)) storyTypes = "journey";
  if (/\bportfolio\b/.test(lower) && !/\bjourney\b/.test(lower)) storyTypes = "portfolio";

  let statusFilter: StoryStatusFilter = viewDefaults.statusFilter ?? "include_review";
  if (/\bapproved\b/.test(lower) || /\bpublished\b/.test(lower)) statusFilter = "approved_only";
  if (/\bunder\s+review\b/.test(lower) || /\bdraft/.test(lower)) statusFilter = "include_review";
  if (/\ball\s+status/.test(lower)) statusFilter = "all";

  const companyIds = parseCompanyIdsFromText(message) ?? "all";
  const categories = parseCategoriesFromText(message) ?? "all";

  let outputFormat: StoriesOutputFormat = "narrative";
  if (wantsPdf) outputFormat = "pdf";
  if (wantsNewsletter) outputFormat = "newsletter";

  return {
    companyIds,
    storyTypes,
    statusFilter,
    categories,
    outputFormat,
    periodFrom: undefined,
    periodTo: undefined,
  };
}

export function hasExplicitCompanyChoice(message: string): boolean {
  const lower = message.toLowerCase();
  if (/\ball\s+(portfolio\s+)?companies\b/.test(lower) || /\bentire\s+portfolio\b/.test(lower)) {
    return true;
  }
  return TALANTON_PORTFOLIO_COMPANIES.some((c) => lower.includes(c.name.toLowerCase()));
}

export function hasExplicitCategoryChoice(message: string): boolean {
  const lower = message.toLowerCase();
  if (/\ball\s+(impact\s+)?(areas?|categories?)\b/.test(lower) || /\bevery\s+category\b/.test(lower) || /\ball\s+impact\b/.test(lower)) {
    return true;
  }
  return IMPACT_CATEGORY_OPTIONS.some((cat) => {
    const token = cat.toLowerCase();
    return lower.includes(token) || lower.includes(token.split("&")[0].trim());
  });
}

export function needsStoriesScopeClarification(message: string): boolean {
  if (!wantsStoriesReportMessage(message)) return false;
  return !hasExplicitCompanyChoice(message) || !hasExplicitCategoryChoice(message);
}

export function isStoriesTopicMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    /\b(impact|portfolio|journey|field)\s+stor(y|ies)\b/.test(lower) ||
    /\bfounder\s+visit/.test(lower) ||
    (/\bstor(y|ies)\b/.test(lower) &&
      /\b(impact|portfolio|journey|field|publish|newsletter|media|board|report|summar)/.test(lower))
  );
}

export function wantsStoriesReportMessage(message: string): boolean {
  const lower = message.toLowerCase();
  if (/\b(pdf|export\s+pdf)\b/.test(lower) && isStoriesTopicMessage(message)) return true;
  return (
    /\b(create|generate|make|build|prepare|export|give\s+me)\b/.test(lower) &&
    /\b(report|pdf|document|pack|deck)\b/.test(lower) &&
    isStoriesTopicMessage(message)
  );
}

export function buildStoriesClarificationMessage(): string {
  const companyList = TALANTON_PORTFOLIO_COMPANIES.slice(0, 8)
    .map((c) => c.name)
    .join(", ");
  return [
    "I can build an impact stories report from live portfolio submissions and journey visits. Before I generate it, please confirm:",
    "",
    "1. Companies — all portfolio companies, or name specific holdings (e.g. ARC Ride, Burn Manufacturing, Pezesha).",
    `   Examples in the demo: ${companyList}, and others.`,
    "2. Impact areas — all categories, or specific themes (Jobs & Livelihoods, Women & Youth, Climate & Environment, etc.).",
    "3. Optional — portfolio submissions vs journey field visits (or both); approved/published only vs include under review; PDF vs narrative summary.",
    "",
    "You can reply in one line, e.g.: All companies, approved only, Women & Youth and Jobs, PDF report.",
  ].join("\n");
}

export function listJourneyStoriesForScope(): JourneyStory[] {
  return listJourneyStories();
}
