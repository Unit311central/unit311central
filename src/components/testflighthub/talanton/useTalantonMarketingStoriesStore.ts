"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  getTalantonMarketingStoriesSnapshot,
  hydrateTalantonMarketingStoriesFromCentralApi,
  subscribeTalantonMarketingStoriesStore,
} from "@/lib/talanton/marketing-stories-store";

let hydrated = false;

export function useTalantonMarketingStoriesStore() {
  useEffect(() => {
    if (hydrated) return;
    hydrated = true;
    void hydrateTalantonMarketingStoriesFromCentralApi();
  }, []);

  return useSyncExternalStore(
    subscribeTalantonMarketingStoriesStore,
    getTalantonMarketingStoriesSnapshot,
    getTalantonMarketingStoriesSnapshot,
  );
}
