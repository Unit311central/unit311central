import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/server";

export type BoardDirector = {
  id: string;
  workspaceId: string;
  fullName: string;
  roleTitle: string;
  organisation: string;
  email: string | null;
  phone: string | null;
  sortOrder: number;
  isActive: boolean;
  notes: string;
};

function db() {
  if (!isSupabaseServiceRoleConfigured()) {
    throw new Error("Board directors require SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createSupabaseServiceRoleClient();
}

function mapRow(row: Record<string, unknown>): BoardDirector {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    fullName: String(row.full_name ?? ""),
    roleTitle: String(row.role_title ?? ""),
    organisation: String(row.organisation ?? ""),
    email: row.email ? String(row.email) : null,
    phone: row.phone ? String(row.phone) : null,
    sortOrder: Number(row.sort_order ?? 100),
    isActive: row.is_active !== false,
    notes: String(row.notes ?? ""),
  };
}

export async function listBoardDirectorsForWorkspace(
  workspaceId: string,
): Promise<BoardDirector[]> {
  const supabase = db();
  const { data, error } = await supabase
    .from("board_directors")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("full_name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}
