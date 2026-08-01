import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";

import { CompanyPortalLogin } from "@/components/talanton/portal/CompanyPortalLogin";
import { getCompanyPortalByPath } from "@/lib/talanton/company-portal-routes";
import { PLATFORM_SESSION_COOKIE, readPlatformSessionToken } from "@/lib/platform-session-token";

export default async function CompanyPortalLoginPage({
  params,
}: {
  params: Promise<{ company: string }>;
}) {
  const { company } = await params;
  const route = getCompanyPortalByPath(company);
  if (!route) notFound();

  const jar = await cookies();
  const token = jar.get(PLATFORM_SESSION_COOKIE)?.value;
  if (token) {
    const session = await readPlatformSessionToken(token);
    if (session?.userType === "external") {
      const allowed = getCompanyPortalByPath(session.redirectPath);
      redirect(allowed ? `/${allowed.path}` : `/${route.path}`);
    }
    if (session?.userType === "internal") {
      redirect(`/${route.path}`);
    }
  }

  return (
    <CompanyPortalLogin
      companyPath={route.path}
      companyName={route.displayName}
      suggestedUsername={route.username}
    />
  );
}
