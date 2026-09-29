import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/server";
import {
  refreshCronofyAccessToken,
  type CronofyTokenResponse,
} from "@/lib/cronofy/client";

export type StoredCronofyAccount = {
  platformUserId: string;
  workspaceId: string;
  cronofySub: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: string | null;
  linkedProfileName: string;
  linkedProviderName: string;
};

function db() {
  if (!isSupabaseServiceRoleConfigured()) {
    throw new Error("Cronofy account storage requires SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createSupabaseServiceRoleClient();
}

function mapRow(row: Record<string, unknown>): StoredCronofyAccount {
  return {
    platformUserId: String(row.platform_user_id),
    workspaceId: String(row.workspace_id),
    cronofySub: String(row.cronofy_sub ?? ""),
    accessToken: String(row.access_token ?? ""),
    refreshToken: String(row.refresh_token ?? ""),
    tokenExpiresAt: row.token_expires_at ? String(row.token_expires_at) : null,
    linkedProfileName: String(row.linked_profile_name ?? ""),
    linkedProviderName: String(row.linked_provider_name ?? ""),
  };
}

export async function getCronofyAccount(args: {
  platformUserId: string;
  workspaceId: string;
}): Promise<StoredCronofyAccount | null> {
  const supabase = db();
  const { data, error } = await supabase
    .from("platform_user_cronofy_accounts")
    .select("*")
    .eq("platform_user_id", args.platformUserId)
    .eq("workspace_id", args.workspaceId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapRow(data as Record<string, unknown>);
}

export async function upsertCronofyAccount(args: {
  platformUserId: string;
  workspaceId: string;
  token: CronofyTokenResponse;
}): Promise<StoredCronofyAccount> {
  const supabase = db();
  const expiresAt = args.token.expires_in
    ? new Date(Date.now() + args.token.expires_in * 1000).toISOString()
    : null;
  const row = {
    platform_user_id: args.platformUserId,
    workspace_id: args.workspaceId,
    cronofy_sub: args.token.sub,
    access_token: args.token.access_token,
    refresh_token: args.token.refresh_token,
    token_expires_at: expiresAt,
    linked_profile_name: args.token.linking_profile?.profile_name ?? "",
    linked_provider_name: args.token.linking_profile?.provider_name ?? "",
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("platform_user_cronofy_accounts")
    .upsert(row, { onConflict: "platform_user_id,workspace_id" })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as Record<string, unknown>);
}

export async function getValidCronofyAccessToken(args: {
  platformUserId: string;
  workspaceId: string;
}): Promise<{ accessToken: string; account: StoredCronofyAccount }> {
  const account = await getCronofyAccount(args);
  if (!account?.refreshToken) {
    throw new Error("No Cronofy calendar connection for this user. Connect a calendar first.");
  }

  const expiresMs = account.tokenExpiresAt ? Date.parse(account.tokenExpiresAt) : 0;
  const needsRefresh = !account.accessToken || expiresMs - Date.now() < 60_000;

  if (!needsRefresh) {
    return { accessToken: account.accessToken, account };
  }

  const refreshed = await refreshCronofyAccessToken(account.refreshToken);
  const saved = await upsertCronofyAccount({
    platformUserId: args.platformUserId,
    workspaceId: args.workspaceId,
    token: refreshed,
  });
  return { accessToken: saved.accessToken, account: saved };
}
