import { notFound, redirect } from "next/navigation";

import { WolfPailexPortalApp } from "@/components/wolf/pailex-portal/WolfPailexPortalApp";
import { parseWolfPailexPortalSection } from "@/lib/wolf/wolf-pailex-portal-data";
import { getWolfPailexPortalByPath } from "@/lib/wolf/wolf-pailex-portal-routes";

export const dynamic = "force-dynamic";

export default async function WolfPailexPortalPage({
  params,
}: {
  params: Promise<{ company: string; section?: string[] }>;
}) {
  const { company, section = [] } = await params;
  const route = getWolfPailexPortalByPath(company);
  if (!route) notFound();

  if (section[0] === "login") {
    redirect(`/${route.path}/login`);
  }

  const portalSection = parseWolfPailexPortalSection(section);
  if (!portalSection) notFound();

  return <WolfPailexPortalApp companyName={route.displayName} section={portalSection} />;
}
