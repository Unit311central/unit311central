import "server-only";

import { getAbhiRequestMeetings } from "@/lib/abhi/abhi-request-org-state";
import {
  getAbhiBoardMeetingsServerSnapshot as getAbhiBoardMeetingsSeedSnapshot,
  type AbhiBoardMeetingsState,
} from "@/lib/abhi/board-meetings-store";

/** Server snapshot — prefers EA request org-state overlay when present. */
export function getAbhiBoardMeetingsServerSnapshot(): AbhiBoardMeetingsState {
  const overlay = getAbhiRequestMeetings();
  if (overlay?.meetings?.length) return overlay;
  return getAbhiBoardMeetingsSeedSnapshot();
}
