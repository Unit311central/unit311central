import { notFound } from "next/navigation";

import { AbhiMemberPortalLogin } from "@/components/abhi/portal/AbhiMemberPortalLogin";
import { getMemberPortalByPath } from "@/lib/abhi/member-portal-routes";

/**
 * Public ABHI member-portal login.
 *
 * Middleware is the only gate that decides whether this page is served
 * (anonymous / cleared invalid sessions). Do NOT redirect based on cookies
 * here — a readable JWT that failed the host membership gate used to bounce
 * back to /{company} and create ERR_TOO_MANY_REDIRECTS.
 */
export default async function AbhiMemberPortalLoginPage({
  params,
}: {
  params: Promise<{ company: string }>;
}) {
  const { company } = await params;
  const route = getMemberPortalByPath(company);
  if (!route) notFound();

  return (
    <AbhiMemberPortalLogin
      companyPath={route.path}
      companyName={route.displayName}
      suggestedUsername={route.username}
      companyLogoSrc={route.companyLogoSrc}
      portalKind={route.portalKind ?? "member"}
    />
  );
}
