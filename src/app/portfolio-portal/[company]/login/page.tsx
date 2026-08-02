import { notFound } from "next/navigation";

import { CompanyPortalLogin } from "@/components/talanton/portal/CompanyPortalLogin";
import { getCompanyPortalByPath } from "@/lib/talanton/company-portal-routes";

/**
 * Public company-portal login.
 *
 * Middleware is the only gate that decides whether this page is served
 * (anonymous / cleared invalid sessions). Do NOT redirect based on cookies
 * here — a readable JWT that failed the host membership gate used to bounce
 * back to /{company} and create ERR_TOO_MANY_REDIRECTS.
 */
export default async function CompanyPortalLoginPage({
  params,
}: {
  params: Promise<{ company: string }>;
}) {
  const { company } = await params;
  const route = getCompanyPortalByPath(company);
  if (!route) notFound();

  return (
    <CompanyPortalLogin
      companyPath={route.path}
      companyName={route.displayName}
      suggestedUsername={route.username}
      portalKind={route.portalKind ?? "company"}
    />
  );
}
