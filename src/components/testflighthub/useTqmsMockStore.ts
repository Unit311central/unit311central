"use client";

import { useSyncExternalStore } from "react";

import {
  getTqmsMockSnapshot,
  subscribeTqmsMockStore,
} from "@/lib/tqms-mock-store";

export function useTqmsMockStore() {
  return useSyncExternalStore(
    subscribeTqmsMockStore,
    getTqmsMockSnapshot,
    getTqmsMockSnapshot,
  );
}
