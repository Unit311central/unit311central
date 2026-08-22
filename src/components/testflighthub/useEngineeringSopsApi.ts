"use client";

import { useCallback, useEffect, useState } from "react";

import type { EngineeringSopDashboard, EngineeringSopReport, EngineeringSopTaskItem } from "@/lib/engineering-sop/types";
import type { EngSop } from "@/lib/engineering-sop-data";

type RunSummary = EngineeringSopDashboard["activeRuns"][number] & { id: string };

export function useEngineeringSopsApi() {
  const [dashboard, setDashboard] = useState<EngineeringSopDashboard | null>(null);
  const [tasks, setTasks] = useState<EngineeringSopTaskItem[]>([]);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [templates, setTemplates] = useState<EngSop[]>([]);
  const [report, setReport] = useState<EngineeringSopReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, taskRes, runRes, tplRes, reportRes] = await Promise.all([
        fetch("/api/engineering/sops/dashboard", { cache: "no-store" }),
        fetch("/api/engineering/sops/tasks", { cache: "no-store" }),
        fetch("/api/engineering/sops/runs?active=false", { cache: "no-store" }),
        fetch("/api/engineering/sops/templates", { cache: "no-store" }),
        fetch("/api/engineering/sops/reports", { cache: "no-store" }),
      ]);
      if ([dashRes, taskRes, runRes, tplRes, reportRes].some((r) => r.status === 503)) {
        setApiAvailable(false);
        return;
      }
      setApiAvailable(true);
      if (dashRes.ok) setDashboard(((await dashRes.json()) as { dashboard: EngineeringSopDashboard }).dashboard);
      if (taskRes.ok) setTasks(((await taskRes.json()) as { tasks: EngineeringSopTaskItem[] }).tasks);
      if (runRes.ok) setRuns(((await runRes.json()) as { runs: RunSummary[] }).runs);
      if (tplRes.ok) setTemplates(((await tplRes.json()) as { templates: EngSop[] }).templates);
      if (reportRes.ok) setReport(((await reportRes.json()) as { report: EngineeringSopReport }).report);
    } catch {
      setApiAvailable(false);
    } finally {
      setLoading(false);
    }
  }, []);

  return { dashboard, tasks, runs, templates, report, loading, apiAvailable, refresh };
}
