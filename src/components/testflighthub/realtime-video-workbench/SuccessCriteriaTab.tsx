"use client";

import { formatLatencyMs } from "@/lib/realtime-video-pipeline/calculations";
import { MILESTONE_LATENCY_DEFINITIONS } from "@/lib/realtime-video-pipeline/pipeline-terminology";
import type { WorkbenchModel } from "@/lib/realtime-video-pipeline/workbench-types";
import { cn } from "@/lib/utils";

import { LatencyCategoryGuide } from "./PipelineLatencyGuide";
import { contentionTone, criterionTone, fmtNum } from "./shared";

type Props = {
  model: WorkbenchModel;
  onJumpToStage?: (stageId: string) => void;
};

export function SuccessCriteriaTab({ model, onJumpToStage }: Props) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <h3 className="text-sm font-semibold text-white">Success criteria evaluation</h3>
        <p className="mt-1 text-xs text-white/45">
          Targets are engineering requirements. Current values show TBD or calculated results — not
          fabricated pass states.
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-[800px] w-full text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
            <tr>
              <th className="px-3 py-2">Criterion</th>
              <th className="px-3 py-2 text-right">Target</th>
              <th className="px-3 py-2 text-right">Current</th>
              <th className="px-3 py-2 text-right">Headroom</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8">
            {model.criteria.map((row) => (
              <tr key={row.criterion.id}>
                <td className="px-3 py-2 text-white">{row.criterion.label}</td>
                <td className="px-3 py-2 text-right font-mono">
                  {row.targetValue} {row.criterion.unit}
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {row.currentValue != null
                    ? `${formatLatencyMs(row.currentValue)} ${row.criterion.unit}`
                    : "TBD"}
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {row.headroom != null ? fmtNum(row.headroom, 1) : "TBD"}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2 py-0.5 text-[11px]",
                      criterionTone(row.status),
                    )}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {model.latencyContributors.length > 0 ? (
        <div className="rounded-xl border border-white/10 p-4">
          <h3 className="text-sm font-semibold text-white">Latency deep dive — largest contributors</h3>
          <div className="mt-3 space-y-2">
            {model.latencyContributors.map((c, i) => (
              <button
                key={c.stageId}
                type="button"
                className="flex w-full items-center justify-between rounded-lg border border-white/8 bg-black/20 px-3 py-2 text-left hover:bg-white/[0.04]"
                onClick={() => onJumpToStage?.(c.stageId)}
              >
                <span className="text-sm text-white">
                  {i + 1}. {c.component}{" "}
                  <span className="text-white/40">({c.pipelineSection})</span>
                </span>
                <span className="font-mono text-sm text-white/70">
                  {formatLatencyMs(c.latencyMs)} ms · {fmtNum(c.pctOfTotal, 0)}%
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-white">Connectivity headroom</h3>
        <p className="mt-2 text-sm text-white/60">
          Background park consumption: {fmtNum(model.contention.backgroundConsumptionMbps, 1)} Mbps ·
          WOLF upload: {fmtNum(model.contention.wolfRequiredMbps, 1)} Mbps · Headroom:{" "}
          {fmtNum(model.contention.uploadHeadroomMbps, 1)} Mbps
        </p>
        <span
          className={cn(
            "mt-3 inline-flex rounded-full border px-3 py-1 text-xs",
            contentionTone(model.contention.status),
          )}
        >
          {model.contention.status}
        </span>
      </div>
    </div>
  );
}

export function PerformanceTab({ model }: { model: WorkbenchModel }) {
  const s = model.pipeline?.summary;
  if (!s) {
    return <p className="text-sm text-white/50">Link a pipeline scenario to view performance metrics.</p>;
  }
  const metrics = [
    ["rawVideoLatencyMs", s.rawVideoLatencyMs],
    ["aiDetectionLatencyMs", s.aiDetectionLatencyMs],
    ["aiIdentificationLatencyMs", s.aiIdentificationLatencyMs],
    ["aiAnnotatedLatencyMs", s.aiAnnotatedLatencyMs],
    ["totalProcessingMs", s.totalProcessingMs],
    ["totalTransmissionMs", s.totalTransmissionMs],
    ["totalBufferMs", s.totalBufferMs],
    ["totalQueueMs", s.totalQueueMs],
    ["totalAiInferenceMs", s.totalAiInferenceMs],
  ] as const;

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-xs text-white/45">Latency category definitions</p>
        <LatencyCategoryGuide compact />
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map(([key, value]) => {
          const def = MILESTONE_LATENCY_DEFINITIONS[key as keyof typeof MILESTONE_LATENCY_DEFINITIONS];
          return (
            <div
              key={key}
              className="rounded-xl border border-white/10 px-4 py-3"
              title={def?.description}
            >
              <p className="text-[11px] uppercase tracking-wide text-white/40">{def?.label ?? key}</p>
              <p className="mt-1 font-mono text-lg text-white">
                {value == null ? "TBD" : `${formatLatencyMs(value as number)} ms`}
              </p>
              {def ? <p className="mt-1 text-[11px] leading-relaxed text-white/40">{def.description}</p> : null}
            </div>
          );
        })}
        <div className="rounded-xl border border-white/10 px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-white/40">Known minimum</p>
          <p className="mt-1 font-mono text-lg text-white">{formatLatencyMs(s.knownMinimumMs)} ms</p>
        </div>
        <div className="rounded-xl border border-white/10 px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-white/40">Complete latency</p>
          <p className="mt-1 font-mono text-lg text-white">
            {s.completeLatencyMs == null ? "TBD" : `${formatLatencyMs(s.completeLatencyMs)} ms`}
          </p>
        </div>
      </div>
    </div>
  );
}
