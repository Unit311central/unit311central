import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import PortalsBriefingPage from "@/components/portals/PortalsBriefingPage";
import { getRequestHost, parseClientPlatformSubdomainSafe } from "@/lib/app-domains";
import { getPortalsBriefingUiConfig } from "@/lib/portals/briefing/pack-ui-configs";
import { getPortalPackBySlug } from "@/lib/portals/registry";

export const metadata: Metadata = {
  title: "Demo Portals | Unit311 Central",
  description:
    "Pre-demo briefing for Unit311 Central customer workspaces — platform logins, major modules, and custom capabilities.",
  robots: { index: false, follow: false },
};

export default async function PortalsPage() {
  const host = getRequestHost({ headers: await headers() });
  const workspaceSlug = parseClientPlatformSubdomainSafe(host);
  const pack = workspaceSlug ? getPortalPackBySlug(workspaceSlug) : null;

  if (!pack?.briefing) {
    notFound();
  }

  const uiConfig = getPortalsBriefingUiConfig(pack.slug);
  if (!uiConfig) {
    notFound();
  }

  return <PortalsBriefingPage config={uiConfig} />;
}
