import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AbhiEaTestingWorkspace } from "@/components/abhi/AbhiEaTestingWorkspace";
import { TalantonEaTestingWorkspace } from "@/components/talanton/TalantonEaTestingWorkspace";
import { isAbhiSlug } from "@/lib/abhi-surface";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const metadata: Metadata = {
  title: "EA Test Suite",
  description: "Executive Assistant automated test suite and board deck preview.",
  robots: { index: false, follow: false },
};

export default async function WorkspaceEaTestingPage() {
  const workspace = await requireCurrentWorkspace();
  if (isAbhiSlug(workspace.slug)) {
    return <AbhiEaTestingWorkspace />;
  }
  if (isTalantonImpactSlug(workspace.slug)) {
    return <TalantonEaTestingWorkspace />;
  }
  redirect("/dashboard");
}
