"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  getAbhiMarketingSnapshot,
  hydrateAbhiMarketingFromCentralApi,
  subscribeAbhiMarketingStore,
} from "@/lib/abhi-marketing-store";

let hydrated = false;

export function useAbhiMarketingStore() {
  useEffect(() => {
    if (hydrated) return;
    hydrated = true;
    void hydrateAbhiMarketingFromCentralApi();
  }, []);

  return useSyncExternalStore(
    subscribeAbhiMarketingStore,
    getAbhiMarketingSnapshot,
    getAbhiMarketingSnapshot,
  );
}
