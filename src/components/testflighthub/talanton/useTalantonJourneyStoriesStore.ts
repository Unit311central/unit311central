"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  getTalantonJourneyStoriesSnapshot,
  hydrateTalantonJourneyStoriesFromCentralApi,
  subscribeTalantonJourneyStoriesStore,
} from "@/lib/talanton/journey-stories-store";

let hydrated = false;

export function useTalantonJourneyStoriesStore() {
  useEffect(() => {
    if (hydrated) return;
    hydrated = true;
    void hydrateTalantonJourneyStoriesFromCentralApi();
  }, []);

  return useSyncExternalStore(
    subscribeTalantonJourneyStoriesStore,
    getTalantonJourneyStoriesSnapshot,
    getTalantonJourneyStoriesSnapshot,
  );
}
