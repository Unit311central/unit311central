"use client";

import { cn } from "@/lib/utils";
import type { PipelineScenario } from "@/lib/realtime-video-pipeline/types";
import { resolveScenarioPresentation } from "@/lib/realtime-video-pipeline/workbench-scenario-presentation";
import { WsInputClass, WsSecondaryButtonClass } from "@/components/testflighthub/domain-workspace-ui";

type Props = {
  scenarios: PipelineScenario[];
  scenarioId: string | null;
  onScenarioChange: (id: string) => void;
  onDuplicate: () => void;
  className?: string;
};

export function ScenarioContextBar({
  scenarios,
  scenarioId,
  onScenarioChange,
  onDuplicate,
  className,
}: Props) {
  const selected = scenarios.find((s) => s.id === scenarioId) ?? null;
  const presentation = selected ? resolveScenarioPresentation(selected) : null;

  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Current scenario
          </p>
          <select
            className={cn(WsInputClass(), "w-full max-w-2xl")}
            value={scenarioId ?? ""}
            onChange={(e) => onScenarioChange(e.target.value)}
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {selected && presentation ? (
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
                  Type
                </dt>
                <dd className="mt-1 text-sm text-white/85">{presentation.typeLabel}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
                  Status
                </dt>
                <dd className="mt-1 text-sm text-amber-100/90">{presentation.statusLabel}</dd>
              </div>
            </dl>
          ) : null}
        </div>
        <button type="button" className={WsSecondaryButtonClass()} onClick={onDuplicate}>
          Duplicate version
        </button>
      </div>
    </div>
  );
}
