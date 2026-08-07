export const DEFAULT_REPORTING_CURRENCY = "GBP";

export type ReportingCurrency = "AUD" | "GBP" | "USD" | "EUR";

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
    if (isBrowserDemoSurface()) return "USD";
  } catch {
    /* optional at build edges */
  }

  return DEFAULT_REPORTING_CURRENCY;
}

export function isUsdReportingBrowserSurface(): boolean {
  return resolveBrowserReportingCurrency() === "USD";
}

/** Dashboard / Financials display — whole currency units, rounded up (no .00). */
export function formatReportingMoney(
  amount: number,
  currency?: ReportingCurrency | string | null,
): string {
  const code = String(currency ?? resolveBrowserReportingCurrency()).toUpperCase();
  const rounded = Math.ceil(Number(amount) || 0);
  const locale = code === "USD" ? "en-US" : code === "AUD" ? "en-AU" : "en-GB";
  const noDecimals = code === "USD" || code === "AUD";
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    minimumFractionDigits: noDecimals ? 0 : 2,
    maximumFractionDigits: noDecimals ? 0 : 2,
  }).format(rounded);

  if (code === "AUD") {
    return formatted.replace(/(^|[^A-Z])A\$/g, "$1AU$").replace(/^(\s*)\$/, "$1AU$");
  }
  return formatted;
}
