/**
 * Integration Registry — metadata contract for Integration Wizards.
 * UI renders exclusively from this registry / Supabase `integrations` table.
 */

export const INTEGRATION_CATALOG_CATEGORIES = [
  "project-management",
  "crm",
  "financials",
  "human-resources",
  "corporate-information",
  "business-productivity",
  "operations",
  "training",
] as const;

export type IntegrationCatalogCategory = (typeof INTEGRATION_CATALOG_CATEGORIES)[number];

export const INTEGRATION_CATALOG_STATUSES = [
  "work_in_progress",
  "available",
  "coming_soon",
] as const;

export type IntegrationCatalogStatus = (typeof INTEGRATION_CATALOG_STATUSES)[number];

export type IntegrationRegistryEntry = {
  id: string;
  vendor: string;
  category: IntegrationCatalogCategory;
  name: string;
  description: string;
  logo: string;
  status: IntegrationCatalogStatus;
  wizardAvailable: boolean;
  enabled: boolean;
  sortOrder: number;
  futureAuthType: string | null;
  futureApiProvider: string | null;
};

export const INTEGRATION_CATEGORY_LABELS: Record<IntegrationCatalogCategory, string> = {
  "project-management": "Project Management",
  crm: "CRM",
  financials: "Financials",
  "human-resources": "Human Resources",
  "corporate-information": "Corporate Information",
  "business-productivity": "Business Productivity",
  operations: "Operations",
  training: "Training",
};

export function integrationStatusLabel(status: IntegrationCatalogStatus): string {
  switch (status) {
    case "available":
      return "Available";
    case "coming_soon":
      return "Coming Soon";
    case "work_in_progress":
    default:
      return "Work in Progress";
  }
}

export function isIntegrationCatalogCategory(
  value: string,
): value is IntegrationCatalogCategory {
  return (INTEGRATION_CATALOG_CATEGORIES as readonly string[]).includes(value);
}

export function isIntegrationCatalogStatus(value: string): value is IntegrationCatalogStatus {
  return (INTEGRATION_CATALOG_STATUSES as readonly string[]).includes(value);
}

export type IntegrationCategoryGroup = {
  category: IntegrationCatalogCategory;
  label: string;
  integrations: IntegrationRegistryEntry[];
};

export function groupIntegrationsByCategory(
  entries: IntegrationRegistryEntry[],
): IntegrationCategoryGroup[] {
  const byCategory = new Map<IntegrationCatalogCategory, IntegrationRegistryEntry[]>();

  for (const category of INTEGRATION_CATALOG_CATEGORIES) {
    byCategory.set(category, []);
  }

  for (const entry of entries) {
    if (!entry.enabled) continue;
    const bucket = byCategory.get(entry.category);
    if (bucket) bucket.push(entry);
  }

  return INTEGRATION_CATALOG_CATEGORIES.map((category) => ({
    category,
    label: INTEGRATION_CATEGORY_LABELS[category],
    integrations: (byCategory.get(category) ?? []).sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
    ),
  })).filter((group) => group.integrations.length > 0);
}
