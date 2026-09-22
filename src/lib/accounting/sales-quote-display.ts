export type SalesQuoteLineColumnVisibility = {
  showQuantity: boolean;
  showUnit: boolean;
  showRate: boolean;
  showDiscount: boolean;
  showTax: boolean;
};

export type SalesQuotePricingStyle = "detailed" | "scope_total";

export type SalesQuoteBankDetails = {
  accountName?: string;
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  swiftBic?: string;
  sortCode?: string;
  other?: string;
};

export const DEFAULT_SALES_QUOTE_LINE_COLUMN_VISIBILITY: SalesQuoteLineColumnVisibility = {
  showQuantity: true,
  showUnit: true,
  showRate: true,
  showDiscount: true,
  showTax: true,
};

export function normalizeLineColumnVisibility(
  value: unknown,
): SalesQuoteLineColumnVisibility {
  const base = { ...DEFAULT_SALES_QUOTE_LINE_COLUMN_VISIBILITY };
  if (!value || typeof value !== "object") return base;
  const row = value as Record<string, unknown>;
  return {
    showQuantity: row.showQuantity !== false,
    showUnit: row.showUnit !== false,
    showRate: row.showRate !== false,
    showDiscount: row.showDiscount !== false,
    showTax: row.showTax !== false,
  };
}

export function isScopeStyleQuote(
  pricingStyle: SalesQuotePricingStyle,
  visibility: SalesQuoteLineColumnVisibility,
): boolean {
  if (pricingStyle === "scope_total") return true;
  return (
    !visibility.showQuantity &&
    !visibility.showUnit &&
    !visibility.showRate &&
    !visibility.showDiscount &&
    !visibility.showTax
  );
}

function normalizeLocationToken(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

/** City/country line for quote composer & PDF — dedupes repeated city/region/country tokens. */
export function formatSalesQuoteCustomerLocation(parts: {
  city?: string | null;
  region?: string | null;
  country?: string | null;
}): string {
  const segments: string[] = [];
  for (const raw of [parts.city, parts.region, parts.country]) {
    const token = normalizeLocationToken(raw);
    if (!token) continue;
    const duplicate = segments.some(
      (existing) => existing.localeCompare(token, undefined, { sensitivity: "accent" }) === 0,
    );
    if (!duplicate) segments.push(token);
  }
  if (segments.length >= 2) {
    const country = normalizeLocationToken(parts.country);
    const city = normalizeLocationToken(parts.city);
    if (city && country) {
      const cityIndex = segments.findIndex(
        (s) => s.localeCompare(city, undefined, { sensitivity: "accent" }) === 0,
      );
      const countryIndex = segments.findIndex(
        (s) => s.localeCompare(country, undefined, { sensitivity: "accent" }) === 0,
      );
      if (cityIndex >= 0 && countryIndex >= 0 && cityIndex !== countryIndex) {
        return `${segments[cityIndex]}, ${segments[countryIndex]}`;
      }
    }
  }
  return segments.join(", ");
}

export function normalizeBankDetails(value: unknown): SalesQuoteBankDetails | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const clean = (key: keyof SalesQuoteBankDetails) => {
    const v = row[key];
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
  };
  const details: SalesQuoteBankDetails = {
    accountName: clean("accountName"),
    bankName: clean("bankName"),
    accountNumber: clean("accountNumber"),
    iban: clean("iban"),
    swiftBic: clean("swiftBic"),
    sortCode: clean("sortCode"),
    other: clean("other"),
  };
  return Object.values(details).some(Boolean) ? details : null;
}
