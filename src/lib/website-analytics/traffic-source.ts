export const TRAFFIC_SOURCES = [
  "Organic Search",
  "Direct",
  "Referral",
  "LinkedIn",
  "Other",
] as const;

export type TrafficSource = (typeof TRAFFIC_SOURCES)[number];

const SEARCH_HOSTS =
  /(^|\.)(google|bing|yahoo|duckduckgo|baidu|yandex|ecosia)\.[a-z.]+$/i;

/**
 * Classify acquisition channel for marketing analytics.
 * Session-first-touch should be applied by the beacon before calling this.
 */
export function classifyTrafficSource(input: {
  referrer?: string | null;
  search?: string | null;
  landingHost?: string | null;
}): TrafficSource {
  const search = String(input.search ?? "");
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const utmSource = (params.get("utm_source") || params.get("source") || "").toLowerCase();
  const utmMedium = (params.get("utm_medium") || "").toLowerCase();
  const utmCampaign = (params.get("utm_campaign") || "").toLowerCase();

  const blob = `${utmSource} ${utmMedium} ${utmCampaign}`;
  if (blob.includes("linkedin") || blob.includes("li-")) return "LinkedIn";

  if (
    utmMedium === "organic" ||
    utmSource === "google" ||
    utmSource === "bing" ||
    utmSource === "yahoo" ||
    utmSource === "duckduckgo"
  ) {
    return "Organic Search";
  }

  const referrer = String(input.referrer ?? "").trim();
  if (!referrer) {
    if (utmSource || utmMedium) return "Other";
    return "Direct";
  }

  try {
    const refUrl = new URL(referrer);
    const host = refUrl.hostname.toLowerCase().replace(/^www\./, "");
    const landing = String(input.landingHost ?? "")
      .toLowerCase()
      .replace(/^www\./, "")
      .split(":")[0];

    if (host.includes("linkedin.com") || host.includes("lnkd.in")) return "LinkedIn";
    if (SEARCH_HOSTS.test(host)) return "Organic Search";
    if (
      host === landing ||
      host.endsWith(".unit311central.com") ||
      host === "unit311central.com" ||
      host.includes("localhost")
    ) {
      return "Direct";
    }
    return "Referral";
  } catch {
    return "Other";
  }
}

export function countryFlagEmoji(countryCode: string): string {
  const code = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return "🌐";
  return String.fromCodePoint(
    ...[...code].map((char) => 127397 + char.charCodeAt(0)),
  );
}

export function countryDisplayName(countryCode: string): string {
  const code = countryCode.trim().toUpperCase();
  if (!code || code === "UNKNOWN") return "Unknown";
  try {
    return (
      new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code
    );
  } catch {
    return code;
  }
}

export function normalizeDeviceBucket(device: string | null | undefined): "Desktop" | "Mobile" {
  const value = String(device ?? "").toLowerCase();
  if (value.includes("mobile") || value.includes("tablet") || value.includes("phone")) {
    return "Mobile";
  }
  return "Desktop";
}
