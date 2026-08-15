import { requireCurrentWorkspace } from "@/lib/workspace-context";

export type MarketingWorkspaceScope = {
  workspaceId?: string | null;
  workspaceSlug?: string | null;
};

export async function resolveMarketingWorkspaceId(
  scope?: MarketingWorkspaceScope,
): Promise<string> {
  const explicit = scope?.workspaceId?.trim();
  if (explicit) return explicit;
  const workspace = await requireCurrentWorkspace();
  return workspace.id;
}

export async function resolveMarketingWorkspaceSlug(
  scope?: MarketingWorkspaceScope,
): Promise<string> {
  const explicit = scope?.workspaceSlug?.trim().toLowerCase();
  if (explicit) return explicit;
  const workspace = await requireCurrentWorkspace();
  return String(workspace.slug ?? "").trim().toLowerCase();
}
