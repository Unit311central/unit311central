import type { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";

import ResetPasswordPage from "@/components/auth/ResetPasswordPage";
import { isCorpCentreSlug } from "@/components/layout/CorpCentreLogoMark";
import {
  getRequestHost,
  isCentralDomainHost,
  parseClientPlatformSubdomainSafe,
} from "@/lib/app-domains";
import { isAbhiSlug } from "@/lib/abhi-surface";
import { isOnwardAirSlug } from "@/lib/onwardair-surface";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import { findWorkspaceBySlug } from "@/lib/workspace-host";

export async function generateMetadata(): Promise<Metadata> {
  const host = getRequestHost({ headers: await headers() });
  const slug = parseClientPlatformSubdomainSafe(host);

  if (isOnwardAirSlug(slug)) {
    return {
      title: "Reset Password | OnwardAir",
      description: "Reset your OnwardAir workspace password.",
      robots: { index: false, follow: false },
    };
  }

  if (isAbhiSlug(slug)) {
    return {
      title: "Reset Password | ABHI",
      description: "Reset your ABHI workspace password.",
      robots: { index: false, follow: false },
    };
  }

  if (isTalantonImpactSlug(slug)) {
    return {
      title: "Reset Password | Talanton Impact",
      description: "Reset your Talanton Impact workspace password.",
      robots: { index: false, follow: false },
    };
  }

  if (isCorpCentreSlug(slug)) {
    return {
      title: "Reset Password | Corp.Centre",
      description: "Reset your Corp.Centre workspace password.",
      robots: { index: false, follow: false },
    };
  }

  if (slug) {
    const workspace = await findWorkspaceBySlug(slug);
    const name = workspace?.name?.trim() || slug;
    return {
      title: `Reset Password | ${name}`,
      description: `Reset your ${name} workspace password.`,
      robots: { index: false, follow: false },
    };
  }

  const isCentral = isCentralDomainHost(host);
  return {
    title: isCentral ? "Reset Password | Unit311 Central" : "Reset Password | Unit311",
    description: "Reset your Unit311 account password.",
    robots: { index: false, follow: false },
  };
}

export default async function ResetPasswordRoute() {
  const host = getRequestHost({ headers: await headers() });
  const slug = parseClientPlatformSubdomainSafe(host);
  const workspace = slug ? await findWorkspaceBySlug(slug) : null;
  const brand = isCorpCentreSlug(slug)
    ? "corpcentre"
    : isTalantonImpactSlug(slug)
      ? "talanton"
      : isAbhiSlug(slug)
        ? "abhi"
        : isOnwardAirSlug(slug)
          ? "onwardair"
          : slug
            ? "customer"
            : isCentralDomainHost(host)
              ? "central"
              : "default";

  return (
    <Suspense fallback={null}>
      <ResetPasswordPage
        brand={brand}
        workspaceName={workspace?.name?.trim() || null}
      />
    </Suspense>
  );
}
