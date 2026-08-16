"use client";

import { useSyncExternalStore } from "react";

import {
  getNorthstarMinutesServerSnapshot,
  getNorthstarMinutesState,
  subscribeNorthstarMinutes,
  type NorthstarMinutesState,
} from "@/lib/demo/northstar-board-minutes-store";

export function useNorthstarMinutesStore(): NorthstarMinutesState {
  return useSyncExternalStore(
    subscribeNorthstarMinutes,
    getNorthstarMinutesState,
    getNorthstarMinutesServerSnapshot,
  );
}
