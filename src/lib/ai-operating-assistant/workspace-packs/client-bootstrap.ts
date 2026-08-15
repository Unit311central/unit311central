/**
 * Client-safe workspace pack registration (no tool handlers / server modules).
 */

import { abhiWorkspacePack } from "./abhi-pack";
import { demoWorkspacePack } from "./demo-pack";
import { internalWorkspacePack } from "./internal-pack";
import { onwardAirWorkspacePack } from "./onwardair-pack";
import { registerEaClientWorkspacePack } from "./registry-client";
import { talantonWorkspacePack } from "./talanton-pack";

let clientBootstrapped = false;

export function ensureEaClientWorkspacePacksRegistered(): boolean {
  if (!clientBootstrapped) {
    registerEaClientWorkspacePack(abhiWorkspacePack);
    registerEaClientWorkspacePack(talantonWorkspacePack);
    registerEaClientWorkspacePack(onwardAirWorkspacePack);
    registerEaClientWorkspacePack(demoWorkspacePack);
    registerEaClientWorkspacePack(internalWorkspacePack);
    clientBootstrapped = true;
  }
  return clientBootstrapped;
}
