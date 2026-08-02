import { getClarityDashboardUrl, getClarityProjectId } from "@/lib/clarity";
import {
  countryDisplayName,
  countryFlagEmoji,
  normalizeDeviceBucket,
  TRAFFIC_SOURCES,
  type TrafficSource,
} from "@/lib/website-analytics/traffic-source";
import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/server";
import { getClarityApiToken, fetchClarityLiveInsights } from "@/lib/website-analytics/clarity-export";

const SNAPSHOT_TABLE = "website_clarity_snapshots";
const EVENTS_TABLE = "website_marketing_events";

export type WebsiteNamedCount = {
  name: string;
  value: number;
  percentage: number;
};

export type WebsiteSourceRow = {
  source: TrafficSource;
  count: number;
  percentage: number;
};

export type WebsiteCountryRow = {
  code: string;
  name: string;
  flag: string;
  count: number;
  percentage: number;
};

export type WebsiteDeviceSplit = {
  name: "Desktop" | "Mobile";
  count: number;
  percentage: number;
};

export type WebsiteAnalyticsSummary = {
  generatedAt: string;
  periodLabel: string;
  clarityConfigured: boolean;
  clarityApiConfigured: boolean;
  clarityDashboardUrl: string;
  clarityProjectId: string;
  recordingsUrl: string;
  heatmapsUrl: string;
  trafficSources: WebsiteSourceRow[];
  content: {
    pages: WebsiteNamedCount[];
    ctas: WebsiteNamedCount[];
  };
  countries: WebsiteCountryRow[];
  devices: WebsiteDeviceSplit[];
};

