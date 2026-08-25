import { NextResponse } from "next/server";

import { requireInternalWorkspaceSession } from "@/lib/internal-admin-auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { viewsForWorkspaceEnablement } from "@/lib/workspace-enabled-views";
import { resolveWorkspaceNavEnablement } from "@/lib/platform-workspaces/workspace-product-nav";
import type { CurrentWorkspace } from "@/lib/workspace-context";
import type { PlatformSession } from "@/lib/platform-session";

async function loadWorkspaceEnablement(workspace: CurrentWorkspace) {
  let enabledModules: string[] | null = null;
  let enabledSubModules: string[] | null = null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = createTenancyServerClient();
      const { data: metadata } = await supabase
        .from("workspace_admin_metadata")
        .select("enabled_modules, enabled_sub_modules")
        .eq("workspace_id", workspace.id)
        .maybeSingle();
      if (metadata?.enabled_modules?.length) {
        enabledModules = [...metadata.enabled_modules];
      }
      if (metadata?.enabled_sub_modules?.length) {
        enabledSubModules = [...metadata.enabled_sub_modules];
      }
    } catch {
      /* optional nav enablement */
    }
  }

  return resolveWorkspaceNavEnablement({
    workspaceSlug: workspace.slug,
    workspaceType: workspace.workspaceType,
    enabledModules,
    enabledSubModules,
    allowDefaultFallback: true,
  });
}

export async function requireInterfaceWorxWorkspaceSession(): Promise<
  { error: NextResponse } | { session: PlatformSession; workspace: CurrentWorkspace }
> {
  const auth = await requireInternalWorkspaceSession();
  if ("error" in auth) return auth;

  const enablement = await loadWorkspaceEnablement(auth.workspace);
  const enabledViews = viewsForWorkspaceEnablement(
    enablement.enabledModules,
    enablement.enabledSubModules,
  );

  if (!enabledViews.includes("information-repository")) {
    return {
      error: NextResponse.json(
        { error: "Information Repository is not enabled for this workspace." },
        { status: 403 },
      ),
    };
  }

  return auth;
}
