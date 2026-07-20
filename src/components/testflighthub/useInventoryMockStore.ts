"use client";

import { useSyncExternalStore } from "react";

import {
  getInventoryMockSnapshot,
  subscribeInventoryMockStore,
} from "@/lib/inventory-mock-store";

export function useInventoryMockStore() {
  return useSyncExternalStore(
    subscribeInventoryMockStore,
    getInventoryMockSnapshot,
    getInventoryMockSnapshot,
  );
}
