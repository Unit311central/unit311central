import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AbhiEaTestingWorkspace } from "@/components/abhi/AbhiEaTestingWorkspace";
import { TalantonEaTestingWorkspace } from "@/components/talanton/TalantonEaTestingWorkspace";
import { isAbhiCustomerHostRequest } from "@/lib/abhi/ea-testing-auth";
import { isAbhiSlug } from "@/lib/abhi-surface";
import { getRequestHost, parseClientPlatformSubdomainSafe } from "@/lib/app-domains";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const metadata: Metadata = {
  title: "EA Test Suite",
  description: "Executive Assistant automated test suite and board deck preview.",
  robots: { index: false, follow: false },
};

export default async function WorkspaceEaTestingPage() {
  if (await isAbhiCustomerHostRequest()) {
    return <AbhiEaTestingWorkspace />;
  }

  const requestHeaders = await headers();
  const hostSlug = parseClientPlatformSubdomainSafe(getRequestHost({ headers: requestHeaders }));
  if (isAbhiSlug(hostSlug)) {
    return <AbhiEaTestingWorkspace />;
  }

  try {
    const workspace = await requireCurrentWorkspace();
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
