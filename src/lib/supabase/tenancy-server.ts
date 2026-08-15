import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
  isSupabaseConfigured,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/server";

/**
 * Server-only Supabase client for workspace-scoped tables after Phase 1 RLS hardening.
 *
 * Prefers service_role (bypasses deny-all RLS). Callers MUST filter every query/mutation
 * by workspace_id (or validate membership via workspace_users first).
 *
 * Falls back to anon only when service role is not configured (pre-Phase-1 local dev).
 */
export function createTenancyServerClient() {
  if (isSupabaseServiceRoleConfigured()) {
    return createSupabaseServiceRoleClient();
  }

  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  return createSupabaseServerClient();
}

export function isTenancyHardeningActive() {
  return isSupabaseServiceRoleConfigured();
}
