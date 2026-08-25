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
import { isOnwardAirSlug } from "@/lib/onwardair-surface";
import { isSaecSlug } from "@/lib/saec-surface";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import { loadWorkspaceLoginBrandingBySlug } from "@/lib/platform-workspaces/workspace-login-page-service";
import { findWorkspaceBySlug } from "@/lib/workspace-host";

function workspaceSlugFromReturnTo(returnTo: string | null | undefined): string | null {
  const target = parseLoginReturnTo(returnTo);
  if (!target || target.kind !== "workspace") return null;
  try {
    return parseClientPlatformSubdomainSafe(new URL(target.origin).host);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string; next?: string }>;
}): Promise<Metadata> {
  const host = getRequestHost({ headers: await headers() });
  const params = await searchParams;
  const workspaceSlug =
    parseClientPlatformSubdomainSafe(host) ?? workspaceSlugFromReturnTo(params.return_to);
  const isCentral = isCentralDomainHost(host);
  const isDemo = isDemoDomainHost(host);
  const nextPath = parseSafePostLoginNext(params.next);
  const isPortalsNext =
    nextPath === "/portals" ||
    Boolean(nextPath?.startsWith("/portals/") || nextPath?.startsWith("/portals?"));

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

  if (isOnwardAirSlug(workspaceSlug)) {
    if (isPortalsNext) {
      return {
        title: "OnwardAir Demo Information Page",
        description: "Secure access to your OnwardAir demo portal page.",
        robots: { index: false, follow: false },
      };
    }
    return {
      title: "Login | OnwardAir",
      description: "Secure access to your OnwardAir workspace.",
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
      title: "Login | Northstar Industrial Technologies",
      description: "Secure access to the Northstar Industrial Technologies demo workspace.",
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
  const params = await searchParams;
  const hostWorkspaceSlug = parseClientPlatformSubdomainSafe(host);
  const returnWorkspaceSlug = workspaceSlugFromReturnTo(params.return_to);
  // Prefer the host tenant; fall back to return_to so apex /login?return_to=… brands as the customer.
  const workspaceSlug = hostWorkspaceSlug ?? returnWorkspaceSlug;
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
        : isOnwardAirSlug(workspaceSlug)
          ? "onwardair"
          : isSaecSlug(workspaceSlug)
            ? "saec"
            : isDemo || workspaceSlug === "demo"
              ? "northstar"
              : workspaceSlug
                ? "customer"
                : isCentral
                  ? "central"
                  : "default";
  const loginBranding =
    workspaceSlug && brand === "customer"
      ? await loadWorkspaceLoginBrandingBySlug(workspaceSlug)
      : null;

  return (
    <Unit311LoginPage
      variant={
        brand === "corpcentre" ||
        brand === "talanton" ||
        brand === "abhi" ||
        brand === "onwardair" ||
        brand === "customer" ||
        brand === "saec" ||
        brand === "central"
          ? "central"
          : "default"
      }
      brand={brand}
      workspaceName={customerWorkspaceName}
      loginTitle={loginBranding?.title ?? null}
      loginLogoUrl={loginBranding?.logoUrl ?? null}
      loginBackgroundUrl={loginBranding?.backgroundUrl ?? null}
      returnTo={returnTo}
      nextPath={nextPath}
    />
  );
}
