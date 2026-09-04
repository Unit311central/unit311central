import { notFound } from "next/navigation";

import { GreenDesertClientPortalApp } from "@/components/greendesert/portal/GreenDesertClientPortalApp";
import { parseGreenDesertClientPortalSection } from "@/lib/greendesert/client-portal-data";
import { getGreenDesertClientPortalByPath } from "@/lib/greendesert/client-portal-routes";

export default async function GreenDesertClientPortalPage({
  params,
}: {
  params: Promise<{ company: string; section?: string[] }>;
}) {
  const { company, section = [] } = await params;
  const route = getGreenDesertClientPortalByPath(company);
  if (!route) notFound();

  const portalSection = parseGreenDesertClientPortalSection(section);
  if (!portalSection) notFound();

  return <GreenDesertClientPortalApp companyName={route.displayName} section={portalSection} />;
}
