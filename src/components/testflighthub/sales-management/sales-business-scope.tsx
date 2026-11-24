"use client";

import { createContext, useCallback, useContext, useSyncExternalStore, type ReactNode } from "react";

import type { SalesBusinessContext } from "@/lib/sales-business-context";
import {
  salesBusinessContextClientSnapshot,
  salesBusinessContextServerSnapshot,
  scopeSalesFetch,
  subscribeSalesBusinessContext,
} from "@/lib/sales-business-context-ui";

const SalesBusinessScopeContext = createContext<SalesBusinessContext | null>(null);

export function SalesBusinessScopeProvider({
  value,
  children,
}: {
  value: SalesBusinessContext | null;
  children: ReactNode;
}) {
  return <SalesBusinessScopeContext.Provider value={value}>{children}</SalesBusinessScopeContext.Provider>;
}

export function useSalesBusinessContextStore(): SalesBusinessContext {
  return useSyncExternalStore(
    subscribeSalesBusinessContext,
    salesBusinessContextClientSnapshot,
    salesBusinessContextServerSnapshot,
  );
}

/** Fetch helper for components rendered inside Sales Management. Outside that tree this is fetch. */
export function useSalesScopedFetch() {
  const context = useContext(SalesBusinessScopeContext);
  return useCallback(
    (input: RequestInfo | URL, init?: RequestInit) => {
      const scoped = scopeSalesFetch(input, init, context);
      return fetch(scoped.input, scoped.init);
    },
    [context],
  );
}
