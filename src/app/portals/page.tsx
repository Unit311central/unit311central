import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import PortalsBriefingPage from "@/components/portals/PortalsBriefingPage";
import { getRequestHost } from "@/lib/app-domains";
import { resolveWorkspaceSlugFromHost } from "@/lib/intelligence/workspace-context";
import { getPortalsBriefingPackBySlug } from "@/lib/portals/briefing/pack-registry";

export const metadata: Metadata = {
  title: "Demo Portals | Unit311 Central",
  description:
    "Pre-demo briefing for Northstar on Unit311 Central — platform logins and major modules.",
  robots: { index: false, follow: false },
};

export default async function PortalsPage() {
  const host = getRequestHost({ headers: await headers() });
  const workspaceSlug = resolveWorkspaceSlugFromHost(host);
  const pack = workspaceSlug ? getPortalsBriefingPackBySlug(workspaceSlug) : null;

  if (!pack) {
    notFound();
  }

  return <PortalsBriefingPage workspaceSlug={pack.slug} />;
}
