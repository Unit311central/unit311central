"use client";

import type { PipelineStage } from "@/lib/realtime-video-pipeline/types";
import {
  resolveStageLocation,
  resolveStageProvider,
  resolveStageTechnology,
} from "@/lib/realtime-video-pipeline/stage-terminology-sync";
import { WsInputClass } from "@/components/testflighthub/domain-workspace-ui";
import { cn } from "@/lib/utils";

type Props = {
  stage: PipelineStage;
  onChange: (stage: PipelineStage) => void;
};

function Field({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-white/8 bg-white/[0.02] px-2 py-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">{label}</p>
      <p className="mt-0.5 text-sm text-white/85">{value || "TBD"}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-white/40">{hint}</p> : null}
    </div>
  );
}

export function StageTechnicalIdentity({ stage }: { stage: PipelineStage }) {
  const d = stage.details;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <Field label="Location" value={resolveStageLocation(stage)} />
      <Field label="Provider" value={resolveStageProvider(stage)} />
      <Field label="Technology" value={resolveStageTechnology(stage)} />
      <Field
        label="Architecture status"
        value={d.architectureStatus ?? (stage.measurementStatus === "TBD" ? "TBD" : stage.measurementStatus)}
      />
      <Field label="Input" value={d.inputDescription ?? d.sourceEndpoint ?? "TBD"} />
      <Field label="Output" value={d.outputDescription ?? d.destinationEndpoint ?? "TBD"} />
      <Field label="Protocol" value={d.streamingProtocol ?? d.transportProtocol ?? "TBD"} />
      <Field label="Data format" value={d.dataType ?? "TBD"} />
    </div>
  );
}

export function StageTechnicalEditor({ stage, onChange }: Props) {
  function patchDetails(partial: Partial<PipelineStage["details"]>) {
    onChange({ ...stage, details: { ...stage.details, ...partial } });
  }

  return (
    <div className="space-y-4">
      <StageTechnicalIdentity stage={stage} />

      <details open className="rounded-lg border border-white/10 bg-black/20 p-3">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-white/55">
          Technical identity (editable)
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(
            [
              ["location", "Location"],
              ["provider", "Provider"],
              ["technology", "Technology"],
              ["architectureStatus", "Architecture status"],
              ["inputDescription", "Input"],
              ["outputDescription", "Output"],
              ["streamingProtocol", "Protocol"],
              ["dataType", "Data format"],
              ["dependencies", "Dependencies"],
              ["failureImpact", "Failure impact"],
              ["failureFallback", "Failure fallback"],
              ["failureRecovery", "Failure recovery"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block space-y-1">
              <span className="text-white/50">{label}</span>
              <input
                className={WsInputClass()}
                value={String(stage.details[key] ?? "")}
                onChange={(e) => patchDetails({ [key]: e.target.value || undefined })}
              />
            </label>
          ))}
        </div>
      </details>

      <details className="rounded-lg border border-white/10 bg-black/20 p-3">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-white/55">
          Video characteristics
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(
            [
              ["resolution", "Resolution"],
              ["codec", "Codec"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block space-y-1">
              <span className="text-white/50">{label}</span>
              <input
                className={WsInputClass()}
                value={String(stage.details[key] ?? "")}
                onChange={(e) => patchDetails({ [key]: e.target.value || undefined })}
              />
            </label>
          ))}
          {(
            [
              ["fps", "FPS"],
              ["bitrateMbps", "Bitrate Mbps"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block space-y-1">
              <span className="text-white/50">{label}</span>
              <input
                className={WsInputClass()}
                value={stage.details[key] ?? ""}
                onChange={(e) =>
                  patchDetails({
                    [key]: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </label>
          ))}
        </div>
      </details>

      <details className="rounded-lg border border-white/10 bg-black/20 p-3">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-white/55">
          Network
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(
            [
              ["uploadMbps", "Upload Mbps"],
              ["downloadMbps", "Download Mbps"],
              ["rttMs", "RTT ms"],
              ["jitterMs", "Jitter ms"],
              ["packetLossPct", "Packet loss %"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block space-y-1">
              <span className="text-white/50">{label}</span>
              <input
                className={WsInputClass()}
                value={stage.details[key] ?? ""}
                onChange={(e) =>
                  patchDetails({
                    [key]: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </label>
          ))}
        </div>
      </details>

      <details className="rounded-lg border border-white/10 bg-black/20 p-3">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-white/55">
          Compute &amp; AI
        </summary>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(
            [
              ["aiModel", "AI model"],
              ["gpuModel", "GPU model"],
              ["aiRuntime", "AI runtime"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block space-y-1">
              <span className="text-white/50">{label}</span>
              <input
                className={WsInputClass()}
                value={String(stage.details[key] ?? "")}
                onChange={(e) => patchDetails({ [key]: e.target.value || undefined })}
              />
            </label>
          ))}
          <label className="block space-y-1">
            <span className="text-white/50">GPU VRAM GB</span>
            <input
              className={WsInputClass()}
              value={stage.details.gpuVramGb ?? ""}
              onChange={(e) =>
                patchDetails({
                  gpuVramGb: e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
          </label>
        </div>
      </details>

      <p className={cn("text-xs text-amber-200/75")}>
        Measurement status: {stage.measurementStatus} — TBD values are not treated as zero in
        calculations.
      </p>
    </div>
  );
}
