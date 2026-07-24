import {
  ensureIntegrationsRegistryTables,
  withIntegrationsRegistryTables,
} from "@/lib/internal-db-migrations";
import {
  isIntegrationCatalogCategory,
  isIntegrationCatalogStatus,
  type IntegrationRegistryEntry,
} from "@/lib/integrations-registry";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

type DbIntegrationRow = {
  id: string;
  vendor: string;
  category: string;
  display_name: string;
  description: string;
  logo: string;
  status: string;
  wizard_available: boolean;
  enabled: boolean;
  sort_order: number | string;
  future_auth_type: string | null;
  future_api_provider: string | null;
};

function mapRow(row: DbIntegrationRow): IntegrationRegistryEntry | null {
  if (!isIntegrationCatalogCategory(row.category)) return null;
  if (!isIntegrationCatalogStatus(row.status)) return null;
  return {
    id: row.id,
    vendor: row.vendor,
    category: row.category,
    name: row.display_name,
    description: row.description,
    logo: row.logo,
    status: row.status,
    wizardAvailable: Boolean(row.wizard_available),
    enabled: Boolean(row.enabled),
    sortOrder: Number(row.sort_order) || 0,
    futureAuthType: row.future_auth_type,
    futureApiProvider: row.future_api_provider,
  };
}

export async function listIntegrationRegistry(): Promise<IntegrationRegistryEntry[]> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  await ensureIntegrationsRegistryTables();

  return withIntegrationsRegistryTables(async () => {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("integrations")
      .select(
        "id, vendor, category, display_name, description, logo, status, wizard_available, enabled, sort_order, future_auth_type, future_api_provider",
      )
      .eq("enabled", true)
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true });

    if (error) throw new Error(error.message);

    return ((data ?? []) as DbIntegrationRow[])
      .map(mapRow)
      .filter((entry): entry is IntegrationRegistryEntry => entry != null);
  });
}
