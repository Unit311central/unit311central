"use client";

import { useSyncExternalStore } from "react";

import {
  getNorthstarBoardMeetingsServerSnapshot,
  getNorthstarBoardMeetingsState,
  subscribeNorthstarBoardMeetings,
  type NorthstarBoardMeetingsState,
} from "@/lib/demo/northstar-board-meetings-store";

export function useNorthstarBoardMeetingsStore(): NorthstarBoardMeetingsState {
  return useSyncExternalStore(
    subscribeNorthstarBoardMeetings,
    getNorthstarBoardMeetingsState,
    getNorthstarBoardMeetingsServerSnapshot,
  );
}
