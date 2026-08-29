import { registerIntelligencePack } from "@/lib/intelligence/registry";
import type { IntelligenceWorkspacePackRegistration } from "@/lib/intelligence/types";

import { abhiIntelligencePack } from "@/lib/intelligence/workspace-packs/abhi";
import { amanahIntelligencePack } from "@/lib/intelligence/workspace-packs/amanah";
import { customerIntelligencePack } from "@/lib/intelligence/workspace-packs/customer";
import { demoIntelligencePack } from "@/lib/intelligence/workspace-packs/demo";
import { greenDesertIntelligencePack } from "@/lib/intelligence/workspace-packs/greendesert";
import { interfaceWorxIntelligencePack } from "@/lib/intelligence/workspace-packs/interfaceworx";
import { onwardAirIntelligencePack } from "@/lib/intelligence/workspace-packs/onwardair";
import { saecIntelligencePack } from "@/lib/intelligence/workspace-packs/saec";
import { talantonIntelligencePack } from "@/lib/intelligence/workspace-packs/talanton";

/**
 * All workspace intelligence packs.
 * To add FutureWorkspaceX: create workspace-packs/futureworkspacex.ts and append here.
 * Do not add workspace slug branches to L1 registry/provider code.
 */
const INTELLIGENCE_WORKSPACE_PACKS: readonly IntelligenceWorkspacePackRegistration[] = [
  onwardAirIntelligencePack,
  talantonIntelligencePack,
  abhiIntelligencePack,
  saecIntelligencePack,
  demoIntelligencePack,
  interfaceWorxIntelligencePack,
  amanahIntelligencePack,
  greenDesertIntelligencePack,
  customerIntelligencePack,
];

let bootstrapped = false;

export function bootstrapIntelligenceWorkspacePacks(): void {
  if (bootstrapped) return;
  for (const pack of INTELLIGENCE_WORKSPACE_PACKS) {
    registerIntelligencePack(pack);
  }
  bootstrapped = true;
}

/** Test-only — allow re-bootstrap after registry clear. */
export function resetIntelligenceWorkspacePackBootstrapForTests(): void {
  bootstrapped = false;
}

export {
  abhiIntelligencePack,
  amanahIntelligencePack,
  customerIntelligencePack,
  demoIntelligencePack,
  greenDesertIntelligencePack,
  interfaceWorxIntelligencePack,
  onwardAirIntelligencePack,
  saecIntelligencePack,
  talantonIntelligencePack,
};
