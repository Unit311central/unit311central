"use client";

import type { PipelineStage } from "@/lib/realtime-video-pipeline/types";
import { resolveStageLocation } from "@/lib/realtime-video-pipeline/stage-terminology-sync";

export function FailureResilienceTab({
  stages,
  onSelectStage,
}: {
  stages: PipelineStage[];
  onSelectStage?: (stageId: string) => void;
}) {
  const withFailure = stages.filter(
    (s) =>
      s.details.failureImpact ||
      s.details.failureFallback ||
      s.details.failureRecovery ||
      s.enabled,
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/55">
        Failure and recovery behaviour is defined per pipeline stage. Edit stages in{" "}
        <strong className="text-white">Master Pipeline</strong> → stage editor → Technical identity.
        Unknown impacts remain TBD — not invented.
      </p>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-[880px] w-full text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase text-white/45">
            <tr>
              <th className="px-3 py-2">Component</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Impact</th>
              <th className="px-3 py-2">Fallback</th>
              <th className="px-3 py-2">Recovery</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8">
            {withFailure.map((stage) => (
              <tr key={stage.id} className="hover:bg-white/[0.02]">
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="text-left font-medium text-sky-200 hover:underline"
                    onClick={() => onSelectStage?.(stage.id)}
                  >
                    {stage.component}
                  </button>
                </td>
                <td className="px-3 py-2 text-white/55">{resolveStageLocation(stage)}</td>
                <td className="px-3 py-2 text-white/60">{stage.details.failureImpact ?? "TBD"}</td>
                <td className="px-3 py-2 text-white/60">{stage.details.failureFallback ?? "TBD"}</td>
                <td className="px-3 py-2 text-white/60">{stage.details.failureRecovery ?? "TBD"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-white/40">
        Living Architectures → Failure / Resilience view derives from the same stage data.
      </p>
    </div>
  );
}
