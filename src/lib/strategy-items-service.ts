import { mapStrategyItem, type StrategyItem } from "@/lib/strategy-data";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

type DbStrategyItem = Parameters<typeof mapStrategyItem>[0];

function requireStrategySupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.");
  }

  return createSupabaseServerClient();
}

export async function listStrategyItems(): Promise<StrategyItem[]> {
  const supabase = requireStrategySupabase();
  const { data, error } = await supabase
    .from("strategy_items")
    .select("*")
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as DbStrategyItem[]).map(mapStrategyItem);
}

export async function updateStrategyItem(
  id: string,
  patch: { notes?: string; priority?: number | null },
): Promise<StrategyItem> {
  const supabase = requireStrategySupabase();
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (patch.notes !== undefined) {
    updates.notes = patch.notes.trim();
  }

  if (patch.priority !== undefined) {
    updates.priority = patch.priority;
  }

  const { data, error } = await supabase
    .from("strategy_items")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapStrategyItem(data as DbStrategyItem);
}
