/**
 * Registers every Action Framework domain module.
 * Orchestration must call this — never hardcode domain NL knowledge here.
 */

import { registerBoardActions } from "./modules/board/register";
import { registerCalendarActions } from "./modules/calendar/register";
import { registerClientsActions } from "./modules/clients/register";
import { registerCrmActions } from "./modules/crm/register";
import { registerEngineeringActions } from "./modules/engineering/register";
import { registerFinanceActions } from "./modules/finance/register";
import { registerFundraisingActions } from "./modules/fundraising/register";
import { registerProjectsActions } from "./modules/projects/register";
import { registerSupportActions } from "./modules/support/register";
import { validateRegisteredActionCapabilities } from "./capability-validation";
import { buildCapabilityGraph, invalidateCapabilityGraph } from "./capability-service";

let bootstrapped = false;

export function registerAllActionModules() {
  registerClientsActions();
  registerProjectsActions();
  registerCrmActions();
  registerCalendarActions();
  registerFinanceActions();
  registerFundraisingActions();
  registerBoardActions();
  registerEngineeringActions();
  registerSupportActions();

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
