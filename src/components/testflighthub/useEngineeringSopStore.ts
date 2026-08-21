"use client";

import { useSyncExternalStore } from "react";
import {
  getEngineeringSopSnapshot,
  subscribeEngineeringSopStore,
} from "@/lib/engineering-sop-store";

export function useEngineeringSopStore() {
  return useSyncExternalStore(
    subscribeEngineeringSopStore,
    getEngineeringSopSnapshot,
    getEngineeringSopSnapshot,
  );
}
