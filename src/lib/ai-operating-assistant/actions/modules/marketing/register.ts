import { registerAssistantAction, upsertAssistantAction } from "../../registry";
import { listMarketingNewslettersAction } from "./list-newsletters";

const MARKETING_ACTIONS = [listMarketingNewslettersAction] as const;

let registered = false;

export function registerMarketingActions() {
  for (const action of MARKETING_ACTIONS) {
    try {
      if (registered) upsertAssistantAction(action);
      else registerAssistantAction(action);
    } catch {
      upsertAssistantAction(action);
    }
  }
  registered = true;
  return MARKETING_ACTIONS.length;
}

registerMarketingActions();
