import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { normalizeCustomerHostname } from "@/lib/platform-workspaces/workspace-hostname";

export type WorkspaceHostAliasRecord = {
  aliasSubdomain: string;
  workspaceId: string;
  workspaceSlug: string;
};

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  return createTenancyServerClient();
}

export async function findWorkspaceSlugByHostAlias(
  aliasSubdomain: string,
): Promise<string | null> {
  const normalized = normalizeCustomerHostname(aliasSubdomain);
  if (!normalized) return null;
  if (!isSupabaseConfigured()) return null;

  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("workspace_host_aliases")
    .select("workspace_slug")
    .eq("alias_subdomain", normalized)
    .maybeSingle();

  if (error || !data?.workspace_slug) return null;
  return String(data.workspace_slug);
}

export async function registerWorkspaceHostAlias(input: {
  aliasSubdomain: string;
  workspaceId: string;
  workspaceSlug: string;
}): Promise<WorkspaceHostAliasRecord> {
  const aliasSubdomain = normalizeCustomerHostname(input.aliasSubdomain);
  const workspaceSlug = input.workspaceSlug.trim().toLowerCase();
  if (!aliasSubdomain) {
    throw new Error("Host alias subdomain is required.");
  }
  if (!workspaceSlug) {
    throw new Error("Workspace slug is required for host alias registration.");
  }

  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("workspace_host_aliases")
    .upsert(
      {
        alias_subdomain: aliasSubdomain,
        workspace_id: input.workspaceId,
        workspace_slug: workspaceSlug,
      },
      { onConflict: "alias_subdomain" },
    )
    .select("alias_subdomain, workspace_id, workspace_slug")
    .single();

  if (error) {
    throw new Error(error.message || "Failed to register workspace host alias.");
  }

  return {
    aliasSubdomain: String(data.alias_subdomain),
    workspaceId: String(data.workspace_id),
    workspaceSlug: String(data.workspace_slug),
  };
}

export async function isCustomerHostnameAvailable(
  hostname: string,
  workspaceIdToIgnore?: string,
): Promise<boolean> {
  const normalized = normalizeCustomerHostname(hostname);
  if (!normalized) return false;

  const supabase = requireSupabase();

  const { data: aliasRow } = await supabase
    .from("workspace_host_aliases")
    .select("workspace_id")
    .eq("alias_subdomain", normalized)
    .maybeSingle();

  if (aliasRow?.workspace_id) {
    if (workspaceIdToIgnore && String(aliasRow.workspace_id) === workspaceIdToIgnore) {
      return true;
    }
    return false;
  }

  const { data: workspaceRow } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", normalized)
    .maybeSingle();

  if (workspaceRow?.id) {
    if (workspaceIdToIgnore && String(workspaceRow.id) === workspaceIdToIgnore) {
      return true;
    }
    return false;
  }

  return true;
}
