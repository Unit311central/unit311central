import { NextResponse } from "next/server";

import { getInternalOperatorByUsername } from "@/lib/internal-operators-service";
import { getPlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  // Active workspace comes from host → authz → getCurrentWorkspace only.
  // Never fall back to session workspace claim fields for tenancy.
  const workspace = await getCurrentWorkspace();

  let email: string | null = null;
  let role: string | null = null;
  let roles: string[] | null = null;
  let department: string | null = null;
  let departments: string[] | null = null;
  let allowedViews: string[] | null = null;
  let dashboardPrefs: { homeTiles: string[] } | null = null;
  let workspaceLogoUrl: string | null = null;

  if (session.userType === "internal" && isSupabaseConfigured()) {
    try {
      const operator = await getInternalOperatorByUsername(session.username);
      if (operator) {
        email = operator.email?.trim() || null;
        role = operator.role ?? null;
        roles = operator.roles ?? (operator.role ? [operator.role] : null);
        department = operator.department ?? null;
        departments =
          operator.departments ?? (operator.department ? [operator.department] : null);
        allowedViews = operator.allowedViews;
        dashboardPrefs = operator.dashboardPrefs;
      }
    } catch {
      // Profile still returns session identity if operator lookup fails.
    }
  }

  if (workspace?.id && isSupabaseConfigured()) {
    try {
      const { createTenancyServerClient } = await import("@/lib/supabase/tenancy-server");
      const supabase = createTenancyServerClient();
      const { data: settings } = await supabase
        .from("workspace_settings")
        .select("logo_url")
        .eq("workspace_id", workspace.id)
        .maybeSingle();
      workspaceLogoUrl = settings?.logo_url?.trim() || null;
    } catch {
      /* optional branding */
    }
  }

  return NextResponse.json(
    {
      displayName: session.displayName,
      username: session.username,
      email,
      role,
      roles,
      department,
      departments,
      allowedViews,
      dashboardPrefs,
      userType: session.userType,
      userId: session.sub,
      workspaceId: workspace?.id ?? null,
      workspaceSlug: workspace?.slug ?? null,
      workspaceName: workspace?.name ?? null,
      workspaceLogoUrl,
    },
    {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
      },
    },
  );
}
