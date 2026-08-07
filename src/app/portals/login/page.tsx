import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import Unit311LoginPage from "@/components/auth/Unit311LoginPage";
import {
  customerWorkspaceOrigin,
  getRequestHost,
  parseClientPlatformSubdomainSafe,
} from "@/lib/app-domains";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import { findWorkspaceBySlug } from "@/lib/workspace-host";

export const metadata: Metadata = {
  title: "Talantom Impact Overview Portal | Login",
  description:
    "Overview portals page for Harry Turner — Unit311 Central customised Talanton Impact Platform.",
  robots: { index: false, follow: false },
};

export default async function TalantonPortalsLoginPage() {
  const host = getRequestHost({ headers: await headers() });
  const workspaceSlug = parseClientPlatformSubdomainSafe(host);

  if (!workspaceSlug || !isTalantonImpactSlug(workspaceSlug)) {
    notFound();
  }

  const workspaceRecord = await findWorkspaceBySlug(workspaceSlug);
  const returnTo = customerWorkspaceOrigin(workspaceSlug);

  return (
    <Unit311LoginPage
      variant="central"
      brand="talanton"
      workspaceName={workspaceRecord?.name?.trim() || null}
      returnTo={returnTo}
      nextPath="/portals"
      portalsLogin
    />
  );
}
