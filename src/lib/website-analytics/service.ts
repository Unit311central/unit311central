import {
  fetchClarityLiveInsights,
  getClarityApiToken,
  metricRows,
  sumNumeric,
  type ClarityMetricBlock,
} from "@/lib/website-analytics/clarity-export";
import { getClarityDashboardUrl, getClarityProjectId } from "@/lib/clarity";
import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/server";

const SNAPSHOT_TABLE = "website_clarity_snapshots";
const EVENTS_TABLE = "website_marketing_events";

export type WebsiteNamedCount = { name: string; value: number };

export type WebsiteAnalyticsSummary = {
  generatedAt: string;
  clarityConfigured: boolean;
  clarityApiConfigured: boolean;
  clarityDashboardUrl: string;
  clarityProjectId: string;
  clarityFetchedAt: string | null;
  clarityError: string | null;
  traffic: {
    sessions: number;
    visitors: number;
    returningVisitors: number;
    botSessions: number;
    pagesPerSession: number;
    countries: WebsiteNamedCount[];
    devices: WebsiteNamedCount[];
    browsers: WebsiteNamedCount[];
  };
  pages: {
    mostVisited: WebsiteNamedCount[];
    leastVisited: WebsiteNamedCount[];
    entryPages: WebsiteNamedCount[];
    exitPages: WebsiteNamedCount[];
    averageTimeOnPageSeconds: number;
    popularWithEngagement: Array<{
      name: string;
      sessions: number;
      engagementTime: number;
    }>;
  };
  behaviour: {
    rageClicks: number;
    deadClicks: number;
    quickBacks: number;
  };
  marketing: {
    homeVisits: number;
    featuresVisits: number;
    pricingVisits: number;
    contactVisits: number;
    demoVisits: number;
    ctaClicks: number;
    contactSubmissions: number;
    demoRequests: number;
    contactConversionRate: number;
    demoConversionRate: number;
  };
  journeys: {
    note: string;
    topPaths: WebsiteNamedCount[];
  };
  recordingsUrl: string;
  heatmapsUrl: string;
};

