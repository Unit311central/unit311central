import { notFound } from "next/navigation";

import { OnwardAirClientPortalApp } from "@/components/onwardair/portal/OnwardAirClientPortalApp";
import { parseOaClientPortalSection } from "@/lib/onwardair/client-portal-data";
import { getOnwardAirClientPortalByPath } from "@/lib/onwardair/client-portal-routes";

export default async function OnwardAirClientPortalPage({
  params,
}: {
  params: Promise<{ company: string; section?: string[] }>;
}) {
  const { company, section = [] } = await params;
  const route = getOnwardAirClientPortalByPath(company);
  if (!route) notFound();

  const portalSection = parseOaClientPortalSection(section);
  if (!portalSection) notFound();

  return (
    <OnwardAirClientPortalApp companyName={route.displayName} section={portalSection} />
  );
}
