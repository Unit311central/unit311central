"use client";

import { formatLatencyMs } from "@/lib/realtime-video-pipeline/calculations";
import type { WorkbenchModel } from "@/lib/realtime-video-pipeline/workbench-types";
import { cn } from "@/lib/utils";

import { contentionTone, criterionTone, fmtNum } from "./shared";

type Props = {
  model: WorkbenchModel;
  onJumpToStage?: (stageId: string) => void;
};

export function SuccessCriteriaTab({ model, onJumpToStage }: Props) {
  return (
    <div className="space-y-5">
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
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {[
        ["Raw video latency", s.rawVideoLatencyMs],
        ["AI detection latency", s.aiDetectionLatencyMs],
        ["AI identification latency", s.aiIdentificationLatencyMs],
        ["AI annotated latency", s.aiAnnotatedLatencyMs],
        ["Total processing", s.totalProcessingMs],
        ["Total transmission", s.totalTransmissionMs],
        ["Total buffering", s.totalBufferMs],
        ["Total queue", s.totalQueueMs],
        ["Total AI inference", s.totalAiInferenceMs],
        ["Known minimum", s.knownMinimumMs],
        ["Complete latency", s.completeLatencyMs],
      ].map(([label, value]) => (
        <div key={label as string} className="rounded-xl border border-white/10 px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-white/40">{label as string}</p>
          <p className="mt-1 font-mono text-lg text-white">
            {value == null ? "TBD" : `${formatLatencyMs(value as number)} ms`}
          </p>
        </div>
      ))}
    </div>
  );
}
