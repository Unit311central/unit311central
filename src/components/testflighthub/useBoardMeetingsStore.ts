"use client";

import { useSyncExternalStore } from "react";

import {
  getAbhiBoardMeetingsServerSnapshot,
  getAbhiBoardMeetingsState,
  subscribeAbhiBoardMeetings,
  type AbhiBoardMeetingsState,
} from "@/lib/abhi/board-meetings-store";

export function useBoardMeetingsStore(): AbhiBoardMeetingsState {
  return useSyncExternalStore(
    subscribeAbhiBoardMeetings,
    getAbhiBoardMeetingsState,
    getAbhiBoardMeetingsServerSnapshot,
  );
}