function randomId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function num(row: Record<string, string | number | null | undefined>, ...keys: string[]) {
  for (const key of keys) {
    const raw = row[key];
    const n = typeof raw === "number" ? raw : Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function labelFromRow(row: Record<string, string | number | null | undefined>, keys: string[]) {
  for (const key of keys) {
    const v = row[key];
    if (v != null && String(v).trim()) return String(v);
  }
  return "Unknown";
}

function isMarketingUrl(url: string): boolean {
  const u = url.toLowerCase();
  if (!u) return false;
  // Prefer public apex; exclude ops/customer subdomains when present in full URLs.
  if (u.includes("internal.") || u.includes("demo.") || u.includes(".unit311central.com/dashboard")) {
    return false;
  }
  if (u.includes("unit311central.com") || u.startsWith("/") || u.includes("localhost")) {
    return true;
  }
  return false;
}

function classifyPath(url: string): string {
  try {
    const parsed = url.startsWith("http") ? new URL(url) : new URL(url, "https://unit311central.com");
    return parsed.pathname || "/";
  } catch {
    return url.startsWith("/") ? url : "/";
  }
}

async function loadLatestSnapshot(): Promise<{
  payload: ClarityMetricBlock[];
  fetchedAt: string | null;
  error: string | null;
} | null> {
  if (!isSupabaseServiceRoleConfigured()) return null;
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from(SNAPSHOT_TABLE)
    .select("payload, fetched_at, error")
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    payload: (data.payload as ClarityMetricBlock[]) ?? [],
    fetchedAt: data.fetched_at ?? null,
    error: data.error ?? null,
  };
}

export async function refreshClaritySnapshot(): Promise<{
  ok: boolean;
  error?: string;
  fetchedAt?: string;
}> {
  if (!isSupabaseServiceRoleConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }

  // Prefer URL breakdown for page analytics (uses 1 of 10 daily calls).
  const result = await fetchClarityLiveInsights({ numOfDays: 3, dimension1: "URL" });
  const fetchedAt = new Date().toISOString();
  const supabase = createSupabaseServiceRoleClient();

  await supabase.from(SNAPSHOT_TABLE).insert({
    id: randomId("wcs"),
    fetched_at: fetchedAt,
    num_of_days: 3,
    payload: result.ok ? result.data : [],
    error: result.ok ? null : result.error,
  });

  if (!result.ok) return { ok: false, error: result.error, fetchedAt };
  return { ok: true, fetchedAt };
}

export async function insertMarketingEvent(input: {
  eventType: string;
  path: string;
  label?: string | null;
  meta?: Record<string, unknown>;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseServiceRoleConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }
  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.from(EVENTS_TABLE).insert({
    id: randomId("wme"),
    event_type: input.eventType,
    path: input.path || "/",
    label: input.label ?? null,
    meta: input.meta ?? {},
    occurred_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function loadMarketingCounts(fromIso: string) {
  if (!isSupabaseServiceRoleConfigured()) {
    return {
      pageViews: [] as Array<{ path: string; count: number }>,
      ctaClicks: 0,
      contactSubmissions: 0,
      demoRequests: 0,
    };
  }
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from(EVENTS_TABLE)
    .select("event_type, path, label")
    .gte("occurred_at", fromIso)
    .limit(10000);

  const rows = data ?? [];
  const pageMap = new Map<string, number>();
  let ctaClicks = 0;
  let contactSubmissions = 0;
  let demoRequests = 0;

  for (const row of rows) {
    if (row.event_type === "page_view") {
      const path = String(row.path || "/");
      pageMap.set(path, (pageMap.get(path) ?? 0) + 1);
    } else if (row.event_type === "cta_click") {
      ctaClicks += 1;
    } else if (row.event_type === "contact_submit") {
      contactSubmissions += 1;
    } else if (row.event_type === "demo_request") {
      demoRequests += 1;
    }
  }

  return {
    pageViews: [...pageMap.entries()].map(([path, count]) => ({ path, count })),
    ctaClicks,
    contactSubmissions,
    demoRequests,
  };
}

function namedFromDimension(
  rows: Array<Record<string, string | number | null | undefined>>,
  dimensionKeys: string[],
  valueKeys: string[],
): WebsiteNamedCount[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const name = labelFromRow(row, dimensionKeys);
    const value = num(row, ...valueKeys);
    map.set(name, (map.get(name) ?? 0) + value);
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12);
}

export async function buildWebsiteAnalyticsSummary(): Promise<WebsiteAnalyticsSummary> {
  const dashboardUrl =
    getClarityDashboardUrl() ||
    (getClarityProjectId()
      ? `https://clarity.microsoft.com/projects/view/${getClarityProjectId()}/dashboard`
      : "https://clarity.microsoft.com/");
  const projectId = getClarityProjectId();
  const recordingsUrl = projectId
    ? `https://clarity.microsoft.com/projects/view/${projectId}/recordings`
    : dashboardUrl;
  const heatmapsUrl = projectId
    ? `https://clarity.microsoft.com/projects/view/${projectId}/heatmaps`
    : dashboardUrl;

  let snapshot = await loadLatestSnapshot();
  const staleMs = 6 * 60 * 60 * 1000;
  const isStale =
    !snapshot?.fetchedAt ||
    Date.now() - new Date(snapshot.fetchedAt).getTime() > staleMs;

  // Refresh at most when stale and token exists (protects 10/day quota).
  if (isStale && getClarityApiToken()) {
    await refreshClaritySnapshot();
    snapshot = await loadLatestSnapshot();
  }

  // Also pull device/browser/country if latest snapshot is URL-only — use cached payload as-is.
  const blocks = snapshot?.payload ?? [];

  const trafficRows = metricRows(blocks, "Traffic");
  const popularRows = metricRows(blocks, "Popular Pages");
  const urlRows = [
    ...trafficRows.filter((r) => r.URL || r.Url || r.url),
    ...popularRows,
    ...metricRows(blocks, "URL"),
  ];

  const marketingUrlRows = urlRows.filter((row) => {
    const url = String(row.URL ?? row.Url ?? row.url ?? row.PageUrl ?? "");
    return !url || isMarketingUrl(url);
  });

  const sessions = sumNumeric(trafficRows.length ? trafficRows : marketingUrlRows, "totalSessionCount");
  const visitors = sumNumeric(
    trafficRows.length ? trafficRows : marketingUrlRows,
    "distantUserCount",
    "distinctUserCount",
    "totalUserCount",
  );
  const returningVisitors = sumNumeric(
    trafficRows.length ? trafficRows : marketingUrlRows,
    "returningUserCount",
    "ReturningUserCount",
    "repeatUserCount",
  );
  const botSessions = sumNumeric(trafficRows, "totalBotSessionCount");

  const pagesPerSession =
    trafficRows.length > 0
      ? trafficRows.reduce((s, r) => s + num(r, "PagesPerSessionPercentage", "pagesPerSession"), 0) /
        trafficRows.length
      : 0;

  const pageSessionMap = new Map<string, number>();
  const pageEngagement: Array<{ name: string; sessions: number; engagementTime: number }> = [];
  for (const row of marketingUrlRows) {
    const url = String(row.URL ?? row.Url ?? row.url ?? row.PageUrl ?? row.PageTitle ?? "Unknown");
    const path = classifyPath(url);
    const sess = num(row, "totalSessionCount", "sessions", "Sessions");
    pageSessionMap.set(path, (pageSessionMap.get(path) ?? 0) + sess);
    pageEngagement.push({
      name: path,
      sessions: sess,
      engagementTime: num(row, "EngagementTime", "engagementTime", "activeTime"),
    });
  }

  const mostVisited = [...pageSessionMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const leastVisited = [...mostVisited].reverse().slice(0, 10);

  const engagementTimes = pageEngagement
    .map((p) => p.engagementTime)
    .filter((n) => Number.isFinite(n) && n > 0);
  const averageTimeOnPageSeconds =
    engagementTimes.length > 0
      ? Math.round(engagementTimes.reduce((s, n) => s + n, 0) / engagementTimes.length)
      : 0;

  // Entry ≈ highest-traffic marketing pages; exit ≈ lowest among observed set (Clarity pathing in dashboard).
  const entryPages = mostVisited.slice(0, 8);
  const exitPages = leastVisited.slice(0, 8);

  const fromIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const marketing = await loadMarketingCounts(fromIso);

  const pathCount = (match: (p: string) => boolean) =>
    marketing.pageViews.filter((p) => match(p.path)).reduce((s, p) => s + p.count, 0) +
    mostVisited.filter((p) => match(p.name)).reduce((s, p) => s + p.value, 0);

  const homeVisits = pathCount((p) => p === "/" || p === "");
  const featuresVisits = pathCount((p) => /feature|industries|module/i.test(p));
  const pricingVisits = pathCount((p) => /pricing/i.test(p));
  const contactVisits = pathCount((p) => p.startsWith("/contact"));
  const demoVisits = pathCount((p) => p.startsWith("/book") || /demo/i.test(p));

  const contactConversionRate =
    contactVisits > 0 ? Math.round((marketing.contactSubmissions / contactVisits) * 1000) / 10 : 0;
  const demoConversionRate =
    demoVisits > 0 ? Math.round((marketing.demoRequests / demoVisits) * 1000) / 10 : 0;

  // Merge first-party page views into rankings when Clarity URL data is thin.
  if (mostVisited.length < 3) {
    for (const pv of marketing.pageViews) {
      const existing = mostVisited.find((m) => m.name === pv.path);
      if (existing) existing.value += pv.count;
      else mostVisited.push({ name: pv.path, value: pv.count });
    }
    mostVisited.sort((a, b) => b.value - a.value);
  }

  const rageClicks = sumNumeric(
    [...metricRows(blocks, "Rage Click Count"), ...marketingUrlRows],
    "rageClickCount",
    "RageClickCount",
  );
  const deadClicks = sumNumeric(
    [...metricRows(blocks, "Dead Click Count"), ...marketingUrlRows],
    "deadClickCount",
    "DeadClickCount",
  );
  const quickBacks = sumNumeric(
    [...metricRows(blocks, "Quickback Click"), ...marketingUrlRows],
    "quickBackCount",
    "QuickBackCount",
    "quickbackClick",
  );

  return {
    generatedAt: new Date().toISOString(),
    clarityConfigured: Boolean(projectId),
    clarityApiConfigured: Boolean(getClarityApiToken()),
    clarityDashboardUrl: dashboardUrl,
    clarityProjectId: projectId,
    clarityFetchedAt: snapshot?.fetchedAt ?? null,
    clarityError: snapshot?.error ?? null,
    traffic: {
      sessions,
      visitors,
      returningVisitors:
        returningVisitors > 0
          ? returningVisitors
          : Math.max(0, sessions > visitors ? sessions - visitors : 0),
      botSessions,
      pagesPerSession: Math.round(pagesPerSession * 100) / 100,
      countries: namedFromDimension(
        metricRows(blocks, "Country/Region").length
          ? metricRows(blocks, "Country/Region")
          : trafficRows,
        ["Country/Region", "Country", "country"],
        ["totalSessionCount", "distantUserCount", "distinctUserCount"],
      ),
      devices: namedFromDimension(
        metricRows(blocks, "Device").length ? metricRows(blocks, "Device") : trafficRows,
        ["Device", "device"],
        ["totalSessionCount", "distantUserCount"],
      ),
      browsers: namedFromDimension(
        metricRows(blocks, "Browser").length ? metricRows(blocks, "Browser") : trafficRows,
        ["Browser", "browser"],
        ["totalSessionCount", "distantUserCount"],
      ),
    },
    pages: {
      mostVisited: mostVisited.slice(0, 12),
      leastVisited: leastVisited.slice(0, 12),
      entryPages,
      exitPages,
      averageTimeOnPageSeconds,
      popularWithEngagement: pageEngagement
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 12),
    },
    behaviour: {
      rageClicks,
      deadClicks,
      quickBacks,
    },
    marketing: {
      homeVisits,
      featuresVisits,
      pricingVisits,
      contactVisits,
      demoVisits,
      ctaClicks: marketing.ctaClicks,
      contactSubmissions: marketing.contactSubmissions,
      demoRequests: marketing.demoRequests,
      contactConversionRate,
      demoConversionRate,
    },
    journeys: {
      note: "Detailed pathing, heatmaps, and session recordings open in Microsoft Clarity.",
      topPaths: mostVisited.slice(0, 8),
    },
    recordingsUrl,
    heatmapsUrl,
  };
}
