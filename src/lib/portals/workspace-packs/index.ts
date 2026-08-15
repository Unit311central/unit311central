import { registerPortalPack } from "@/lib/portals/registry";
import type { PortalWorkspacePack } from "@/lib/portals/types";

import { abhiPortalPack } from "@/lib/portals/workspace-packs/abhi";
import { onwardAirPortalPack } from "@/lib/portals/workspace-packs/onwardair";
import { talantonPortalPack } from "@/lib/portals/workspace-packs/talanton";

/**
 * All workspace external portal packs.
 * To add FutureWorkspaceX: create workspace-packs/futureworkspacex.ts and append here.
 * Do not add workspace slug branches to L1 registry/middleware code.
 */
const PORTAL_WORKSPACE_PACKS: readonly PortalWorkspacePack[] = [
  abhiPortalPack,
  onwardAirPortalPack,
  talantonPortalPack,
];

let bootstrapped = false;

export function bootstrapPortalWorkspacePacks(): void {
  if (bootstrapped) return;
  for (const pack of PORTAL_WORKSPACE_PACKS) {
    registerPortalPack(pack);
  }
  bootstrapped = true;
}

/** Test-only — allow re-bootstrap after registry clear. */
export function resetPortalWorkspacePackBootstrapForTests(): void {
  bootstrapped = false;
}

export { abhiPortalPack, onwardAirPortalPack, talantonPortalPack };
