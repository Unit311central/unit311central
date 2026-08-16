/**
 * Server-only workspace brand resolution (uses request cookies / headers).
 * Do not import this from client components.
 */

import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import {
  getCurrentWorkspace,
  type CurrentWorkspace,
} from "@/lib/workspace-context";
import {
  buildWorkspaceBrand,
  platformWorkspaceBrand,
  type WorkspaceBrand,
} from "@/lib/workspace-brand";

async function loadWorkspaceSettings(workspaceId: string | null | undefined): Promise<{
  logoUrl: string | null;
}> {
  if (!workspaceId || !isSupabaseConfigured()) return { logoUrl: null };
  try {
    const supabase = createTenancyServerClient();
    const { data } = await supabase
      .from("workspace_settings")
      .select("logo_url")
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    return { logoUrl: data?.logo_url ? String(data.logo_url) : null };
  } catch {
    return { logoUrl: null };
  }
}

/** Resolve brand for an explicit workspace record (or slug/name). */
export async function resolveWorkspaceBrandFor(input?: {
  workspace?: CurrentWorkspace | null;
  slug?: string | null;
  name?: string | null;
}): Promise<WorkspaceBrand> {
  const workspace = input?.workspace ?? null;
  const slug = workspace?.slug ?? input?.slug ?? null;
  const name = workspace?.name ?? input?.name ?? null;
  const settings = await loadWorkspaceSettings(workspace?.id ?? null);
  return buildWorkspaceBrand({
    slug,
    name,
    logoUrl: settings.logoUrl,
  });
}

/** Request-scoped brand for the active workspace. */
export const resolveWorkspaceBrand = cache(async (): Promise<WorkspaceBrand> => {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return platformWorkspaceBrand();
  return resolveWorkspaceBrandFor({ workspace });
});
