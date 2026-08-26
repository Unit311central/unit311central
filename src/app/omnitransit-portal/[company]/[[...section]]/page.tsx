import { notFound } from "next/navigation";

import { OmniTransitBoardPortalApp } from "@/components/saec/portals/OmniTransitBoardPortalApp";
import { OmniTransitClientPortalApp } from "@/components/saec/portals/OmniTransitClientPortalApp";
import { parseOtBoardPortalSection } from "@/lib/saec/board-portal-data";
import { parseOtClientPortalSection } from "@/lib/saec/client-portal-data";
import { getOmnitransitPortalByPath } from "@/lib/saec/client-portal-routes";

export const dynamic = "force-dynamic";

export default async function OmnitransitPortalPage({
  params,
}: {
  params: Promise<{ company: string; section?: string[] }>;
}) {
  const { company, section = [] } = await params;
  const route = getOmnitransitPortalByPath(company);
  if (!route) notFound();

  if (route.portalKind === "board") {
    const boardSection = parseOtBoardPortalSection(section);
    if (!boardSection) notFound();
    return <OmniTransitBoardPortalApp section={boardSection} />;
  }

  const clientSection = parseOtClientPortalSection(route.path, section);
  if (!clientSection) notFound();

  return <OmniTransitClientPortalApp section={clientSection} />;
}
