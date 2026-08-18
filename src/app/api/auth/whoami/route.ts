import { NextResponse } from "next/server";

import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { DEMO_ADMIN_USERNAME, applyUnit311GlobalAdminEntitlements, isUnit311GlobalAdminUsername } from "@/lib/demo/read-only";
import { getNorthstarWhoamiPayload } from "@/lib/demo/northstar-api-fixtures";
import { getInternalOperatorByUsername } from "@/lib/internal-operators-service";
import { getPlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

const WHOAMI_CACHE_HEADERS = {
  "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
};

export async function GET() {
  const demoRequest = await isDemoApiRequest();
  const session = await getPlatformSession();

  if (!session) {
    if (demoRequest) {
      return NextResponse.json(getNorthstarWhoamiPayload(null), {
        headers: WHOAMI_CACHE_HEADERS,
      });
    }
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (demoRequest) {
    const workspace = await getCurrentWorkspace().catch(() => null);
    const payload = getNorthstarWhoamiPayload(session);

    if (workspace?.id) {
      payload.workspaceId = workspace.id;
      payload.workspaceSlug = workspace.slug;
      payload.workspaceName = workspace.name;
    }

    if (session.userType === "internal" && isSupabaseConfigured()) {
      try {
        const operator = await getInternalOperatorByUsername(session.username);
        if (operator) {
          payload.email = operator.email?.trim() || payload.email;
          payload.role = operator.role ?? payload.role;
          payload.roles = operator.roles ?? (operator.role ? [operator.role] : payload.roles);
          payload.department = operator.department ?? payload.department;
          payload.departments =
            operator.departments ?? (operator.department ? [operator.department] : payload.departments);
          payload.allowedViews = operator.allowedViews;
          payload.dashboardPrefs = operator.dashboardPrefs;
        }
      } catch {
        // Northstar fixture profile is enough for demo.
      }
    }

    if (session.username?.trim().toLowerCase() === DEMO_ADMIN_USERNAME) {
      Object.assign(payload, applyUnit311GlobalAdminEntitlements(payload));
    }

    return NextResponse.json(payload, { headers: WHOAMI_CACHE_HEADERS });
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

  if (isUnit311GlobalAdminUsername(session.username)) {
    role = "Admin";
    roles = ["Admin"];
    department = department ?? "Corporate";
    departments = departments?.length ? departments : ["Corporate"];
    allowedViews = null;
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
      headers: WHOAMI_CACHE_HEADERS,
    },
  );
}
