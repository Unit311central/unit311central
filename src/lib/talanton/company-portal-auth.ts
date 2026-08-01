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
};

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
    redirect(`/login?next=/${route.path}`);
  }

  const session = await readPlatformSessionToken(token);
  if (!session) {
    redirect(`/login?next=/${route.path}`);
  }

  if (session.userType !== "external") {
    redirect("/dashboard");
  }

  const allowed = getCompanyPortalByPath(session.redirectPath);
  if (!allowed || allowed.path !== route.path) {
    redirect(allowed ? `/${allowed.path}` : "/login");
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
