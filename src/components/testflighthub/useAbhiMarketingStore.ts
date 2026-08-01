"use client";

import { useSyncExternalStore } from "react";

import {
  getAbhiMarketingSnapshot,
  subscribeAbhiMarketingStore,
} from "@/lib/abhi-marketing-store";

export function useAbhiMarketingStore() {
  return useSyncExternalStore(
    subscribeAbhiMarketingStore,
    getAbhiMarketingSnapshot,
    getAbhiMarketingSnapshot,
  );
}
