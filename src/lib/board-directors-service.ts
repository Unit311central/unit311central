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
  /** Annual compensation in USD. Null / hidden for Scott Parazynski. */
  compensationUsdPerYear: number | null;
  sortOrder: number;
  isActive: boolean;
  notes: string;
};

/** Founder/CEO — compensation is not captured on Board Members. */
export function isScottParazynskiBoardMember(fullName: string | null | undefined): boolean {
  return String(fullName ?? "")
    .trim()
    .toLowerCase()
    .includes("scott parazynski");
}

function db() {
  if (!isSupabaseServiceRoleConfigured()) {
    throw new Error("Board directors require SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createSupabaseServiceRoleClient();
}

function mapRow(row: Record<string, unknown>): BoardDirector {
  const rawComp = row.compensation_usd_per_year;
  const compensationUsdPerYear =
    rawComp === null || rawComp === undefined || rawComp === ""
      ? null
      : Number(rawComp);
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    fullName: String(row.full_name ?? ""),
    roleTitle: String(row.role_title ?? ""),
    organisation: String(row.organisation ?? ""),
    email: row.email ? String(row.email) : null,
    phone: row.phone ? String(row.phone) : null,
    compensationUsdPerYear:
      compensationUsdPerYear !== null && Number.isFinite(compensationUsdPerYear)
        ? compensationUsdPerYear
        : null,
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
  compensationUsdPerYear?: number | null;
};

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim();
  return trimmed || null;
}

function normalizeCompensationUsd(
  value: number | null | undefined,
  fullName: string,
): number | null {
  if (isScottParazynskiBoardMember(fullName)) return null;
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error("Compensation must be a non-negative USD amount per year.");
  }
  return Math.round(n * 100) / 100;
}

let compensationColumnEnsured = false;

/** Idempotent: add compensation_usd_per_year when missing (pre-migration deploys). */
export async function ensureBoardDirectorsCompensationColumn(): Promise<void> {
  if (compensationColumnEnsured) return;
  const supabase = db();
  const { error } = await supabase.from("board_directors").select("compensation_usd_per_year").limit(1);
  if (!error) {
    compensationColumnEnsured = true;
    return;
  }
  if (!/compensation_usd_per_year|column/i.test(error.message)) {
    throw new Error(error.message);
  }
  // Column missing — callers should apply migration 135. Soft-fail map treats as null.
  console.warn(
    "[board_directors] compensation_usd_per_year missing — apply supabase/migrations/135_board_directors_compensation.sql",
  );
}

export async function listBoardDirectorsForWorkspace(
  workspaceId: string,
): Promise<BoardDirector[]> {
  const supabase = db();
  await ensureBoardDirectorsCompensationColumn().catch(() => undefined);
  const { data, error } = await supabase
    .from("board_directors")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("full_name", { ascending: true });
  if (error) {
    // Older schema without compensation column — retry without selecting it via *.
    if (/compensation_usd_per_year/i.test(error.message)) {
      const fallback = await supabase
        .from("board_directors")
        .select(
          "id, workspace_id, full_name, role_title, organisation, email, phone, sort_order, is_active, notes",
        )
        .eq("workspace_id", workspaceId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("full_name", { ascending: true });
      if (fallback.error) throw new Error(fallback.error.message);
      return (fallback.data ?? []).map((row) => mapRow(row as Record<string, unknown>));
    }
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

/**
 * Seed OnwardAir board members (Founder/CEO + Luminary Advisors).
 * - Empty board: insert full seed list.
 * - Non-empty: ensure Scott Parazynski exists (by fullName, case-insensitive); keep advisors.
 */
export async function ensureOnwardAirBoardDirectorsSeeded(
  workspaceId: string,
): Promise<BoardDirector[]> {
  const existing = await listBoardDirectorsForWorkspace(workspaceId);
  const { ONWARDAIR_BOARD_FOUNDER, ONWARDAIR_LUMINARY_ADVISORS } =
    await import("@/lib/onwardair/board-members-seed");

  const hasScott = existing.some((d) =>
    d.fullName.toLowerCase().includes("scott parazynski"),
  );

  if (existing.length === 0) {
    for (const member of ONWARDAIR_LUMINARY_ADVISORS) {
      await createBoardDirector(workspaceId, {
        fullName: member.fullName,
        roleTitle: member.roleTitle,
        organisation: member.organisation,
        notes: member.notes,
        sortOrder: member.sortOrder,
      });
    }
    return listBoardDirectorsForWorkspace(workspaceId);
  }

  if (!hasScott) {
    await createBoardDirector(workspaceId, {
      fullName: ONWARDAIR_BOARD_FOUNDER.fullName,
      roleTitle: ONWARDAIR_BOARD_FOUNDER.roleTitle,
      organisation: ONWARDAIR_BOARD_FOUNDER.organisation,
      notes: ONWARDAIR_BOARD_FOUNDER.notes,
      sortOrder: ONWARDAIR_BOARD_FOUNDER.sortOrder,
    });
    return listBoardDirectorsForWorkspace(workspaceId);
  }

  return existing;
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
      compensation_usd_per_year: normalizeCompensationUsd(
        input.compensationUsdPerYear,
        fullName,
      ),
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

  if (input.compensationUsdPerYear !== undefined || input.fullName !== undefined) {
    const nameForRule =
      typeof patch.full_name === "string"
        ? patch.full_name
        : (
            await supabase
              .from("board_directors")
              .select("full_name")
              .eq("workspace_id", workspaceId)
              .eq("id", id)
              .maybeSingle()
          ).data?.full_name;
    if (input.compensationUsdPerYear !== undefined) {
      patch.compensation_usd_per_year = normalizeCompensationUsd(
        input.compensationUsdPerYear,
        String(nameForRule ?? ""),
      );
    } else if (isScottParazynskiBoardMember(String(nameForRule ?? ""))) {
      patch.compensation_usd_per_year = null;
    }
  }

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
