/**
 * ABHI public-site insights fixtures (www.abhi.org.uk).
 * Styled after Search Console / GA / GTmetrix / Wappalyzer style metrics.
 */

export type AbhiSeoKeyword = {
  keyword: string;
  position: number;
  change: number;
  volume: string;
  url: string;
};

export type AbhiTrafficPoint = {
  day: string;
  visitors: number;
  pageviews: number;
};

export type AbhiTrafficSource = {
  source: string;
  sessions: number;
  sharePct: number;
};

export type AbhiTechDetection = {
  name: string;
  category: string;
  version?: string;
  confidence: "High" | "Medium";
};

export type AbhiPerfMetric = {
  label: string;
  value: string;
  hint: string;
  grade?: "A" | "B" | "C" | "D" | "E" | "F";
};

export const ABHI_SITE_URL = "https://www.abhi.org.uk/";
export const ABHI_SITE_DOMAIN = "www.abhi.org.uk";

export const ABHI_SEO_SUMMARY = {
  domainAuthority: 54,
  organicKeywords: 1_840,
  organicTrafficEst: 12_400,
  avgPosition: 18.4,
  top10Keywords: 86,
  indexedPages: 412,
  crawlErrors: 3,
  coreWebVitals: "Needs improvement",
  visibilityChangePct: 8.6,
} as const;

export const ABHI_SEO_KEYWORDS: AbhiSeoKeyword[] = [
  {
    keyword: "abhi",
    position: 1,
    change: 0,
    volume: "6.6K",
    url: "/",
  },
  {
    keyword: "association of british healthtech industries",
    position: 1,
    change: 0,
    volume: "720",
    url: "/about",
  },
  {
    keyword: "uk medtech trade association",
    position: 3,
    change: 2,
    volume: "480",
    url: "/",
  },
  {
    keyword: "healthtech membership uk",
    position: 5,
    change: 1,
    volume: "390",
    url: "/membership",
  },
  {
    keyword: "nhs market access medtech",
    position: 8,
    change: -1,
    volume: "880",
    url: "/uk-market",
  },
  {
    keyword: "whx dubai healthtech",
    position: 11,
    change: 3,
    volume: "1.1K",
    url: "/events",
  },
  {
    keyword: "medical device regulation uk",
    position: 14,
    change: 2,
    volume: "2.4K",
    url: "/regulatory",
  },
  {
    keyword: "uk healthtech export",
    position: 17,
    change: 4,
    volume: "320",
    url: "/international",
  },
];

/** Last 14 days unique visitors / pageviews. */
export const ABHI_TRAFFIC_SERIES: AbhiTrafficPoint[] = [
  { day: "Jul 19", visitors: 820, pageviews: 2140 },
  { day: "Jul 20", visitors: 910, pageviews: 2380 },
  { day: "Jul 21", visitors: 780, pageviews: 2010 },
  { day: "Jul 22", visitors: 1040, pageviews: 2760 },
  { day: "Jul 23", visitors: 1180, pageviews: 3120 },
  { day: "Jul 24", visitors: 990, pageviews: 2580 },
  { day: "Jul 25", visitors: 860, pageviews: 2240 },
  { day: "Jul 26", visitors: 930, pageviews: 2410 },
  { day: "Jul 27", visitors: 1010, pageviews: 2680 },
  { day: "Jul 28", visitors: 1120, pageviews: 2910 },
  { day: "Jul 29", visitors: 1210, pageviews: 3250 },
  { day: "Jul 30", visitors: 1080, pageviews: 2840 },
  { day: "Jul 31", visitors: 970, pageviews: 2520 },
  { day: "Aug 1", visitors: 1140, pageviews: 3010 },
];

export const ABHI_TRAFFIC_SUMMARY = {
  visitors30d: 22_630,
  visitorsMomPct: 6.4,
  pageviews30d: 61_480,
  pageviewsMomPct: 4.1,
  avgSessionSec: 142,
  bounceRatePct: 41.8,
  pagesPerSession: 2.7,
  newUsersPct: 58,
} as const;

export const ABHI_TRAFFIC_SOURCES: AbhiTrafficSource[] = [
  { source: "Organic search", sessions: 9840, sharePct: 43 },
  { source: "Direct", sessions: 6120, sharePct: 27 },
  { source: "Referral", sessions: 3180, sharePct: 14 },
  { source: "Social", sessions: 2040, sharePct: 9 },
  { source: "Email / CRM", sessions: 1450, sharePct: 7 },
];

export const ABHI_DEVICE_SPLIT = [
  { name: "Desktop", value: 54 },
  { name: "Mobile", value: 41 },
  { name: "Tablet", value: 5 },
] as const;

/** GTmetrix-style performance snapshot. */
export const ABHI_GTMETRIX = {
  performanceGrade: "B" as const,
  structureGrade: "A" as const,
  performanceScore: 78,
  structureScore: 91,
  lcp: "2.8s",
  tbt: "180ms",
  cls: "0.08",
  fullyLoaded: "4.1s",
  totalPageSize: "2.4 MB",
  requests: 86,
  testedAt: "2026-08-01T08:40:00Z",
  location: "London, UK",
  browser: "Chrome (Desktop)",
};

export const ABHI_PERF_METRICS: AbhiPerfMetric[] = [
  { label: "LCP", value: ABHI_GTMETRIX.lcp, hint: "Largest Contentful Paint", grade: "B" },
  { label: "TBT", value: ABHI_GTMETRIX.tbt, hint: "Total Blocking Time", grade: "A" },
  { label: "CLS", value: ABHI_GTMETRIX.cls, hint: "Cumulative Layout Shift", grade: "A" },
  { label: "Fully loaded", value: ABHI_GTMETRIX.fullyLoaded, hint: "Until network idle", grade: "B" },
  { label: "Page weight", value: ABHI_GTMETRIX.totalPageSize, hint: "Transfer size", grade: "C" },
  { label: "Requests", value: String(ABHI_GTMETRIX.requests), hint: "HTTP requests", grade: "B" },
];

/** Wappalyzer-style technology detections. */
export const ABHI_WAPPALYZER: AbhiTechDetection[] = [
  { name: "WordPress", category: "CMS", version: "6.5", confidence: "High" },
  { name: "PHP", category: "Programming languages", version: "8.2", confidence: "High" },
  { name: "MySQL", category: "Databases", confidence: "Medium" },
  { name: "Cloudflare", category: "CDN / Security", confidence: "High" },
  { name: "Nginx", category: "Web servers", confidence: "Medium" },
  { name: "jQuery", category: "JavaScript libraries", version: "3.7", confidence: "High" },
  { name: "Google Tag Manager", category: "Tag managers", confidence: "High" },
  { name: "Google Analytics 4", category: "Analytics", confidence: "High" },
  { name: "Yoast SEO", category: "SEO", confidence: "High" },
  { name: "Gravity Forms", category: "Form builders", confidence: "Medium" },
  { name: "HSTS", category: "Security", confidence: "High" },
  { name: "HTTP/2", category: "Miscellaneous", confidence: "High" },
];

export function isAbhiManagedWebsite(website: { id?: string; domain?: string; url?: string }) {
  const id = website.id ?? "";
  const domain = (website.domain ?? "").toLowerCase();
  const url = (website.url ?? "").toLowerCase();
  return id.startsWith("web-abhi") || domain.includes("abhi.org.uk") || url.includes("abhi.org.uk");
}
