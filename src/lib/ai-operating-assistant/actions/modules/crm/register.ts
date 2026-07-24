import { registerAssistantAction, upsertAssistantAction } from "../../registry";
import { convertLeadToClientAction } from "./convert-lead-to-client";
import { updateLeadStatusAction } from "./update-lead-status";

const CRM_ACTIONS = [updateLeadStatusAction, convertLeadToClientAction] as const;

let registered = false;

export function registerCrmActions() {
  for (const action of CRM_ACTIONS) {
    try {
      if (registered) upsertAssistantAction(action);
      else registerAssistantAction(action);
    } catch {
      upsertAssistantAction(action);
    }
  }
  registered = true;
  return CRM_ACTIONS.length;
}

export function listRegisteredCrmActionIds() {
  return CRM_ACTIONS.map((a) => a.id);
}

registerCrmActions();
