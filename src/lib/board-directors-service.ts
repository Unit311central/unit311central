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

export type BoardDirectorInput = {
  fullName: string;
  roleTitle?: string;
  organisation?: string;
  email?: string | null;
  phone?: string | null;
  notes?: string;
  sortOrder?: number;
};

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim();
  return trimmed || null;
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

/**
 * Seed OnwardAir Luminary Advisors into board_directors when the workspace has none.
 * Idempotent — only inserts when active row count is zero.
 */
export async function ensureOnwardAirBoardDirectorsSeeded(
  workspaceId: string,
): Promise<BoardDirector[]> {
  const existing = await listBoardDirectorsForWorkspace(workspaceId);
  if (existing.length > 0) return existing;

  const { ONWARDAIR_LUMINARY_ADVISORS } =
    await import("@/lib/onwardair/board-members-seed");
  const seeded: BoardDirector[] = [];
  for (const member of ONWARDAIR_LUMINARY_ADVISORS) {
    seeded.push(
      await createBoardDirector(workspaceId, {
        fullName: member.fullName,
        roleTitle: member.roleTitle,
        organisation: member.organisation,
        notes: member.notes,
        sortOrder: member.sortOrder,
      }),
    );
  }
  return seeded;
}

export async function createBoardDirector(
  workspaceId: string,
  input: BoardDirectorInput,
): Promise<BoardDirector> {
  const fullName = input.fullName.trim();
  if (!fullName) throw new Error("Full name is required.");

  const supabase = db();
  const { data: maxRow } = await supabase
    .from("board_directors")
    .select("sort_order")
    .eq("workspace_id", workspaceId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSort =
    typeof input.sortOrder === "number"
      ? input.sortOrder
      : Number(maxRow?.sort_order ?? 0) + 10;

  const { data, error } = await supabase
    .from("board_directors")
    .insert({
      workspace_id: workspaceId,
      full_name: fullName,
      role_title: String(input.roleTitle ?? "").trim(),
      organisation: String(input.organisation ?? "").trim(),
      email: normalizeOptionalText(input.email),
      phone: normalizeOptionalText(input.phone),
      notes: String(input.notes ?? "").trim(),
      sort_order: nextSort,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as Record<string, unknown>);
}

export async function updateBoardDirector(
  workspaceId: string,
  id: string,
  input: Partial<BoardDirectorInput>,
): Promise<BoardDirector> {
  const supabase = db();
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.fullName !== undefined) {
    const fullName = input.fullName.trim();
    if (!fullName) throw new Error("Full name is required.");
    patch.full_name = fullName;
  }
  if (input.roleTitle !== undefined) patch.role_title = String(input.roleTitle).trim();
  if (input.organisation !== undefined) {
    patch.organisation = String(input.organisation).trim();
  }
  if (input.email !== undefined) patch.email = normalizeOptionalText(input.email);
  if (input.phone !== undefined) patch.phone = normalizeOptionalText(input.phone);
  if (input.notes !== undefined) patch.notes = String(input.notes).trim();
  if (typeof input.sortOrder === "number") patch.sort_order = input.sortOrder;

  const { data, error } = await supabase
    .from("board_directors")
    .update(patch)
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Director not found.");
  return mapRow(data as Record<string, unknown>);
}

export async function deleteBoardDirector(workspaceId: string, id: string): Promise<void> {
  const supabase = db();
  const { data, error } = await supabase
    .from("board_directors")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Director not found.");
}
