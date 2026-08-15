"use client";

import { useCallback, useEffect, useState } from "react";

import type { MarketingBundleResponse } from "@/lib/marketing/client/marketing-api";
import {
  deleteMarketingResource,
  fetchMarketingBundle,
  saveMarketingResource,
  type MarketingResource,
} from "@/lib/marketing/client/marketing-api";

export function useMarketingData() {
  const [bundle, setBundle] = useState<MarketingBundleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const data = await fetchMarketingBundle();
    if (!data) {
      setError("Unable to load marketing data.");
      setBundle(null);
    } else {
      setBundle(data);
    }
    setLoading(false);
    return data;
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(
    async (resource: MarketingResource, payload: Record<string, unknown>) => {
      const item = await saveMarketingResource(resource, payload);
      if (!item) {
        setError(`Failed to save ${resource}.`);
        return null;
      }
      await refresh();
      return item;
    },
    [refresh],
  );

  const remove = useCallback(
    async (resource: MarketingResource, id: string) => {
      const ok = await deleteMarketingResource(resource, id);
      if (!ok) {
        setError(`Failed to delete ${resource}.`);
        return false;
      }
      await refresh();
      return true;
    },
    [refresh],
  );

  return { bundle, loading, error, refresh, save, remove };
}
