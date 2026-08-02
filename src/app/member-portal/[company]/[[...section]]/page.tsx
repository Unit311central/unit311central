import { notFound } from "next/navigation";

import { AbhiBoardPortalApp } from "@/components/abhi/board/AbhiBoardPortalApp";
import { AbhiMemberPortalDashboard } from "@/components/abhi/portal/AbhiMemberPortalDashboard";
import { parseBoardPortalSection } from "@/lib/abhi/board-portal-data";
import { getMemberPortalByPath } from "@/lib/abhi/member-portal-routes";

export default async function AbhiMemberPortalPage({
  params,
}: {
  params: Promise<{ company: string; section?: string[] }>;
}) {
  const { company, section = [] } = await params;
  const route = getMemberPortalByPath(company);
  if (!route) notFound();

  if (route.portalKind === "board") {
    const boardSection = parseBoardPortalSection(section);
    if (!boardSection) notFound();
    return <AbhiBoardPortalApp section={boardSection} />;
  }

  // Member company portals — single dashboard today.
  if (section.length > 0) notFound();

  return <AbhiMemberPortalDashboard companyId={route.clientId} companyName={route.displayName} />;
}
