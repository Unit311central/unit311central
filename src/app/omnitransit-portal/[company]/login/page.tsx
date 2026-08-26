import { notFound } from "next/navigation";

import { OmniTransitBoardPortalLogin } from "@/components/saec/portals/OmniTransitBoardPortalLogin";
import { OmniTransitClientPortalLogin } from "@/components/saec/portals/OmniTransitClientPortalLogin";
import { getOmnitransitPortalByPath } from "@/lib/saec/client-portal-routes";

/**
 * Public OmniTransit portal login.
 * Middleware decides whether this page is served — do not cookie-redirect here.
 */
export default async function OmnitransitPortalLoginPage({
  params,
}: {
  params: Promise<{ company: string }>;
}) {
  const { company } = await params;
  const route = getOmnitransitPortalByPath(company);
  if (!route) notFound();

  if (route.portalKind === "board") {
    return <OmniTransitBoardPortalLogin companyPath={route.path} />;
  }

  return (
    <OmniTransitClientPortalLogin companyPath={route.path} companyName={route.displayName} />
  );
}
