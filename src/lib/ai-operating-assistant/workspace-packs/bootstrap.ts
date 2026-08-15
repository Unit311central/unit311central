/**
 * Bootstrap registered EaWorkspacePack instances (idempotent).
 */

import { abhiPackToolHandlers } from "./handlers/abhi";
import { onwardAirPackToolHandlers } from "./handlers/onwardair";
import { talantonPackToolHandlers } from "./handlers/talanton";
import { registerPackToolHandlers } from "./handlers-registry";
import { ensureEaClientWorkspacePacksRegistered } from "./client-bootstrap";

let bootstrapped = false;

export function ensureEaWorkspacePacksRegistered(): boolean {
  ensureEaClientWorkspacePacksRegistered();
  if (!bootstrapped) {
    registerPackToolHandlers(abhiPackToolHandlers);
    registerPackToolHandlers(talantonPackToolHandlers);
    registerPackToolHandlers(onwardAirPackToolHandlers);
    bootstrapped = true;
  }
  return bootstrapped;
}

export function resetEaWorkspacePacksForTests(): void {
  bootstrapped = false;
}

export { ensureEaClientWorkspacePacksRegistered } from "./client-bootstrap";
