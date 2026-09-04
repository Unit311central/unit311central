import { NextResponse } from "next/server";

import { requireInterfaceWorxWorkspaceSession } from "@/lib/interface-worx-information-repository-auth";
import { isWolfCentralSlug } from "@/lib/wolf/wolf-surface";

export async function requireWolfInformationRepositoryArchitectureSession() {
  const auth = await requireInterfaceWorxWorkspaceSession();
  if ("error" in auth) return auth;

  if (!isWolfCentralSlug(auth.workspace.slug)) {
    return {
      error: NextResponse.json(
        { error: "Architecture diagrams are only available in the WOLF Central workspace." },
        { status: 403 },
      ),
    };
  }

  return auth;
}
