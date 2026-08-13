/**
 * Bootstrap registered EaWorkspacePack instances (idempotent).
 */

import { abhiWorkspacePack } from "./abhi-pack";
import { onwardAirWorkspacePack } from "./onwardair-pack";
import { registerEaWorkspacePack } from "./registry";
import { talantonWorkspacePack } from "./talanton-pack";

let bootstrapped = false;

export function ensureEaWorkspacePacksRegistered(): boolean {
  if (!bootstrapped) {
    registerEaWorkspacePack(abhiWorkspacePack);
    registerEaWorkspacePack(talantonWorkspacePack);
    registerEaWorkspacePack(onwardAirWorkspacePack);
    bootstrapped = true;
  }
  return bootstrapped;
}
