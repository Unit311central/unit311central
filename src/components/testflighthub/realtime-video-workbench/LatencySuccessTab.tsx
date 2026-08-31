"use client";

import { useEffect, useState } from "react";

import { WsInputClass, WsPrimaryButtonClass } from "@/components/testflighthub/domain-workspace-ui";
import type { SuccessCriterion, WorkbenchConfig, WorkbenchModel } from "@/lib/realtime-video-pipeline/workbench-types";

import { PerformanceTab, SuccessCriteriaTab } from "./SuccessCriteriaTab";

export function LatencySuccessTab({
  model,
  onSave,
  saving,
  onJumpToStage,
}: {
  model: WorkbenchModel;
  onSave: (config: WorkbenchConfig) => Promise<void>;
  saving: boolean;
  onJumpToStage?: (stageId: string) => void;
}) {
  const [criteriaDraft, setCriteriaDraft] = useState<SuccessCriterion[]>(model.config.successCriteria);

  useEffect(() => {
    setCriteriaDraft(model.config.successCriteria);
  }, [model.config.successCriteria]);

  function updateCriterion(id: string, targetValue: number) {
    setCriteriaDraft((rows) =>
      rows.map((c) => (c.id === id ? { ...c, targetValue } : c)),
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">Performance &amp; latency model</h2>
        <PerformanceTab model={model} />
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">Success criteria evaluation</h2>
        <SuccessCriteriaTab model={model} onJumpToStage={onJumpToStage} />
      </section>
      <section className="rounded-xl border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-white">Edit acceptance targets</h3>
        <p className="mt-1 text-xs text-white/45">
          Changing targets recalculates PASS / WARNING / FAIL immediately after save.
        </p>
        <div className="mt-4 space-y-3">
          {criteriaDraft.map((c) => (
            <label key={c.id} className="flex flex-wrap items-center gap-3 text-sm">
              <span className="min-w-[12rem] text-white/70">{c.label}</span>
              <input
                type="number"
                className={WsInputClass()}
                value={c.targetValue}
                onChange={(e) => updateCriterion(c.id, Number(e.target.value))}
              />
              <span className="text-white/40">{c.unit}</span>
            </label>
          ))}
        </div>
        <button
          type="button"
          className={WsPrimaryButtonClass(saving)}
          disabled={saving}
          onClick={() => void onSave({ ...model.config, successCriteria: criteriaDraft })}
        >
          {saving ? "Saving…" : "Save criteria targets"}
        </button>
      </section>
    </div>
  );
}
