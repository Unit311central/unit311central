"use client";

import { useSyncExternalStore } from "react";
import {
  getEngineeringMockSnapshot,
  subscribeEngineeringMockStore,
} from "@/lib/engineering-mock-store";

export function useEngineeringMockStore() {
  return useSyncExternalStore(
    subscribeEngineeringMockStore,
    getEngineeringMockSnapshot,
    getEngineeringMockSnapshot,
  );
}
