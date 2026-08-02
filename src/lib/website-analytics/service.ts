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
  /** Where traffic KPIs currently come from. */
  trafficSource: "clarity_api" | "first_party" | "mixed" | "none";
  dataNotes: string[];
  traffic: {
    sessions: number;
    visitors: number;
    returningVisitors: number;
    botSessions: number;
    pagesPerSession: number;
    pageViews: number;
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
    availableViaClarityOnly: boolean;
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

type FirstPartyAggregate = {
  pageViews: Array<{ path: string; count: number }>;
  totalPageViews: number;
  visitors: number;
  sessions: number;
  returningVisitors: number;
  pagesPerSession: number;
  countries: WebsiteNamedCount[];
  devices: WebsiteNamedCount[];
  browsers: WebsiteNamedCount[];
  ctaClicks: number;
  contactSubmissions: number;
  demoRequests: number;
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

function metaString(meta: Record<string, unknown> | null | undefined, key: string): string | null {
  if (!meta || typeof meta !== "object") return null;
  const value = meta[key];
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
}

function bump(map: Map<string, number>, key: string, by = 1) {
  map.set(key, (map.get(key) ?? 0) + by);
}

function sortedCounts(map: Map<string, number>, limit = 12): WebsiteNamedCount[] {
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
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

function mergeMetricBlocks(
  ...blocksList: ClarityMetricBlock[][]
): ClarityMetricBlock[] {
  const byName = new Map<string, ClarityMetricBlock>();
  for (const blocks of blocksList) {
    for (const block of blocks) {
      const key = block.metricName || "Unknown";
      const existing = byName.get(key);
      if (!existing) {
        byName.set(key, {
          metricName: key,
          information: [...(block.information ?? [])],
        });
      } else {
        existing.information.push(...(block.information ?? []));
      }
    }
  }
  return [...byName.values()];
}

export async function refreshClaritySnapshot(): Promise<{
  ok: boolean;
  error?: string;
  fetchedAt?: string;
}> {
  if (!isSupabaseServiceRoleConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }
  if (!getClarityApiToken()) {
    return {
      ok: false,
      error:
        "CLARITY_API_TOKEN is not configured. Generate a token in Clarity → Settings → Data Export, then set it on Vercel Production.",
    };
  }

  // Two of 10 daily calls: overview metrics + URL breakdown.
  const [overview, byUrl] = await Promise.all([
    fetchClarityLiveInsights({ numOfDays: 3 }),
    fetchClarityLiveInsights({ numOfDays: 3, dimension1: "URL" }),
  ]);

  const fetchedAt = new Date().toISOString();
  const ok = overview.ok || byUrl.ok;
  const payload = mergeMetricBlocks(
    overview.ok ? overview.data : [],
    byUrl.ok ? byUrl.data : [],
  );
  const error = ok
    ? null
    : [overview.ok ? null : overview.error, byUrl.ok ? null : byUrl.error]
        .filter(Boolean)
        .join(" | ");

  const supabase = createSupabaseServiceRoleClient();
  await supabase.from(SNAPSHOT_TABLE).insert({
    id: randomId("wcs"),
    fetched_at: fetchedAt,
    num_of_days: 3,
    payload,
    error,
  });

  if (!ok) return { ok: false, error: error || "Clarity export failed.", fetchedAt };
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

async function loadFirstPartyAggregate(fromIso: string): Promise<FirstPartyAggregate> {
  const empty: FirstPartyAggregate = {
    pageViews: [],
    totalPageViews: 0,
    visitors: 0,
    sessions: 0,
    returningVisitors: 0,
    pagesPerSession: 0,
    countries: [],
    devices: [],
    browsers: [],
    ctaClicks: 0,
    contactSubmissions: 0,
    demoRequests: 0,
  };

  if (!isSupabaseServiceRoleConfigured()) return empty;
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from(EVENTS_TABLE)
    .select("event_type, path, label, meta")
    .gte("occurred_at", fromIso)
    .limit(10000);

  const rows = data ?? [];
  const pageMap = new Map<string, number>();
  const countries = new Map<string, number>();
  const devices = new Map<string, number>();
  const browsers = new Map<string, number>();
  const visitors = new Set<string>();
  const sessions = new Set<string>();
  const sessionsByVisitor = new Map<string, Set<string>>();
  let ctaClicks = 0;
  let contactSubmissions = 0;
  let demoRequests = 0;
  let totalPageViews = 0;

  for (const row of rows) {
    const meta = (row.meta ?? {}) as Record<string, unknown>;
    const visitorId = metaString(meta, "visitorId");
    const sessionId = metaString(meta, "sessionId");
    const country = metaString(meta, "country");
    const device = metaString(meta, "device");
    const browser = metaString(meta, "browser");

    if (visitorId) visitors.add(visitorId);
    if (sessionId) sessions.add(sessionId);
    if (visitorId && sessionId) {
      const set = sessionsByVisitor.get(visitorId) ?? new Set<string>();
      set.add(sessionId);
      sessionsByVisitor.set(visitorId, set);
    }

    if (row.event_type === "page_view") {
      const path = String(row.path || "/");
      bump(pageMap, path);
      totalPageViews += 1;
      if (country) bump(countries, country);
      if (device) bump(devices, device);
      if (browser) bump(browsers, browser);
    } else if (row.event_type === "cta_click") {
      ctaClicks += 1;
    } else if (row.event_type === "contact_submit") {
      contactSubmissions += 1;
    } else if (row.event_type === "demo_request") {
      demoRequests += 1;
    }
  }

  let returningVisitors = 0;
  for (const set of sessionsByVisitor.values()) {
    if (set.size > 1) returningVisitors += 1;
  }

  const sessionCount = sessions.size;
  const pagesPerSession =
    sessionCount > 0 ? Math.round((totalPageViews / sessionCount) * 100) / 100 : 0;

  return {
    pageViews: [...pageMap.entries()].map(([path, count]) => ({ path, count })),
    totalPageViews,
    visitors: visitors.size,
    sessions: sessionCount,
    returningVisitors,
    pagesPerSession,
    countries: sortedCounts(countries),
    devices: sortedCounts(devices),
    browsers: sortedCounts(browsers),
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

  if (isStale && getClarityApiToken()) {
    await refreshClaritySnapshot();
    snapshot = await loadLatestSnapshot();
  }

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

  const claritySessions = sumNumeric(
    trafficRows.length ? trafficRows : marketingUrlRows,
    "totalSessionCount",
  );
  const clarityVisitors = sumNumeric(
    trafficRows.length ? trafficRows : marketingUrlRows,
    "distantUserCount",
    "distinctUserCount",
    "totalUserCount",
  );
  const clarityReturning = sumNumeric(
    trafficRows.length ? trafficRows : marketingUrlRows,
    "returningUserCount",
    "ReturningUserCount",
    "repeatUserCount",
  );
  const botSessions = sumNumeric(trafficRows, "totalBotSessionCount");
  const pagesPerSessionClarity =
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

  let mostVisited = [...pageSessionMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const engagementTimes = pageEngagement
    .map((p) => p.engagementTime)
    .filter((n) => Number.isFinite(n) && n > 0);
  const averageTimeOnPageSeconds =
    engagementTimes.length > 0
      ? Math.round(engagementTimes.reduce((s, n) => s + n, 0) / engagementTimes.length)
      : 0;

  const fromIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const firstParty = await loadFirstPartyAggregate(fromIso);

  // Prefer Clarity URL ranks; fall back / merge first-party page views.
  if (mostVisited.length < 3) {
    for (const pv of firstParty.pageViews) {
      const existing = mostVisited.find((m) => m.name === pv.path);
      if (existing) existing.value += pv.count;
      else mostVisited.push({ name: pv.path, value: pv.count });
    }
    mostVisited.sort((a, b) => b.value - a.value);
  }

  const leastVisited = [...mostVisited].reverse().slice(0, 10);
  const entryPages = mostVisited.slice(0, 8);
  const exitPages = leastVisited.slice(0, 8);

  const pathCount = (match: (p: string) => boolean) =>
    firstParty.pageViews.filter((p) => match(p.path)).reduce((s, p) => s + p.count, 0) +
    mostVisited.filter((p) => match(p.name)).reduce((s, p) => s + p.value, 0);

  const homeVisits = pathCount((p) => p === "/" || p === "");
  const featuresVisits = pathCount((p) => /feature|industries|module|platform/i.test(p));
  const pricingVisits = pathCount((p) => /pricing/i.test(p));
  const contactVisits = pathCount((p) => p.startsWith("/contact"));
  const demoVisits = pathCount((p) => p.startsWith("/book") || /demo/i.test(p));

  const contactConversionRate =
    contactVisits > 0
      ? Math.round((firstParty.contactSubmissions / contactVisits) * 1000) / 10
      : 0;
  const demoConversionRate =
    demoVisits > 0 ? Math.round((firstParty.demoRequests / demoVisits) * 1000) / 10 : 0;

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

  const clarityCountries = namedFromDimension(
    metricRows(blocks, "Country/Region").length
      ? metricRows(blocks, "Country/Region")
      : trafficRows,
    ["Country/Region", "Country", "country"],
    ["totalSessionCount", "distantUserCount", "distinctUserCount"],
  );
  const clarityDevices = namedFromDimension(
    metricRows(blocks, "Device").length ? metricRows(blocks, "Device") : trafficRows,
    ["Device", "device"],
    ["totalSessionCount", "distantUserCount"],
  );
  const clarityBrowsers = namedFromDimension(
    metricRows(blocks, "Browser").length ? metricRows(blocks, "Browser") : trafficRows,
    ["Browser", "browser"],
    ["totalSessionCount", "distantUserCount"],
  );

  const hasClarityTraffic = claritySessions > 0 || clarityVisitors > 0;
  const hasFirstPartyTraffic = firstParty.totalPageViews > 0 || firstParty.sessions > 0;

  let trafficSource: WebsiteAnalyticsSummary["trafficSource"] = "none";
  if (hasClarityTraffic && hasFirstPartyTraffic) trafficSource = "mixed";
  else if (hasClarityTraffic) trafficSource = "clarity_api";
  else if (hasFirstPartyTraffic) trafficSource = "first_party";

  const dataNotes: string[] = [];
  if (!getClarityApiToken()) {
    dataNotes.push(
      "CLARITY_API_TOKEN is missing. Visitors/sessions/countries/devices/browsers below use first-party website telemetry. Rage clicks, dead clicks, quick backs, heatmaps, and recordings require Clarity (API or dashboard).",
    );
  } else if (!hasClarityTraffic) {
    dataNotes.push(
      "Clarity API token is configured but no usable snapshot metrics yet. Showing first-party website telemetry until the next successful export.",
    );
  }
  if (hasFirstPartyTraffic) {
    dataNotes.push(
      `First-party window: last 30 days · ${firstParty.totalPageViews} page views · ${firstParty.visitors} visitors · ${firstParty.sessions} sessions.`,
    );
  }

  return {
    generatedAt: new Date().toISOString(),
    clarityConfigured: Boolean(projectId),
    clarityApiConfigured: Boolean(getClarityApiToken()),
    clarityDashboardUrl: dashboardUrl,
    clarityProjectId: projectId,
    clarityFetchedAt: snapshot?.fetchedAt ?? null,
    clarityError: snapshot?.error ?? null,
    trafficSource,
    dataNotes,
    traffic: {
      sessions: hasClarityTraffic ? claritySessions : firstParty.sessions,
      visitors: hasClarityTraffic ? clarityVisitors : firstParty.visitors,
      returningVisitors: hasClarityTraffic
        ? clarityReturning > 0
          ? clarityReturning
          : Math.max(0, claritySessions > clarityVisitors ? claritySessions - clarityVisitors : 0)
        : firstParty.returningVisitors,
      botSessions,
      pagesPerSession: hasClarityTraffic
        ? Math.round(pagesPerSessionClarity * 100) / 100
        : firstParty.pagesPerSession,
      pageViews: firstParty.totalPageViews,
      countries: clarityCountries.length ? clarityCountries : firstParty.countries,
      devices: clarityDevices.length ? clarityDevices : firstParty.devices,
      browsers: clarityBrowsers.length ? clarityBrowsers : firstParty.browsers,
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
      availableViaClarityOnly: !hasClarityTraffic,
    },
    marketing: {
      homeVisits,
      featuresVisits,
      pricingVisits,
      contactVisits,
      demoVisits,
      ctaClicks: firstParty.ctaClicks,
      contactSubmissions: firstParty.contactSubmissions,
      demoRequests: firstParty.demoRequests,
      contactConversionRate,
      demoConversionRate,
    },
    journeys: {
      note: hasClarityTraffic
        ? "Detailed pathing, heatmaps, and session recordings open in Microsoft Clarity."
        : "Common pages from first-party page views. Open Clarity for heatmaps, recordings, and full pathing.",
      topPaths: mostVisited.slice(0, 8),
    },
    recordingsUrl,
    heatmapsUrl,
  };
}
