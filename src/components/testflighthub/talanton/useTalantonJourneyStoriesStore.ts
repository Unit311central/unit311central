"use client";

import { useSyncExternalStore } from "react";

import {
  getTalantonJourneyStoriesSnapshot,
  subscribeTalantonJourneyStoriesStore,
} from "@/lib/talanton/journey-stories-store";

export function useTalantonJourneyStoriesStore() {
  return useSyncExternalStore(
    subscribeTalantonJourneyStoriesStore,
    getTalantonJourneyStoriesSnapshot,
    getTalantonJourneyStoriesSnapshot,
  );
}
