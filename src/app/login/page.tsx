import type { Metadata } from "next";
import { headers } from "next/headers";

import Unit311LoginPage from "@/components/auth/Unit311LoginPage";
import {
  DEMO_SITE_URL,
  INTERNAL_SITE_URL,
  getRequestHost,
  isCentralDomainHost,
  isDemoDomainHost,
  isInternalDomainHost,
  parseClientPlatformSubdomainSafe,
  parseLoginReturnTo,
  parseSafePostLoginNext,
  customerWorkspaceOrigin,
} from "@/lib/app-domains";
import { isCorpCentreSlug } from "@/components/layout/CorpCentreLogoMark";
import { isAbhiSlug } from "@/lib/abhi-surface";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import { findWorkspaceBySlug } from "@/lib/workspace-host";

export async function generateMetadata(): Promise<Metadata> {
  const host = getRequestHost({ headers: await headers() });
  const workspaceSlug = parseClientPlatformSubdomainSafe(host);
  const isCentral = isCentralDomainHost(host);
  const isDemo = isDemoDomainHost(host);

  if (isCorpCentreSlug(workspaceSlug)) {
    return {
      title: "Login | Corp.Centre",
      description: "Secure access to your Corp.Centre workspace.",
      robots: { index: false, follow: false },
    };
  }

  if (isTalantonImpactSlug(workspaceSlug)) {
    return {
      title: "Login | Talanton Impact — Portfolio Governance Platform",
      description:
        "Secure access to the Talanton Impact Portfolio Governance Platform for impact investing and portfolio oversight.",
      robots: { index: false, follow: false },
    };
  }

  if (isAbhiSlug(workspaceSlug)) {
    return {
      title: "Login | ABHI",
      description: "Secure access to your ABHI workspace.",
      robots: { index: false, follow: false },
    };
  }

  if (workspaceSlug) {
    const workspace = await findWorkspaceBySlug(workspaceSlug);
    const name = workspace?.name?.trim() || workspaceSlug;
    return {
      title: `Login | ${name}`,
      description: `Secure access to your ${name} workspace.`,
      robots: { index: false, follow: false },
    };
  }

  if (isDemo) {
    return {
      title: "Login | Unit311 Demo",
      description: "Secure access to the Unit311 Demo workspace.",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: isCentral ? "Workspace Login | Unit311 Central" : "Workspace Login | Unit311",
    description: "Secure Access to your Workspace.",
    robots: { index: false, follow: false },
  };
}

type PageProps = {
  searchParams: Promise<{ return_to?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const host = getRequestHost({ headers: await headers() });
  const isCentral = isCentralDomainHost(host);
  const isDemo = isDemoDomainHost(host);
  const isInternal = isInternalDomainHost(host);
  const workspaceSlug = parseClientPlatformSubdomainSafe(host);
  const params = await searchParams;
  const returnTo =
    parseLoginReturnTo(params.return_to)?.origin ??
    (workspaceSlug ? customerWorkspaceOrigin(workspaceSlug) : null) ??
    (isDemo ? DEMO_SITE_URL : null) ??
    (isInternal ? INTERNAL_SITE_URL : null);
  const nextPath = parseSafePostLoginNext(params.next);
  const workspaceRecord = workspaceSlug ? await findWorkspaceBySlug(workspaceSlug) : null;
  const customerWorkspaceName = workspaceRecord?.name?.trim() || null;
  const brand = isCorpCentreSlug(workspaceSlug)
    ? "corpcentre"
    : isTalantonImpactSlug(workspaceSlug)
      ? "talanton"
      : isAbhiSlug(workspaceSlug)
        ? "abhi"
        : workspaceSlug
          ? "customer"
          : isCentral
            ? "central"
            : "default";

  return (
    <Unit311LoginPage
      variant={
        brand === "corpcentre" ||
        brand === "talanton" ||
        brand === "abhi" ||
        brand === "customer" ||
        brand === "central"
          ? "central"
          : "default"
      }
      brand={brand}
      workspaceName={customerWorkspaceName}
      returnTo={returnTo}
      nextPath={nextPath}
    />
  );
}
