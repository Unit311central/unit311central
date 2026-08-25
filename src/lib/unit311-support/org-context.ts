import { getOrganisationForUser } from "@/lib/organisation-service";
import type { PlatformSession } from "@/lib/platform-session";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";
import {
  requireCurrentWorkspace,
  WorkspaceAccessError,
  type CurrentWorkspace,
} from "@/lib/workspace-context";

export type Unit311SupportOrganisationContext = {
  organisationId: string;
  organisationName: string;
};

export async function resolveOrganisationForSupport(
  session: PlatformSession,
): Promise<Unit311SupportOrganisationContext> {
  const organisation = await getOrganisationForUser(session.sub, session.username);
  if (organisation?.id) {
    return {
      organisationId: organisation.id,
      organisationName: organisation.name?.trim() || "Customer organisation",
    };
  }

  const workspace = await requireCurrentWorkspace();
  if (!isSupabaseConfigured()) {
    throw new WorkspaceAccessError("Organisation context is required.", 403);
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("platform_organisations")
    .select("id, name")
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data?.id) {
    return {
      organisationId: data.id,
      organisationName: String(data.name ?? "").trim() || workspace.name,
    };
  }

  throw new WorkspaceAccessError(
    "No customer organisation is linked to this workspace. Contact Unit311 support.",
    403,
  );
}

export async function assertWorkspaceBelongsToOrganisation(
  workspaceId: string,
  organisationId: string,
): Promise<CurrentWorkspace> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const supabase = createSupabaseServerClient();
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, name, slug, workspace_type, status")
    .eq("id", workspaceId)
    .maybeSingle();

  if (workspaceError) throw new Error(workspaceError.message);
  if (!workspace?.id) throw new WorkspaceAccessError("Workspace not found.", 403);

  const { data: orgRow, error: orgError } = await supabase
    .from("platform_organisations")
    .select("id, workspace_id")
    .eq("id", organisationId)
    .maybeSingle();

  if (orgError) throw new Error(orgError.message);
  if (!orgRow?.id) throw new WorkspaceAccessError("Organisation not found.", 403);

  if (orgRow.workspace_id === workspaceId) {
    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      workspaceType: workspace.workspace_type,
    };
  }

  const { data: linked, error: linkedError } = await supabase
    .from("platform_organisations")
    .select("id")
    .eq("id", organisationId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (linkedError) throw new Error(linkedError.message);
  if (!linked?.id) {
    throw new WorkspaceAccessError("Workspace does not belong to your organisation.", 403);
  }

  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    workspaceType: workspace.workspace_type,
  };
}

export async function listOrganisationWorkspacesForSupport(
  organisationId: string,
): Promise<Array<{ id: string; name: string; slug: string }>> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createSupabaseServerClient();
  const { data: org, error: orgError } = await supabase
    .from("platform_organisations")
    .select("workspace_id")
    .eq("id", organisationId)
    .maybeSingle();

  if (orgError) throw new Error(orgError.message);
  const workspaceIds = new Set<string>();
  if (org?.workspace_id) workspaceIds.add(org.workspace_id);

  if (workspaceIds.size === 0) return [];

  const { data: workspaces, error } = await supabase
    .from("workspaces")
    .select("id, name, slug")
    .in("id", [...workspaceIds])
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (workspaces ?? []).map((row) => ({
    id: row.id,
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
  }));
}

export function isInternalCentralWorkspace(slug: string | null | undefined): boolean {
  return String(slug ?? "").trim().toLowerCase() === INTERNAL_WORKSPACE_SLUG;
}
