import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  getNorthstarDemoClientPortalBySlug,
  type NorthstarDemoClientPortalRoute,
} from "@/lib/demo/northstar-client-portal-routes";
import { PLATFORM_SESSION_COOKIE, readPlatformSessionToken } from "@/lib/platform-session-token";

export type NorthstarClientPortalSession = {
  userId: string;
  username: string;
  displayName: string;
  userType: string;
  redirectPath: string;
  clientId: string | null;
};

function normalizeRedirectPath(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\/$/, "") || "/";
}

export async function requireNorthstarClientPortalAccess(
  clientSlug: string,
): Promise<{ route: NorthstarDemoClientPortalRoute; session: NorthstarClientPortalSession }> {
  const route = getNorthstarDemoClientPortalBySlug(clientSlug);
  if (!route) {
    redirect("/login");
  }

  const jar = await cookies();
  const token = jar.get(PLATFORM_SESSION_COOKIE)?.value;
  if (!token) {
    redirect(`/${route.path}/login`);
  }

  const session = await readPlatformSessionToken(token);
  if (!session) {
    redirect(`/${route.path}/login`);
  }

  if (session.userType !== "external") {
    redirect(`/${route.path}/login`);
  }

  const sessionHome = normalizeRedirectPath(session.redirectPath);
  const expectedHome = normalizeRedirectPath(route.redirectPath);
  if (sessionHome !== expectedHome && !sessionHome.startsWith(`${expectedHome}/`)) {
    redirect(`/${route.path}/login`);
  }

  return {
    route,
    session: {
      userId: session.sub,
      username: session.username,
      displayName: session.displayName,
      userType: session.userType,
      redirectPath: session.redirectPath,
      clientId: route.companyId,
    },
  };
}
