"use client";

import { useSyncExternalStore } from "react";

import {
  getQuarterlyPortfolioUpdatesSnapshot,
  subscribeQuarterlyPortfolioUpdates,
} from "@/lib/talanton/quarterly-portfolio-update-store";

export function useQuarterlyPortfolioUpdatesStore() {
  return useSyncExternalStore(
    subscribeQuarterlyPortfolioUpdates,
    getQuarterlyPortfolioUpdatesSnapshot,
    getQuarterlyPortfolioUpdatesSnapshot,
  );
}
