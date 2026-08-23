"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchEngineeringSopRuns, fetchEngineeringSops } from "@/lib/engineering-sop/client-api";
import type { EngSop, EngSopRun, EngSopStatus } from "@/lib/engineering-sop-data";

export function useEngineeringSopLibrary(filters?: { search?: string; status?: EngSopStatus | "All" }) {
  const [sops, setSops] = useState<EngSop[]>([]);
  const [completedRunsBySopId, setCompletedRunsBySopId] = useState<Map<string, EngSopRun>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiAvailable, setApiAvailable] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sopRows, runRows] = await Promise.all([
        fetchEngineeringSops(filters),
        fetchEngineeringSopRuns(false),
      ]);
      setApiAvailable(true);
      setSops(sopRows.filter((s) => !s.isTemplate));
      const runMap = new Map<string, EngSopRun>();
      for (const row of runRows) {
        if (row.status !== "completed" && row.status !== "failed") continue;
        const existing = runMap.get(row.sopId);
        const candidate: EngSopRun = {
          runId: row.id,
          id: row.id,
          sopId: row.sopId,
          sopVersion: row.version,
          startedBy: row.startedBy,
          startedAt: row.startedAt,
          status: row.status as EngSopRun["status"],
          stepStates: [],
          signOff: null,
          completedAt: row.completedAt ?? null,
        };
        if (!existing || (candidate.completedAt ?? "") > (existing.completedAt ?? "")) {
          runMap.set(row.sopId, candidate);
        }
      }
      setCompletedRunsBySopId(runMap);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load engineering SOPs.";
      if (message.includes("not configured") || message.includes("503")) {
        setApiAvailable(false);
      }
      setError(message);
      setSops([]);
      setCompletedRunsBySopId(new Map());
    } finally {
      setLoading(false);
    }
  }, [filters?.search, filters?.status]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { sops, completedRunsBySopId, loading, error, apiAvailable, refresh };
}
