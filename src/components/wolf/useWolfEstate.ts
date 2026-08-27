"use client";

import { useCallback, useEffect, useState } from "react";

import type { WolfEstateSnapshot } from "@/lib/wolf/central/types";

export function useWolfEstate() {
  const [estate, setEstate] = useState<WolfEstateSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/wolf/estate", { cache: "no-store" });
      const body = (await response.json()) as { estate?: WolfEstateSnapshot; error?: string };
      if (!response.ok) {
        throw new Error(body.error || "Failed to load WOLF estate.");
      }
      setEstate(body.estate ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load WOLF estate.");
      setEstate(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { estate, loading, error, refresh };
}
