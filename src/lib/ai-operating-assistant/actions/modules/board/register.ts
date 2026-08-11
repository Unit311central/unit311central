import { registerAssistantAction, upsertAssistantAction } from "../../registry";
import { createBoardActionAction } from "./create-board-action";

const BOARD_ACTIONS = [createBoardActionAction] as const;

let registered = false;

export function registerBoardActions() {
  for (const action of BOARD_ACTIONS) {
    try {
      if (registered) upsertAssistantAction(action);
      else registerAssistantAction(action);
    } catch {
      upsertAssistantAction(action);
    }
  }
  registered = true;
  return BOARD_ACTIONS.length;
}

registerBoardActions();
