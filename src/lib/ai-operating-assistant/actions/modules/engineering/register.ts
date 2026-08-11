import { registerAssistantAction, upsertAssistantAction } from "../../registry";
import { logEngineeringRiskAction } from "./log-risk";

const ENGINEERING_ACTIONS = [logEngineeringRiskAction] as const;

let registered = false;

export function registerEngineeringActions() {
  for (const action of ENGINEERING_ACTIONS) {
    try {
      if (registered) upsertAssistantAction(action);
      else registerAssistantAction(action);
    } catch {
      upsertAssistantAction(action);
    }
  }
  registered = true;
  return ENGINEERING_ACTIONS.length;
}

registerEngineeringActions();
