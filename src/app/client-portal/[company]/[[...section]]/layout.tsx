import { OnwardAirBoardPortalShell } from "@/components/onwardair/board/OnwardAirBoardPortalShell";
import { OnwardAirClientPortalShell } from "@/components/onwardair/portal/OnwardAirClientPortalShell";
import { requireOnwardAirClientPortalAccess } from "@/lib/onwardair/client-portal-auth";

export default async function OnwardAirClientPortalAppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ company: string }>;
}) {
  const { company } = await params;
  const { route, session } = await requireOnwardAirClientPortalAccess(company);
  const displayName = session.displayName || session.username;

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
