export const DEFAULT_REPORTING_CURRENCY = "USD";

export type ReportingCurrency = "AUD" | "GBP" | "USD" | "EUR" | "ZAR";

/** Server / slug-based reporting currency (Financials API, ledger overview). */
export function resolveSlugReportingCurrency(slug: string | null | undefined): ReportingCurrency {
  const normalized = String(slug ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return DEFAULT_REPORTING_CURRENCY;

  try {
    const { isCorpCentreWorkspaceSlug } =
      require("@/lib/corpcentre-financials") as typeof import("@/lib/corpcentre-financials");
    if (isCorpCentreWorkspaceSlug(normalized)) return "AUD";
  } catch {
    /* optional at build edges */
  }

  try {
    const { isOnwardAirSlug, ONWARDAIR_REPORTING_CURRENCY } =
      require("@/lib/onwardair-surface") as typeof import("@/lib/onwardair-surface");
    if (isOnwardAirSlug(normalized)) return ONWARDAIR_REPORTING_CURRENCY as ReportingCurrency;
  } catch {
    /* optional at build edges */
  }

  try {
    const { isTalantonImpactSlug, TALANTON_REPORTING_CURRENCY } =
      require("@/lib/talanton-surface") as typeof import("@/lib/talanton-surface");
    if (isTalantonImpactSlug(normalized)) return TALANTON_REPORTING_CURRENCY as ReportingCurrency;
  } catch {
    /* optional at build edges */
  }

  try {
    const { isDemoWorkspaceSlug, DEMO_REPORTING_CURRENCY } =
      require("@/lib/demo/read-only") as typeof import("@/lib/demo/read-only");
    if (isDemoWorkspaceSlug(normalized)) return DEMO_REPORTING_CURRENCY;
  } catch {
    /* optional at build edges */
  }

  try {
    const { isInterfaceWorxSlug, INTERFACE_WORX_REPORTING_CURRENCY } =
      require("@/lib/interface-worx-surface") as typeof import("@/lib/interface-worx-surface");
    if (isInterfaceWorxSlug(normalized)) {
      return INTERFACE_WORX_REPORTING_CURRENCY as ReportingCurrency;
    }
  } catch {
    /* optional at build edges */
  }

  try {
    const { isGreenDesertSlug, GREENDESERT_REPORTING_CURRENCY } =
      require("@/lib/greendesert-surface") as typeof import("@/lib/greendesert-surface");
    if (isGreenDesertSlug(normalized)) {
      return GREENDESERT_REPORTING_CURRENCY as ReportingCurrency;
    }
  } catch {
    /* optional at build edges */
  }

  // Inline slug check — avoid require("@/lib/saec-surface") (Turbopack SSR chunk collision).
  if (normalized === "saec") return "ZAR";

  return DEFAULT_REPORTING_CURRENCY;
}

/** Browser host reporting currency for Financials workspaces. */
export function resolveBrowserReportingCurrency(): ReportingCurrency {
  if (typeof window === "undefined") return DEFAULT_REPORTING_CURRENCY;

  try {
    const { isBrowserCorpCentreSurface } =
      require("@/lib/corpcentre-surface") as typeof import("@/lib/corpcentre-surface");
    if (isBrowserCorpCentreSurface()) return "AUD";
  } catch {
    /* optional at build edges */
  }

  try {
    const { isBrowserOnwardAirSurface, ONWARDAIR_REPORTING_CURRENCY } =
      require("@/lib/onwardair-surface") as typeof import("@/lib/onwardair-surface");
    if (isBrowserOnwardAirSurface()) return ONWARDAIR_REPORTING_CURRENCY as ReportingCurrency;
  } catch {
    /* optional at build edges */
  }

  try {
    const { isBrowserTalantonImpactSurface, TALANTON_REPORTING_CURRENCY } =
      require("@/lib/talanton-surface") as typeof import("@/lib/talanton-surface");
    if (isBrowserTalantonImpactSurface()) return TALANTON_REPORTING_CURRENCY as ReportingCurrency;
  } catch {
    /* optional at build edges */
  }

  try {
    const { isBrowserDemoSurface } =
      require("@/lib/demo-enterprise/surface") as typeof import("@/lib/demo-enterprise/surface");
    const { DEMO_REPORTING_CURRENCY } =
      require("@/lib/demo/read-only") as typeof import("@/lib/demo/read-only");
    if (isBrowserDemoSurface()) return DEMO_REPORTING_CURRENCY;
  } catch {
    /* optional at build edges */
  }

  try {
    const { isBrowserInterfaceWorxSurface, INTERFACE_WORX_REPORTING_CURRENCY } =
      require("@/lib/interface-worx-surface") as typeof import("@/lib/interface-worx-surface");
    if (isBrowserInterfaceWorxSurface()) {
      return INTERFACE_WORX_REPORTING_CURRENCY as ReportingCurrency;
    }
  } catch {
    /* optional at build edges */
  }

  const host = window.location.hostname.split(":")[0].trim().toLowerCase();
  if (host === "omnitransit.unit311central.com" || host === "omnitransit.localhost") return "ZAR";
  if (host === "saec.unit311central.com" || host === "saec.localhost") return "ZAR";
  if (host === "greendesert.unit311central.com" || host === "greendesert.localhost") return "USD";

  return DEFAULT_REPORTING_CURRENCY;
}

export function isUsdReportingBrowserSurface(): boolean {
  return resolveBrowserReportingCurrency() === "USD";
}

/** Round percentage deltas to whole numbers (round up away from zero). */
export function roundReportingPercent(value: number): number {
  const n = Number(value) || 0;
  return n >= 0 ? Math.ceil(n) : Math.floor(n);
}

export function formatReportingPercent(value: number): string {
  const rounded = roundReportingPercent(value);
  return `${rounded > 0 ? "+" : ""}${rounded}`;
}

/** Dashboard / Financials display — whole currency units, rounded up (no .00). */
export function formatReportingMoney(
  amount: number,
  currency?: ReportingCurrency | string | null,
): string {
  const code = String(currency ?? resolveBrowserReportingCurrency()).toUpperCase();
  const rounded = Math.ceil(Number(amount) || 0);
  const locale =
    code === "USD" ? "en-US" : code === "AUD" ? "en-AU" : code === "ZAR" ? "en-ZA" : "en-GB";
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded);

  if (code === "AUD") {
    return formatted.replace(/(^|[^A-Z])A\$/g, "$1AU$").replace(/^(\s*)\$/, "$1AU$");
  }
  return formatted;
}
