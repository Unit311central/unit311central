import { notFound } from "next/navigation";

import { OnwardAirBoardPortalApp } from "@/components/onwardair/board/OnwardAirBoardPortalApp";
import { OnwardAirClientPortalApp } from "@/components/onwardair/portal/OnwardAirClientPortalApp";
import { OnwardAirOverviewPage } from "@/components/onwardair/overview/OnwardAirOverviewPage";
import { parseOaBoardPortalSection } from "@/lib/onwardair/board-portal-data";
import { requireOnwardAirClientPortalAccess } from "@/lib/onwardair/client-portal-auth";
import { parseOaClientPortalSection } from "@/lib/onwardair/client-portal-data";
import { getOnwardAirClientPortalByPath } from "@/lib/onwardair/client-portal-routes";

export const dynamic = "force-dynamic";

export default async function OnwardAirClientPortalPage({
  params,
}: {
  params: Promise<{ company: string; section?: string[] }>;
}) {
  const { company, section = [] } = await params;
  const route = getOnwardAirClientPortalByPath(company);
  if (!route) notFound();

  if (route.portalKind === "overview") {
    await requireOnwardAirClientPortalAccess(company);
    return <OnwardAirOverviewPage />;
  }

  if (route.portalKind === "board") {
    const boardSection = parseOaBoardPortalSection(section);
    if (!boardSection) notFound();
    return <OnwardAirBoardPortalApp section={boardSection} />;
  }

  const portalSection = parseOaClientPortalSection(section);
  if (!portalSection) notFound();

  return (
    <OnwardAirClientPortalApp companyName={route.displayName} section={portalSection} />
  );
}
