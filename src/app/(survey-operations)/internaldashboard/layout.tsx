import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";

import {
  getRequestHost,
  isCentralDomainHost,
  isDemoDomainHost,
  isInternalDomainHost,
  parseClientPlatformSubdomainSafe,
} from "@/lib/app-domains";
import { findWorkspaceBySlug } from "@/lib/workspace-host";
import { GUIDED_TUTORIALS_FINGERPRINT } from "@/lib/guided-tutorials/fingerprint";

export async function generateMetadata(): Promise<Metadata> {
  const host = getRequestHost({ headers: await headers() });
  const isCentral = isCentralDomainHost(host) || isInternalDomainHost(host);
  const workspaceSlug = parseClientPlatformSubdomainSafe(host);

  if (workspaceSlug) {
    const workspace = await findWorkspaceBySlug(workspaceSlug);
    const name = workspace?.name?.trim() || workspaceSlug;
    return {
      title: `${name} | Dashboard`,
      description: `${name} workspace — operations, finance, and delivery.`,
      robots: { index: false, follow: false },
      other: { "unit311-guided-tutorials": GUIDED_TUTORIALS_FINGERPRINT },
    };
  }

  if (isDemoDomainHost(host)) {
    return {
      title: "Northstar Operations Dashboard",
      description:
        "Northstar Industrial Technologies demo workspace — operations, finance, marketing, and delivery.",
      robots: { index: false, follow: false },
      other: { "unit311-guided-tutorials": GUIDED_TUTORIALS_FINGERPRINT },
    };
  }

  return {
    title: isCentral
      ? "Internal Operations | Unit311 Central"
      : "Internal Operations Dashboard | Unit311",
    description: isCentral
      ? "Unit311 Central internal operations — clients, projects, finance, files, logistics, and more."
      : "Unit311 internal operations workspace — clients, projects, finance, files, logistics, and more.",
    robots: { index: false, follow: false },
    other: { "unit311-guided-tutorials": GUIDED_TUTORIALS_FINGERPRINT },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function InternalDashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
