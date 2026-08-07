import { notFound } from "next/navigation";

import { OnwardAirBoardPortalShell } from "@/components/onwardair/board/OnwardAirBoardPortalShell";
import { OnwardAirClientPortalShell } from "@/components/onwardair/portal/OnwardAirClientPortalShell";
import { OnwardAirOverviewShell } from "@/components/onwardair/overview/OnwardAirOverviewShell";
import { requireOnwardAirClientPortalAccess } from "@/lib/onwardair/client-portal-auth";
import { getOnwardAirClientPortalByPath } from "@/lib/onwardair/client-portal-routes";
import { isOverviewAuthBypassEnabled } from "@/lib/onwardair/overview-gate";

export const dynamic = "force-dynamic";

export default async function OnwardAirClientPortalAppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ company: string }>;
}) {
  const { company } = await params;
  const route = getOnwardAirClientPortalByPath(company);
  if (!route) notFound();

  if (route.portalKind === "overview" && isOverviewAuthBypassEnabled()) {
    return <OnwardAirOverviewShell>{children}</OnwardAirOverviewShell>;
  }

  const { session } = await requireOnwardAirClientPortalAccess(company);
  const displayName = session.displayName || session.username;

  if (route.portalKind === "overview") {
    return <OnwardAirOverviewShell>{children}</OnwardAirOverviewShell>;
  }

  if (route.portalKind === "board") {
    return (
      <OnwardAirBoardPortalShell displayName={displayName}>{children}</OnwardAirBoardPortalShell>
    );
  }

  return (
    <OnwardAirClientPortalShell
      companyPath={route.path}
      companyName={route.displayName}
      displayName={displayName}
      companyLogoSrc={route.companyLogoSrc}
    >
      {children}
    </OnwardAirClientPortalShell>
  );
}
