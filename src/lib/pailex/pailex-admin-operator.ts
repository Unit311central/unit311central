import "server-only";

import { defaultHomeTilesForRoles } from "@/lib/access-presets";
import { normalizePlatformUsername } from "@/lib/platform-auth";
import {
  PAILEX_DISPLAY_NAME,
  PAILEX_SLUG,
} from "@/lib/pailex/pailex-surface";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import {
  USER_DEPARTMENT_OPTIONS,
  USER_ROLE_OPTIONS,
} from "@/lib/user-management-data";

export const PAILEX_ADMIN_OPERATOR_LABEL = "PAILEX Administrator";

/**
 * Ensure the PAILEX workspace owner/admin has a full-access internal_operators row.
 * Required for Users, Settings integrations, and other Admin-gated module APIs.
 */
export async function ensurePailexAdministratorInternalOperator(input: {
  userId: string;
  email: string;
  displayName: string;
}): Promise<void> {
  const userId = input.userId.trim();
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim() || PAILEX_DISPLAY_NAME;
  if (!userId || !email) {
    throw new Error("PAILEX administrator user id and email are required.");
  }

  const username = normalizePlatformUsername(email);
  const roles = [...USER_ROLE_OPTIONS];
  const departments = [...USER_DEPARTMENT_OPTIONS];
  const now = new Date().toISOString();
  const dashboardPrefs = {
    homeTiles: defaultHomeTilesForRoles(["Admin"], departments),
  };

  const supabase = createTenancyServerClient();
  const { error } = await supabase.from("internal_operators").upsert(
    {
      id: userId,
      operator_label: PAILEX_ADMIN_OPERATOR_LABEL,
      full_name: displayName,
      username,
      email,
      phone: null,
      role: "Admin",
      roles,
      department: "Operations",
      departments,
      status: "Active",
      region: "",
      license_id: null,
      notes: `${PAILEX_DISPLAY_NAME} workspace full-access administrator (${PAILEX_SLUG})`,
      allowed_views: null,
      dashboard_prefs: dashboardPrefs,
      created_at: now,
      updated_at: now,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(error.message || "Failed to provision PAILEX administrator operator row.");
  }
}
