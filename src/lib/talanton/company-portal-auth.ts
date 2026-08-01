import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  getCompanyPortalByPath,
  type TalantonCompanyPortalRoute,
} from "@/lib/talanton/company-portal-routes";
import { PLATFORM_SESSION_COOKIE, readPlatformSessionToken } from "@/lib/platform-session-token";

export type CompanyPortalSession = {
  userId: string;
  username: string;
  displayName: string;
  userType: string;
  redirectPath: string;
  clientId: string | null;
  /** Talanton staff preview — still portal chrome only, never admin nav. */
  isStaffPreview: boolean;
};

function portalLoginPath(path: string) {
  // Use /{company}/login — never redirect to bare /{company} from the app
  // layout, or middleware will rewrite into this layout again (redirect loop).
  return `/${path}/login`;
}

export async function requireCompanyPortalAccess(
  companyPath: string,
): Promise<{ route: TalantonCompanyPortalRoute; session: CompanyPortalSession }> {
  const route = getCompanyPortalByPath(companyPath);
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

  // External users: only their assigned company portal.
  if (session.userType === "external") {
    const allowed = getCompanyPortalByPath(session.redirectPath);
    if (!allowed) {
      // Unassigned portal — leave the app shell; middleware clears bad sessions.
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

  // Internal Talanton staff (host membership already enforced by middleware) may
  // preview company portals. These URLs always render portal chrome — never admin nav.
  if (session.userType === "internal") {
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

  redirect(portalLoginPath(route.path));
}
