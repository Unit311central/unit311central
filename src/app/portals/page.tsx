import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import PortalsBriefingPage from "@/components/portals/PortalsBriefingPage";
import { getRequestHost, parseClientPlatformSubdomainSafe } from "@/lib/app-domains";
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

  if (workspaceSlug === "demo") {
    const DemoPortalsShowcase = (await import("@/components/demo/DemoPortalsShowcase")).default;
    return <DemoPortalsShowcase />;
  }

  const pack = workspaceSlug ? getPortalPackBySlug(workspaceSlug) : null;

  if (!pack?.briefing) {
    notFound();
  }

  return <PortalsBriefingPage workspaceSlug={pack.slug} />;
}
