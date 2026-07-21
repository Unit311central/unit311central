"use client";

import { useSyncExternalStore } from "react";
import {
  getWebsiteMockSnapshot,
  subscribeWebsiteMockStore,
} from "@/lib/website-management-mock-store";

export function useWebsiteMockStore() {
  return useSyncExternalStore(
    subscribeWebsiteMockStore,
    getWebsiteMockSnapshot,
    getWebsiteMockSnapshot,
  );
}
