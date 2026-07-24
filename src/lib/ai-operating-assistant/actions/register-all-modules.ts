/**
 * Registers every Action Framework domain module.
 * Orchestration must call this — never hardcode domain NL knowledge here.
 */

import { registerCalendarActions } from "./modules/calendar/register";
import { registerClientsActions } from "./modules/clients/register";
import { registerCrmActions } from "./modules/crm/register";
import { registerProjectsActions } from "./modules/projects/register";
import { validateRegisteredActionCapabilities } from "./capability-validation";
import { buildCapabilityGraph, invalidateCapabilityGraph } from "./capability-service";

let bootstrapped = false;

export function registerAllActionModules() {
  registerClientsActions();
  registerProjectsActions();
  registerCrmActions();
  registerCalendarActions();

  if (!bootstrapped) {
    validateRegisteredActionCapabilities({
      throwOnError: process.env.NODE_ENV !== "production",
    });
    invalidateCapabilityGraph();
    buildCapabilityGraph({ force: true });
    bootstrapped = true;
  }

  return true;
}
