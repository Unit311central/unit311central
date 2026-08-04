"use client";

import { useSyncExternalStore } from "react";

import {
  getCompetitorIntelFeedSnapshot,
  subscribeCompetitorIntelFeed,
} from "@/lib/onwardair/competitor-intelligence-feed-store";

export function useCompetitorIntelFeed() {
  return useSyncExternalStore(
    subscribeCompetitorIntelFeed,
    getCompetitorIntelFeedSnapshot,
    getCompetitorIntelFeedSnapshot,
  );
}
