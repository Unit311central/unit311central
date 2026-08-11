import { registerAssistantAction, upsertAssistantAction } from "../../registry";
import { updateFundraisingPipelineStageAction } from "./update-pipeline-stage";

const FUNDRAISING_ACTIONS = [updateFundraisingPipelineStageAction] as const;

let registered = false;

export function registerFundraisingActions() {
  for (const action of FUNDRAISING_ACTIONS) {
    try {
      if (registered) upsertAssistantAction(action);
      else registerAssistantAction(action);
    } catch {
      upsertAssistantAction(action);
    }
  }
  registered = true;
  return FUNDRAISING_ACTIONS.length;
}

registerFundraisingActions();
