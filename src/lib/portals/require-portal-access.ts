import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getPortalPackBySlug } from "@/lib/portals/registry";
import type { PortalRouteDefinition, PortalSession } from "@/lib/portals/types";
import { PLATFORM_SESSION_COOKIE, readPlatformSessionToken } from "@/lib/platform-session-token";

function portalLoginPath(path: string) {
  return `/${path}/login`;
}

/**
 * L1 central server-side portal access guard.
 * Workspace policies are supplied by the portal pack accessPolicy config.
 */
export async function requirePortalAccess(
  workspaceSlug: string,
  companyPath: string,
): Promise<{ route: PortalRouteDefinition; session: PortalSession }> {
  const pack = getPortalPackBySlug(workspaceSlug);
  if (!pack) {
    redirect("/login");
  }

  const route = pack.matcher.getRouteByPath(companyPath);
  if (!route) {
    redirect("/login");
  }

  const jar = await cookies();
  const token = jar.get(PLATFORM_SESSION_COOKIE)?.value;
  if (!token) {
    redirect(portalLoginPath(route.path));
  }

  const session = await readPlatformSessionToken(token);
  if (!session) {
    redirect(portalLoginPath(route.path));
  }

  const policy = pack.accessPolicy;

  if (session.userType === "external") {
    const allowed = pack.matcher.getRouteByPath(session.redirectPath);
    if (!allowed) {
      redirect(portalLoginPath(route.path));
    }
    if (allowed.path !== route.path) {
      redirect(`/${allowed.path}`);
    }

    return {
      route,
      session: {
        userId: session.sub,
        username: session.username,
        displayName: session.displayName,
        userType: session.userType,
        redirectPath: session.redirectPath,
        clientId: allowed.clientId,
        isStaffPreview: false,
      },
    };
  }

  const blockedKinds = policy.staffPreviewBlockedKinds ?? [];
  if (route.portalKind && blockedKinds.includes(route.portalKind)) {
    redirect(portalLoginPath(route.path));
  }

  if (policy.allowStaffPreview && session.userType === "internal") {
    return {
      route,
      session: {
        userId: session.sub,
        username: session.username,
        displayName: session.displayName,
        userType: session.userType,
        redirectPath: `/${route.path}`,
        clientId: route.clientId,
        isStaffPreview: true,
      },
    };
  }

  if (policy.externalOnly) {
    redirect(portalLoginPath(route.path));
  }

  redirect(portalLoginPath(route.path));
}
