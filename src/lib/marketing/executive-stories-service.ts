/**
 * Server-side Talanton stories loader for EA — reads central marketing service.
 */
import { listMarketingStories } from "@/lib/marketing/marketing-service";
import { resolveMarketingWorkspaceId } from "@/lib/marketing/marketing-workspace";
import type { MarketingStoryRecord } from "@/lib/marketing/mappers";
import {
  describeScope,
  queryTalantonStories,
  type StoriesQueryResult,
  type StoriesScope,
  type StoryRow,
} from "@/lib/talanton/executive-stories-intelligence";

function mapCentralPortfolioStory(row: MarketingStoryRecord): StoryRow {
  const ext = row.extensionData ?? {};
  return {
    id: row.id,
    kind: "portfolio",
    title: row.title,
    companyNames: [String(ext.companyName ?? "")].filter(Boolean),
    country: String(ext.country ?? ""),
    status: row.status,
    categoryOrSector: String(ext.impactCategory ?? ""),
    date: String(ext.submissionDate ?? row.updatedAt.slice(0, 10)),
    summary: row.summary,
  };
}

function mapCentralJourneyStory(row: MarketingStoryRecord): StoryRow {
  const ext = row.extensionData ?? {};
  return {
    id: row.id,
    kind: "journey",
    title: row.title,
    companyNames: Array.isArray(ext.companyNames)
      ? (ext.companyNames as string[])
      : [],
    country: String(ext.country ?? ""),
    status: row.status,
    categoryOrSector: String(ext.sector ?? ""),
    date: String(ext.endDate ?? ext.startDate ?? row.updatedAt.slice(0, 10)),
    summary: row.summary || String(ext.purpose ?? ""),
  };
}

function buildStoriesResult(scope: StoriesScope, rows: StoryRow[]): StoriesQueryResult {
  const portfolioRows = rows.filter((row) => row.kind === "portfolio");
  const journeyRows = rows.filter((row) => row.kind === "journey");
  const companySet = new Set(rows.flatMap((r) => r.companyNames));
  const categorySet = new Set(rows.map((r) => r.categoryOrSector).filter(Boolean));
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

export async function queryTalantonStoriesFromCentral(
  scope: StoriesScope,
  workspaceSlug = "talanton",
): Promise<StoriesQueryResult> {
  const workspaceId = await resolveMarketingWorkspaceId({ workspaceSlug });
  const portfolio =
    scope.storyTypes === "journey"
      ? []
      : await listMarketingStories({ workspaceId }, "portfolio");
  const journey =
    scope.storyTypes === "portfolio"
      ? []
      : await listMarketingStories({ workspaceId }, "journey");

  const rows: StoryRow[] = [
    ...portfolio.map(mapCentralPortfolioStory),
    ...journey.map(mapCentralJourneyStory),
  ]
    .filter((row) => {
      if (scope.companyIds !== "all") {
        const companyIds = scope.companyIds;
        const hit = row.companyNames.some((name) => companyIds.includes(name));
        if (!hit && row.kind === "portfolio") return false;
      }
      if (scope.categories !== "all" && !scope.categories.includes(row.categoryOrSector as never)) {
        return false;
      }
      if (scope.periodFrom && row.date < scope.periodFrom) return false;
      if (scope.periodTo && row.date > scope.periodTo) return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return buildStoriesResult(scope, rows);
}

/** Prefer central DB; fall back to in-memory store snapshot when central is unavailable. */
export async function queryTalantonStoriesForEa(
  scope: StoriesScope,
  workspaceSlug = "talanton",
): Promise<StoriesQueryResult> {
  try {
    const central = await queryTalantonStoriesFromCentral(scope, workspaceSlug);
    if (central.rows.length > 0) return central;
  } catch {
    // fall through to legacy store
  }
  return queryTalantonStories(scope);
}
