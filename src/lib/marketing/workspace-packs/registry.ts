import type { MarketingWorkspaceKey } from "@/lib/marketing/workspace-context";

import type { MarketingWorkspacePack } from "./types";
import {
  abhiMarketingPack,
  demoMarketingPack,
  internalMarketingPack,
  onwardAirMarketingPack,
  saecMarketingPack,
  talantonMarketingPack,
} from "./packs";

const packs: MarketingWorkspacePack[] = [];

export function registerMarketingWorkspacePack(pack: MarketingWorkspacePack): void {
  if (packs.some((existing) => existing.id === pack.id)) return;
  packs.push(pack);
}

export function listMarketingWorkspacePacks(): readonly MarketingWorkspacePack[] {
  return packs;
}

export function getMarketingWorkspacePack(
  workspaceKey: MarketingWorkspaceKey,
): MarketingWorkspacePack | null {
  return packs.find((pack) => pack.workspaceKeys.includes(workspaceKey)) ?? null;
}

let bootstrapped = false;

export function ensureMarketingWorkspacePacksRegistered(): boolean {
  if (!bootstrapped) {
    registerMarketingWorkspacePack(internalMarketingPack);
    registerMarketingWorkspacePack(demoMarketingPack);
    registerMarketingWorkspacePack(onwardAirMarketingPack);
    registerMarketingWorkspacePack(talantonMarketingPack);
    registerMarketingWorkspacePack(abhiMarketingPack);
    registerMarketingWorkspacePack(saecMarketingPack);
    bootstrapped = true;
  }
  return bootstrapped;
}

export function resetMarketingWorkspacePacksForTests() {
  packs.length = 0;
  bootstrapped = false;
}
