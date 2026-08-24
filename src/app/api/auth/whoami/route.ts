import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { getRequestHost, parseClientPlatformSubdomainSafe } from "@/lib/app-domains";
import { DEMO_ADMIN_USERNAME, applyUnit311GlobalAdminEntitlements, isUnit311GlobalAdminUsername } from "@/lib/demo/read-only";
import { getNorthstarWhoamiPayload } from "@/lib/demo/northstar-api-fixtures";
import {
  getAbhiInternalStaffWhoamiEntitlements,
  getAbhiPlatformWhoamiEntitlements,
  isAbhiInternalStaffSession,
  isAbhiPlatformDemoSession,
} from "@/lib/abhi/platform-demo";
import { findAbhiTenantUserByUsername } from "@/lib/abhi/users-data";
import { isAbhiSlug } from "@/lib/abhi-surface";
import { getInternalOperatorByUsername } from "@/lib/internal-operators-service";
import { resolveOperatorEntitlementsFromOperatorRow } from "@/lib/operator-entitlements-resolve";
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
  const workspaceType: string | null = workspace?.workspaceType ?? null;
  let email: string | null = null;
  let role: string | null = null;
  let roles: string[] | null = null;
  let department: string | null = null;
  let departments: string[] | null = null;
  let allowedViews: string[] | null = null;
  let dashboardPrefs: { homeTiles: string[] } | null = null;
  let workspaceLogoUrl: string | null = null;
  let enabledModules: string[] | null = null;
  let enabledSubModules: string[] | null = null;

  if (isSupabaseConfigured()) {
    try {
      const operator = await getInternalOperatorByUsername(session.username);
      if (operator) {
        const resolved = resolveOperatorEntitlementsFromOperatorRow({
          role: operator.role,
          roles: operator.roles,
          department: operator.department,
          departments: operator.departments,
          allowed_views: operator.allowedViews,
          dashboard_prefs: operator.dashboardPrefs,
        });
        email = operator.email?.trim() || null;
        role = resolved.role;
        roles = resolved.roles;
        department = resolved.department;
        departments = resolved.departments;
        allowedViews = resolved.allowedViews;
        dashboardPrefs = resolved.homeTiles ? { homeTiles: resolved.homeTiles } : null;
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

  const host = getRequestHost({ headers: await headers() });
  const hostSlug = parseClientPlatformSubdomainSafe(host);
  const abhiHost =
    (workspace && isAbhiSlug(workspace.slug)) || isAbhiSlug(hostSlug);

  if (abhiHost && isAbhiPlatformDemoSession(session)) {
    const abhi = getAbhiPlatformWhoamiEntitlements();
    role = abhi.role;
    roles = [...abhi.roles];
    department = abhi.department;
    departments = [...abhi.departments];
    allowedViews = abhi.allowedViews;
    dashboardPrefs = abhi.dashboardPrefs;
  } else if (abhiHost && isAbhiInternalStaffSession(session)) {
    const staff = findAbhiTenantUserByUsername(session.username);
    const staffEntitlements = getAbhiInternalStaffWhoamiEntitlements();
    allowedViews = staffEntitlements.allowedViews;
    dashboardPrefs = staffEntitlements.dashboardPrefs;
    if (staff) {
      role = staff.role;
      roles = [...staff.roles];
      department = staff.department;
      departments = [...staff.departments];
    } else if (!roles?.length) {
      role = role ?? "Manager";
      roles = ["Manager"];
      department = department ?? "Operations";
      departments = departments?.length ? departments : ["Operations"];
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

      const { data: metadata } = await supabase
        .from("workspace_admin_metadata")
        .select("enabled_modules, enabled_sub_modules")
        .eq("workspace_id", workspace.id)
        .maybeSingle();
      enabledModules = metadata?.enabled_modules?.length ? [...metadata.enabled_modules] : null;
      enabledSubModules = metadata?.enabled_sub_modules?.length
        ? [...metadata.enabled_sub_modules]
        : null;
    } catch {
      /* optional branding / nav enablement */
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
      workspaceType,
      workspaceLogoUrl,
      enabledModules,
      enabledSubModules,
    },
    {
      headers: WHOAMI_CACHE_HEADERS,
    },
  );
}
