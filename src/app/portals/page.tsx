import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import AbhiPortalsDemoPage from "@/components/abhi/AbhiPortalsDemoPage";
import { getRequestHost, parseClientPlatformSubdomainSafe } from "@/lib/app-domains";
import { isAbhiSlug } from "@/lib/abhi-surface";

export const metadata: Metadata = {
  title: "ABHI Demo Portals | Unit311 Central",
  description:
    "Pre-demo briefing for ABHI on Unit311 Central — platform logins, major modules, and ABHI custom capabilities.",
  robots: { index: false, follow: false },
};

export default async function PortalsPage() {
  const host = getRequestHost({ headers: await headers() });
  const workspaceSlug = parseClientPlatformSubdomainSafe(host);

  // Page is intended for the ABHI customer host; allow local/dev without slug too.
  if (workspaceSlug && !isAbhiSlug(workspaceSlug)) {
    notFound();
  }

  return <AbhiPortalsDemoPage />;
}
