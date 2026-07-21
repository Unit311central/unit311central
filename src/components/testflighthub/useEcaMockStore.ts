"use client";

import { useSyncExternalStore } from "react";
import {
  getEcaMockSnapshot,
  subscribeEcaMockStore,
} from "@/lib/external-client-access-mock-store";

export function useEcaMockStore() {
  return useSyncExternalStore(
    subscribeEcaMockStore,
    getEcaMockSnapshot,
    getEcaMockSnapshot,
  );
}