function randomId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function metaString(meta: Record<string, unknown> | null | undefined, key: string): string | null {
  if (!meta || typeof meta !== "object") return null;
  const value = meta[key];
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function friendlyPageLabel(path: string): string {
  if (!path || path === "/") return "Home";
  const cleaned = path.replace(/\/+$/, "");
  const map: Record<string, string> = {
    "/contact": "Contact",
    "/book": "Book a demo",
    "/industries": "Industries",
    "/about": "About",
    "/faq": "FAQ",
    "/security": "Security",
    "/privacypolicy": "Privacy",
    "/termsandconditions": "Terms",
    "/signup": "Sign up",
    "/login": "Login",
  };
  if (map[cleaned]) return map[cleaned];
  const last = cleaned.split("/").filter(Boolean).pop() || cleaned;
  return last
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function friendlyCtaLabel(label: string | null | undefined, path: string): string {
  const raw = String(label || "").trim();
  if (!raw) return `CTA on ${friendlyPageLabel(path)}`;
  if (raw.startsWith("/")) return friendlyPageLabel(raw);
  if (raw.length > 48) return `${raw.slice(0, 45)}…`;
  return raw;
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

/** Kept for the refresh button — optional Clarity export, not required for the lean dashboard. */
export async function refreshClaritySnapshot(): Promise<{
  ok: boolean;
  error?: string;
  fetchedAt?: string;
}> {
  if (!getClarityApiToken()) {
    return {
      ok: false,
      error:
        "CLARITY_API_TOKEN is not configured. Website Analytics uses first-party telemetry; Clarity links remain available for investigation.",
    };
  }
  if (!isSupabaseServiceRoleConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }
  const result = await fetchClarityLiveInsights({ numOfDays: 3 });
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

export async function buildWebsiteAnalyticsSummary(): Promise<WebsiteAnalyticsSummary> {
  const projectId = getClarityProjectId();
  const dashboardUrl =
    getClarityDashboardUrl() ||
    (projectId
      ? `https://clarity.microsoft.com/projects/view/${projectId}/dashboard`
      : "https://clarity.microsoft.com/");
  const recordingsUrl = projectId
    ? `https://clarity.microsoft.com/projects/view/${projectId}/recordings`
    : dashboardUrl;
  const heatmapsUrl = projectId
    ? `https://clarity.microsoft.com/projects/view/${projectId}/heatmaps`
    : dashboardUrl;

  const emptySources: WebsiteSourceRow[] = TRAFFIC_SOURCES.map((source) => ({
    source,
    count: 0,
    percentage: 0,
  }));

  const base: WebsiteAnalyticsSummary = {
    generatedAt: new Date().toISOString(),
    periodLabel: "Last 30 days",
    clarityConfigured: Boolean(projectId),
    clarityApiConfigured: Boolean(getClarityApiToken()),
    clarityDashboardUrl: dashboardUrl,
    clarityProjectId: projectId,
    recordingsUrl,
    heatmapsUrl,
    trafficSources: emptySources,
    content: { pages: [], ctas: [] },
    countries: [],
    devices: [
      { name: "Desktop", count: 0, percentage: 0 },
      { name: "Mobile", count: 0, percentage: 0 },
    ],
  };

  if (!isSupabaseServiceRoleConfigured()) return base;

  const fromIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from(EVENTS_TABLE)
    .select("event_type, path, label, meta")
    .gte("occurred_at", fromIso)
    .limit(10000);

  const rows = data ?? [];
  const sourceCounts = new Map<TrafficSource, number>();
  for (const source of TRAFFIC_SOURCES) sourceCounts.set(source, 0);

  const pageCounts = new Map<string, number>();
  const ctaCounts = new Map<string, number>();
  const countryVisitorSets = new Map<string, Set<string>>();
  const countryFallbackCounts = new Map<string, number>();
  const deviceVisitorSets = new Map<"Desktop" | "Mobile", Set<string>>();
  const deviceFallbackCounts = new Map<"Desktop" | "Mobile", number>();
  const allVisitors = new Set<string>();

  let sourceEvents = 0;
  let pageViews = 0;
  let ctaClicks = 0;

  for (const row of rows) {
    const meta = (row.meta ?? {}) as Record<string, unknown>;
    const visitorId = metaString(meta, "visitorId");
    if (visitorId) allVisitors.add(visitorId);

    const device = normalizeDeviceBucket(metaString(meta, "device"));
    if (visitorId) {
      const set = deviceVisitorSets.get(device) ?? new Set<string>();
      set.add(visitorId);
      deviceVisitorSets.set(device, set);
    } else if (row.event_type === "page_view") {
      deviceFallbackCounts.set(device, (deviceFallbackCounts.get(device) ?? 0) + 1);
    }

    const country = (metaString(meta, "country") || "UNKNOWN").toUpperCase();
    if (visitorId) {
      const set = countryVisitorSets.get(country) ?? new Set<string>();
      set.add(visitorId);
      countryVisitorSets.set(country, set);
    } else if (row.event_type === "page_view") {
      countryFallbackCounts.set(country, (countryFallbackCounts.get(country) ?? 0) + 1);
    }

    if (row.event_type === "page_view") {
      pageViews += 1;
      const path = String(row.path || "/");
      pageCounts.set(path, (pageCounts.get(path) ?? 0) + 1);

      const trafficSource = (metaString(meta, "trafficSource") || "Direct") as TrafficSource;
      const bucket = TRAFFIC_SOURCES.includes(trafficSource as TrafficSource)
        ? (trafficSource as TrafficSource)
        : "Other";
      sourceCounts.set(bucket, (sourceCounts.get(bucket) ?? 0) + 1);
      sourceEvents += 1;
    } else if (row.event_type === "cta_click") {
      ctaClicks += 1;
      const label = friendlyCtaLabel(row.label, String(row.path || "/"));
      ctaCounts.set(label, (ctaCounts.get(label) ?? 0) + 1);
    }
  }

  const trafficSources = TRAFFIC_SOURCES.map((source) => {
    const count = sourceCounts.get(source) ?? 0;
    return { source, count, percentage: pct(count, sourceEvents) };
  }).sort((a, b) => b.count - a.count);

  const pages = [...pageCounts.entries()]
    .map(([path, value]) => ({
      name: friendlyPageLabel(path),
      value,
      percentage: pct(value, pageViews),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const ctas = [...ctaCounts.entries()]
    .map(([name, value]) => ({
      name,
      value,
      percentage: pct(value, ctaClicks),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const useVisitorCountries = [...countryVisitorSets.values()].some((s) => s.size > 0);
  const countryTotal = useVisitorCountries
    ? [...countryVisitorSets.values()].reduce((sum, set) => sum + set.size, 0)
    : [...countryFallbackCounts.values()].reduce((sum, n) => sum + n, 0);

  const countries: WebsiteCountryRow[] = (
    useVisitorCountries
      ? [...countryVisitorSets.entries()].map(([code, set]) => ({
          code,
          count: set.size,
        }))
      : [...countryFallbackCounts.entries()].map(([code, count]) => ({ code, count }))
  )
    .filter((row) => row.code !== "UNKNOWN" || countryTotal === row.count)
    .map((row) => ({
      code: row.code,
      name: countryDisplayName(row.code),
      flag: countryFlagEmoji(row.code === "UNKNOWN" ? "" : row.code),
      count: row.count,
      percentage: pct(row.count, countryTotal),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const useVisitorDevices = [...deviceVisitorSets.values()].some((s) => s.size > 0);
  const desktopCount = useVisitorDevices
    ? (deviceVisitorSets.get("Desktop")?.size ?? 0)
    : (deviceFallbackCounts.get("Desktop") ?? 0);
  const mobileCount = useVisitorDevices
    ? (deviceVisitorSets.get("Mobile")?.size ?? 0)
    : (deviceFallbackCounts.get("Mobile") ?? 0);
  const deviceTotal = desktopCount + mobileCount;

  return {
    ...base,
    trafficSources,
    content: { pages, ctas },
    countries,
    devices: [
      {
        name: "Desktop",
        count: desktopCount,
        percentage: pct(desktopCount, deviceTotal),
      },
      {
        name: "Mobile",
        count: mobileCount,
        percentage: pct(mobileCount, deviceTotal),
      },
    ],
  };
}
