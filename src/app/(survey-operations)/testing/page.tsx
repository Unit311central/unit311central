import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AbhiEaTestingWorkspace } from "@/components/abhi/AbhiEaTestingWorkspace";
import { NorthstarEaTestingWorkspace } from "@/components/demo/NorthstarEaTestingWorkspace";
import { TalantonEaTestingWorkspace } from "@/components/talanton/TalantonEaTestingWorkspace";
import { isAbhiCustomerHostRequest } from "@/lib/abhi/ea-testing-auth";
import { isAbhiSlug } from "@/lib/abhi-surface";
import { getRequestHost, isDemoDomainHost, parseClientPlatformSubdomainSafe } from "@/lib/app-domains";
import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { isDemoCustomerHostRequest } from "@/lib/demo/ea-testing-auth";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const metadata: Metadata = {
  title: "EA Test Suite",
  description: "Executive Assistant automated test suite and board deck preview.",
  robots: { index: false, follow: false },
};

export default async function WorkspaceEaTestingPage() {
  if (await isDemoCustomerHostRequest()) {
    return <NorthstarEaTestingWorkspace />;
  }

  if (await isAbhiCustomerHostRequest()) {
    return <AbhiEaTestingWorkspace />;
  }

  const requestHeaders = await headers();
  const host = getRequestHost({ headers: requestHeaders });
  const hostSlug = parseClientPlatformSubdomainSafe(host);
  if (isDemoDomainHost(host) || hostSlug === DEMO_WORKSPACE_SLUG) {
    return <NorthstarEaTestingWorkspace />;
  }
  if (isAbhiSlug(hostSlug)) {
    return <AbhiEaTestingWorkspace />;
  }

  try {
    const workspace = await requireCurrentWorkspace();
    if (workspace.slug === DEMO_WORKSPACE_SLUG) {
      return <NorthstarEaTestingWorkspace />;
    }
    if (isAbhiSlug(workspace.slug)) {
      return <AbhiEaTestingWorkspace />;
    }
    if (isTalantonImpactSlug(workspace.slug)) {
      return <TalantonEaTestingWorkspace />;
    }
  } catch {
    if (isTalantonImpactSlug(hostSlug)) {
      return <TalantonEaTestingWorkspace />;
    }
  }

  redirect("/dashboard");
}
