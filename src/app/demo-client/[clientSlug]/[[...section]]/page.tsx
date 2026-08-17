import type { Metadata } from "next";
import { notFound } from "next/navigation";

import DemoClientPortal from "@/components/demo/DemoClientPortal";
import { OnwardAirClientPortalApp } from "@/components/onwardair/portal/OnwardAirClientPortalApp";
import { getDemoClientPortal } from "@/lib/demo/demo-client-portal-routes";
import { getNorthstarDemoClientPortalBySlug } from "@/lib/demo/northstar-client-portal-routes";
import { parseOaClientPortalSection } from "@/lib/onwardair/client-portal-data";

type Props = {
  params: Promise<{ clientSlug: string; section?: string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { clientSlug } = await params;
  const route =
    getNorthstarDemoClientPortalBySlug(clientSlug) ?? getDemoClientPortal(clientSlug);
  if (!route) {
    return { title: "Client Portal | Northstar Demo", robots: { index: false, follow: false } };
  }
  return {
    title: `${route.companyName} | Client Portal`,
    robots: { index: false, follow: false },
  };
}

export const dynamic = "force-dynamic";

export default async function DemoClientPortalSectionPage({ params }: Props) {
  const { clientSlug, section = [] } = await params;
  const route = getNorthstarDemoClientPortalBySlug(clientSlug);
  if (route) {
    const portalSection = parseOaClientPortalSection(section);
    if (!portalSection) notFound();
    return (
      <OnwardAirClientPortalApp
        companyName={route.companyName}
        section={portalSection}
        variant="northstar"
      />
    );
  }

  const portal = getDemoClientPortal(clientSlug);
  if (!portal) notFound();
  if (section.length > 0) notFound();

  return <DemoClientPortal portal={portal} />;
}
