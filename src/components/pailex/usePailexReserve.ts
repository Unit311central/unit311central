"use client";

import { useCallback, useEffect, useState } from "react";

import type { PailexReserveSnapshot } from "@/lib/pailex/pailex-reserve-service";

export function usePailexReserve() {
  const [snapshot, setSnapshot] = useState<PailexReserveSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/pailex/reserve", { cache: "no-store" });
      const body = (await response.json()) as { snapshot?: PailexReserveSnapshot; error?: string };
      if (!response.ok) {
        throw new Error(body.error || "Failed to load PAILEX reserve.");
      }
      setSnapshot(body.snapshot ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load PAILEX reserve.");
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { snapshot, loading, error, refresh };
}
