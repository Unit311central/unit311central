import {
  createBlankCompetitorInput,
  mapCompetitor,
  type Competitor,
  type CompetitorRegion,
} from "@/lib/competitors-data";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

type DbCompetitor = Parameters<typeof mapCompetitor>[0];

function requireCompetitorsSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.");
  }
  return createSupabaseServerClient();
}

export async function listCompetitors(region?: CompetitorRegion | "all"): Promise<Competitor[]> {
  const supabase = requireCompetitorsSupabase();
  let query = supabase
    .from("competitors")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });

  if (region && region !== "all") {
    query = query.eq("region", region);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as DbCompetitor[]).map(mapCompetitor);
}

export async function createCompetitor(
  input: Partial<ReturnType<typeof createBlankCompetitorInput>> & {
    region: CompetitorRegion;
  },
): Promise<Competitor> {
  const supabase = requireCompetitorsSupabase();
  const blank = createBlankCompetitorInput(input.region);

  const { data, error } = await supabase
    .from("competitors")
    .insert({
      region: input.region,
      company_name: (input.companyName ?? blank.companyName).trim() || "New Company",
      website: input.website?.trim() || null,
      services: input.services?.trim() || null,
      service_categories: input.serviceCategories?.trim() || null,
      drone_technology: input.droneTechnology?.trim() || null,
      last_revenue: input.lastRevenue?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapCompetitor(data as DbCompetitor);
}

export async function updateCompetitor(
  id: string,
  patch: Partial<{
    companyName: string;
    website: string;
    services: string;
    serviceCategories: string;
    droneTechnology: string;
    lastRevenue: string;
    notes: string;
  }>,
): Promise<Competitor> {
  const supabase = requireCompetitorsSupabase();
  const payload: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  };

  if (patch.companyName !== undefined) payload.company_name = patch.companyName.trim() || "New Company";
  if (patch.website !== undefined) payload.website = patch.website.trim() || null;
  if (patch.services !== undefined) payload.services = patch.services.trim() || null;
  if (patch.serviceCategories !== undefined) {
    payload.service_categories = patch.serviceCategories.trim() || null;
  }
  if (patch.droneTechnology !== undefined) {
    payload.drone_technology = patch.droneTechnology.trim() || null;
  }
  if (patch.lastRevenue !== undefined) payload.last_revenue = patch.lastRevenue.trim() || null;
  if (patch.notes !== undefined) payload.notes = patch.notes.trim() || null;

  const { data, error } = await supabase
    .from("competitors")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapCompetitor(data as DbCompetitor);
}

export async function deleteCompetitor(id: string) {
  const supabase = requireCompetitorsSupabase();
  const { error } = await supabase.from("competitors").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
