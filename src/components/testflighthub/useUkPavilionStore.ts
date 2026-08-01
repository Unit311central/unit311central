"use client";

import { useSyncExternalStore } from "react";

import {
  getUkPavilionState,
  subscribeUkPavilion,
  type UkPavilionState,
} from "@/lib/abhi-uk-pavilion-store";

export function useUkPavilionStore(): UkPavilionState {
  return useSyncExternalStore(subscribeUkPavilion, getUkPavilionState, getUkPavilionState);
}
