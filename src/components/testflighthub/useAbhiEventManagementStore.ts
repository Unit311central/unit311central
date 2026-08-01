"use client";

import { useSyncExternalStore } from "react";

import {
  getAbhiEventManagementSnapshot,
  subscribeAbhiEventManagementStore,
} from "@/lib/abhi-event-management-store";

export function useAbhiEventManagementStore() {
  return useSyncExternalStore(
    subscribeAbhiEventManagementStore,
    getAbhiEventManagementSnapshot,
    getAbhiEventManagementSnapshot,
  );
}
