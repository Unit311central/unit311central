import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import AbhiPortalsDemoPage from "@/components/abhi/AbhiPortalsDemoPage";
import TalantonPortalsDemoPage from "@/components/talanton/TalantonPortalsDemoPage";
import { getRequestHost, parseClientPlatformSubdomainSafe } from "@/lib/app-domains";
import { isAbhiSlug } from "@/lib/abhi-surface";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";

export const metadata: Metadata = {
  title: "Demo Portals | Unit311 Central",
  description:
    "Pre-demo briefing for Unit311 Central customer workspaces — platform logins, major modules, and custom capabilities.",
  robots: { index: false, follow: false },
};

export default async function PortalsPage() {
  const host = getRequestHost({ headers: await headers() });
  const workspaceSlug = parseClientPlatformSubdomainSafe(host);

  if (workspaceSlug && isTalantonImpactSlug(workspaceSlug)) {
    return <TalantonPortalsDemoPage />;
  }

  // Page is intended for ABHI (and local/dev without slug).
  if (workspaceSlug && !isAbhiSlug(workspaceSlug)) {
    notFound();
  }

  return <AbhiPortalsDemoPage />;
}
