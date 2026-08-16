"use client";

import { useSyncExternalStore } from "react";

import {
  getNorthstarBoardMembersServerSnapshot,
  getNorthstarBoardMembersState,
  subscribeNorthstarBoardMembers,
  type NorthstarBoardMembersState,
} from "@/lib/demo/northstar-board-members-store";

export function useNorthstarBoardMembersStore(): NorthstarBoardMembersState {
  return useSyncExternalStore(
    subscribeNorthstarBoardMembers,
    getNorthstarBoardMembersState,
    getNorthstarBoardMembersServerSnapshot,
  );
}
