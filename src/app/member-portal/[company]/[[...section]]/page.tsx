import { notFound } from "next/navigation";

import { AbhiBoardPortalApp } from "@/components/abhi/board/AbhiBoardPortalApp";
import { AbhiMemberPortalApp } from "@/components/abhi/portal/AbhiMemberPortalApp";
import { parseBoardPortalSection } from "@/lib/abhi/board-portal-data";
import { parseMemberPortalSection } from "@/lib/abhi/member-portal-data";
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

  const memberSection = parseMemberPortalSection(section);
  if (!memberSection) notFound();

  return (
    <AbhiMemberPortalApp
      companyPath={route.path}
      companyId={route.clientId}
      companyName={route.displayName}
      section={memberSection}
    />
  );
}
