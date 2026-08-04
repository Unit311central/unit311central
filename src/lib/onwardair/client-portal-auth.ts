import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  getOnwardAirClientPortalByPath,
  type OnwardAirClientPortalRoute,
} from "@/lib/onwardair/client-portal-routes";
import { PLATFORM_SESSION_COOKIE, readPlatformSessionToken } from "@/lib/platform-session-token";

export type OnwardAirClientPortalSession = {
  userId: string;
  username: string;
  displayName: string;
  userType: string;
  redirectPath: string;
  clientId: string | null;
};

function portalLoginPath(path: string) {
  return `/${path}/login`;
}

export async function requireOnwardAirClientPortalAccess(
  companyPath: string,
): Promise<{ route: OnwardAirClientPortalRoute; session: OnwardAirClientPortalSession }> {
  const route = getOnwardAirClientPortalByPath(companyPath);
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

  if (session.userType === "external") {
    const allowed = getOnwardAirClientPortalByPath(session.redirectPath);
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
      },
    };
  }

  redirect(portalLoginPath(route.path));
}
