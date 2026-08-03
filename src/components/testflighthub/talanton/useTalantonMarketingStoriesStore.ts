"use client";

import { useSyncExternalStore } from "react";

import {
  getTalantonMarketingStoriesSnapshot,
  subscribeTalantonMarketingStoriesStore,
} from "@/lib/talanton/marketing-stories-store";

export function useTalantonMarketingStoriesStore() {
  return useSyncExternalStore(
    subscribeTalantonMarketingStoriesStore,
    getTalantonMarketingStoriesSnapshot,
    getTalantonMarketingStoriesSnapshot,
  );
}
