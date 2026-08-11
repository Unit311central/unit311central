import { registerAssistantAction, upsertAssistantAction } from "../../registry";
import { createSupportTicketAction } from "./create-ticket";

const SUPPORT_ACTIONS = [createSupportTicketAction] as const;

let registered = false;

export function registerSupportActions() {
  for (const action of SUPPORT_ACTIONS) {
    try {
      if (registered) upsertAssistantAction(action);
      else registerAssistantAction(action);
    } catch {
      upsertAssistantAction(action);
    }
  }
  registered = true;
  return SUPPORT_ACTIONS.length;
}

registerSupportActions();
