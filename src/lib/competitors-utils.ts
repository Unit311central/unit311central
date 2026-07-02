export type ServiceCategory = "surveying" | "inspection" | "media" | "other";

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  surveying: "Surveying",
  inspection: "Inspection",
  media: "Media",
  other: "Other",
};

export const SERVICE_CATEGORY_ORDER: ServiceCategory[] = [
  "surveying",
  "inspection",
  "media",
  "other",
];

export function parseServiceCategories(value: string | null | undefined): ServiceCategory[] {
  if (!value?.trim()) return [];

  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item): item is ServiceCategory =>
      ["surveying", "inspection", "media", "other"].includes(item),
    );
}

export function serializeServiceCategories(categories: ServiceCategory[]) {
  return SERVICE_CATEGORY_ORDER.filter((category) => categories.includes(category)).join(",");
}

export function inferServiceCategoriesFromText(services: string): ServiceCategory[] {
  const text = services.toLowerCase();
  const categories = new Set<ServiceCategory>();

  if (/survey|topograph|photogrammetr|lidar|mapping|cadastral|volumetric|orthomosaic|bim/.test(text)) {
    categories.add("surveying");
  }
  if (/inspect|thermal|roof|asset|infrastructure|tower|facade|envelope|maintenance/.test(text)) {
    categories.add("inspection");
  }
  if (/media|film|photo|marketing|aerial capture|visual capture/.test(text)) {
    categories.add("media");
  }
  if (/consult|train|compliance|strategy|procurement|hardware|sales|repair|academy|advisory/.test(text)) {
    categories.add("other");
  }

  if (categories.size === 0 && text.trim()) {
    categories.add("other");
  }

  return SERVICE_CATEGORY_ORDER.filter((category) => categories.has(category));
}

export function parseRevenueSortValue(revenue: string): number {
  const normalized = revenue.trim().toLowerCase();
  const match = normalized.match(/(?:[£€$]\s*)?([\d,.]+)\s*(bn|b|m|k)?/i);
  if (!match) return 0;

  let value = Number.parseFloat(match[1].replace(/,/g, ""));
  if (Number.isNaN(value)) return 0;

  const unit = match[2]?.toLowerCase();
  if (unit === "k") value *= 1_000;
  else if (unit === "m") value *= 1_000_000;
  else if (unit === "bn" || unit === "b") value *= 1_000_000_000;

  return value;
}

export function sortCompetitorsByRevenue<T extends { lastRevenue: string; companyName: string }>(
  competitors: T[],
) {
  return [...competitors].sort((a, b) => {
    const revenueDiff = parseRevenueSortValue(b.lastRevenue) - parseRevenueSortValue(a.lastRevenue);
    if (revenueDiff !== 0) return revenueDiff;
    return a.companyName.localeCompare(b.companyName);
  });
}
