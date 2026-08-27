import "server-only";

import { requirePlatformSession } from "@/lib/platform-session";
import { requireCurrentWorkspace } from "@/lib/workspace-context";
import { isWolfCentralSlug } from "@/lib/wolf/wolf-surface";

export async function requireWolfCentralWorkspace() {
  const session = await requirePlatformSession();
  const workspace = await requireCurrentWorkspace();
  if (!isWolfCentralSlug(workspace.slug)) {
    throw new Error("WOLF Central is only available in the wolf-central workspace.");
  }
  return { session, workspace };
}
