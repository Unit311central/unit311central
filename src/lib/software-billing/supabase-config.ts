export function getSupabaseAccessToken(): string | null {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  return token || null;
}

export function getSupabaseOrgSlug(): string | null {
  const slug = process.env.SUPABASE_ORG_SLUG?.trim();
  return slug || null;
}

export function isSupabaseBillingConfigured(): boolean {
  return Boolean(getSupabaseAccessToken() && getSupabaseOrgSlug());
}

export const SUPABASE_MGMT_API_BASE = "https://api.supabase.com/v1";
