import { notFound } from "next/navigation";

import { OnwardAirClientPortalLogin } from "@/components/onwardair/portal/OnwardAirClientPortalLogin";
import { getOnwardAirClientPortalByPath } from "@/lib/onwardair/client-portal-routes";

/**
 * Public OnwardAir client/board portal login.
 * Middleware decides whether this page is served — do not cookie-redirect here.
 */
export default async function OnwardAirClientPortalLoginPage({
  params,
}: {
  params: Promise<{ company: string }>;
}) {
  const { company } = await params;
  const route = getOnwardAirClientPortalByPath(company);
  if (!route) notFound();

  return (
    <OnwardAirClientPortalLogin
      companyPath={route.path}
      companyName={route.displayName}
      suggestedUsername={route.username}
      companyLogoSrc={route.companyLogoSrc}
      portalKind={
        route.portalKind === "board"
          ? "board"
          : route.portalKind === "overview"
            ? "overview"
            : "client"
      }
    />
  );
}
