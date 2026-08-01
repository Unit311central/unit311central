import type { Metadata } from "next";
import { headers } from "next/headers";

import Unit311LoginPage from "@/components/auth/Unit311LoginPage";
import {
  getRequestHost,
  isCentralDomainHost,
  parseClientPlatformSubdomainSafe,
  parseLoginReturnTo,
  parseSafePostLoginNext,
  customerWorkspaceOrigin,
} from "@/lib/app-domains";
import { isCorpCentreSlug } from "@/components/layout/CorpCentreLogoMark";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";

export async function generateMetadata(): Promise<Metadata> {
  const host = getRequestHost({ headers: await headers() });
  const workspaceSlug = parseClientPlatformSubdomainSafe(host);
  const isCentral = isCentralDomainHost(host);

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
  const workspaceSlug = parseClientPlatformSubdomainSafe(host);
  const params = await searchParams;
  const returnTo =
    parseLoginReturnTo(params.return_to)?.origin ??
    (workspaceSlug ? customerWorkspaceOrigin(workspaceSlug) : null);
  const nextPath = parseSafePostLoginNext(params.next);
  const brand = isCorpCentreSlug(workspaceSlug)
    ? "corpcentre"
    : isTalantonImpactSlug(workspaceSlug)
      ? "talanton"
      : isCentral
        ? "central"
        : "default";

  return (
    <Unit311LoginPage
      variant={
        brand === "corpcentre" || brand === "talanton" || brand === "central"
          ? "central"
          : "default"
      }
      brand={brand}
      returnTo={returnTo}
      nextPath={nextPath}
    />
  );
}
