import { registerAssistantAction, upsertAssistantAction } from "../../registry";
import {
  rescheduleMeetingAction,
  scheduleMeetingAction,
} from "./schedule-meeting";

const CALENDAR_ACTIONS = [scheduleMeetingAction, rescheduleMeetingAction] as const;

let registered = false;

export function registerCalendarActions() {
  for (const action of CALENDAR_ACTIONS) {
    try {
      if (registered) upsertAssistantAction(action);
      else registerAssistantAction(action);
    } catch {
      upsertAssistantAction(action);
    }
  }
  registered = true;
  return CALENDAR_ACTIONS.length;
}

export function listRegisteredCalendarActionIds() {
  return CALENDAR_ACTIONS.map((a) => a.id);
}

registerCalendarActions();
