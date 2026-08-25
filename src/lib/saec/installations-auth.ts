import "server-only";

import { SAEC_SLUG, isSaecSlug } from "@/lib/saec-surface";
import { requirePlatformSession } from "@/lib/platform-session";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export async function requireSaecInstallationsWorkspace() {
  const session = await requirePlatformSession();
  const workspace = await requireCurrentWorkspace();
  if (!isSaecSlug(workspace.slug)) {
    throw new Error("SAEC Installations is only available in the SAEC workspace.");
  }
  return { session, workspace };
}

export function isSaecInstallationsWorkspaceSlug(slug: string | null | undefined): boolean {
  return isSaecSlug(slug);
}

export const SAEC_INSTALLATIONS_WORKSPACE_SLUG = SAEC_SLUG;
