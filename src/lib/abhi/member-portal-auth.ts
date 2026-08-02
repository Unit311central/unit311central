import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  getMemberPortalByPath,
  type AbhiMemberPortalRoute,
} from "@/lib/abhi/member-portal-routes";
import { PLATFORM_SESSION_COOKIE, readPlatformSessionToken } from "@/lib/platform-session-token";

export type AbhiMemberPortalSession = {
  userId: string;
  username: string;
  displayName: string;
  userType: string;
  redirectPath: string;
  clientId: string | null;
  /** ABHI staff preview — still portal chrome only, never the admin nav. */
  isStaffPreview: boolean;
};

function portalLoginPath(path: string) {
  // Use /{company}/login — never redirect to bare /{company} from the app
  // layout, or middleware will rewrite into this layout again (redirect loop).
  return `/${path}/login`;
}

export async function requireAbhiMemberPortalAccess(
  companyPath: string,
): Promise<{ route: AbhiMemberPortalRoute; session: AbhiMemberPortalSession }> {
  const route = getMemberPortalByPath(companyPath);
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

  // External users only — staff must use the branded portal login with the
  // assigned member account (e.g. demo@centrak.com), not skip via admin session.
  if (session.userType === "external") {
    const allowed = getMemberPortalByPath(session.redirectPath);
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

  redirect(portalLoginPath(route.path));
}
