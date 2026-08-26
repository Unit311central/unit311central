import { notFound } from "next/navigation";

import { OmniTransitBoardPortalShell } from "@/components/saec/portals/OmniTransitBoardPortalShell";
import { OmniTransitClientPortalShell } from "@/components/saec/portals/OmniTransitClientPortalShell";
import { requireOmnitransitPortalAccess } from "@/lib/saec/client-portal-auth";
import { getOmnitransitPortalByPath } from "@/lib/saec/client-portal-routes";

export const dynamic = "force-dynamic";

export default async function OmnitransitPortalAppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ company: string }>;
}) {
  const { company } = await params;
  const route = getOmnitransitPortalByPath(company);
  if (!route) notFound();

  const { session } = await requireOmnitransitPortalAccess(company);
  const displayName = session.displayName || session.username;

  if (route.portalKind === "board") {
    return (
      <OmniTransitBoardPortalShell displayName={displayName}>{children}</OmniTransitBoardPortalShell>
    );
  }

  return (
    <OmniTransitClientPortalShell
      companyPath={route.path}
      companyName={route.displayName}
      displayName={displayName}
    >
      {children}
    </OmniTransitClientPortalShell>
  );
}
