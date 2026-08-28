import "server-only";

import { requirePlatformSession } from "@/lib/platform-session";
import { requireCurrentWorkspace } from "@/lib/workspace-context";
import { isPailexSlug } from "@/lib/pailex/pailex-surface";

export async function requirePailexWorkspace() {
  const session = await requirePlatformSession();
  const workspace = await requireCurrentWorkspace();
  if (!isPailexSlug(workspace.slug)) {
    throw new Error("PAILEX workspace is only available on the pailex customer deployment.");
  }
  return { session, workspace };
}
