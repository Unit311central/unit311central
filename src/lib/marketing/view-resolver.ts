import type { InternalOperationsView } from "@/lib/internal-operations-data";
import { isMarketingModuleView } from "@/lib/marketing/views";
import {
  ensureMarketingWorkspacePacksRegistered,
  getMarketingWorkspacePack,
} from "@/lib/marketing/workspace-packs";
import type {
  MarketingResolveContext,
  MarketingViewResolution,
} from "@/lib/marketing/workspace-packs/types";
import { MARKETING_RENDERER_IDS } from "@/lib/marketing/workspace-packs/types";
import {
  resolveMarketingWorkspaceKey,
  type MarketingWorkspaceKey,
} from "@/lib/marketing/workspace-context";

export type ResolveMarketingViewInput = {
  view: InternalOperationsView;
  workspaceKey?: MarketingWorkspaceKey;
  workspaceSlug?: string | null;
};

/**
 * Registry-based Marketing & Events view resolver.
 * Returns null when the view is not part of the marketing module.
 */
export function resolveMarketingView(
  input: ResolveMarketingViewInput,
): MarketingViewResolution | null {
  if (!isMarketingModuleView(input.view)) return null;

  ensureMarketingWorkspacePacksRegistered();

  const workspaceKey =
    input.workspaceKey ?? resolveMarketingWorkspaceKey(input.workspaceSlug ?? null);

  const ctx: MarketingResolveContext = {
    workspaceKey,
    workspaceSlug: input.workspaceSlug ?? null,
  };

  const pack = getMarketingWorkspacePack(workspaceKey);
  if (!pack) {
    return {
      rendererId: MARKETING_RENDERER_IDS.UNAVAILABLE,
      unavailableTitle: "Marketing & Events",
      unavailableMessage: `No Marketing workspace pack is registered for “${workspaceKey}”.`,
    };
  }

  const resolution = pack.resolveView(input.view, ctx);
  if (resolution) return resolution;

  return {
    rendererId: MARKETING_RENDERER_IDS.UNAVAILABLE,
    unavailableTitle: "Marketing & Events",
    unavailableMessage: `“${input.view}” is not available on the ${pack.label} workspace.`,
  };
}

/** Test helper — expected renderer per workspace/view without browser host. */
export function resolveMarketingViewForWorkspace(
  view: InternalOperationsView,
  workspaceKey: MarketingWorkspaceKey,
): MarketingViewResolution | null {
  return resolveMarketingView({ view, workspaceKey });
}
