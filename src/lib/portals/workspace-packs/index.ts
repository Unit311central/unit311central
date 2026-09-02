import { registerPortalPack } from "@/lib/portals/registry";
import type { PortalWorkspacePack } from "@/lib/portals/types";

import { abhiPortalPack } from "@/lib/portals/workspace-packs/abhi";
import { omnitransitPortalPack } from "@/lib/portals/workspace-packs/omnitransit";
import { onwardAirPortalPack } from "@/lib/portals/workspace-packs/onwardair";
import { talantonPortalPack } from "@/lib/portals/workspace-packs/talanton";
import { wolfCentralPortalPack } from "@/lib/portals/workspace-packs/wolf-central";

/**
 * All workspace external portal packs.
 * To add FutureWorkspaceX: create workspace-packs/futureworkspacex.ts and append here.
 * Do not add workspace slug branches to L1 registry/middleware code.
 */
const PORTAL_WORKSPACE_PACKS: readonly PortalWorkspacePack[] = [
  abhiPortalPack,
  omnitransitPortalPack,
  onwardAirPortalPack,
  talantonPortalPack,
  wolfCentralPortalPack,
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

export {
  abhiPortalPack,
  omnitransitPortalPack,
  onwardAirPortalPack,
  talantonPortalPack,
  wolfCentralPortalPack,
};
