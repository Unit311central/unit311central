"use client";

import { useEffect, useState } from "react";

import { WsInputClass, WsPrimaryButtonClass } from "@/components/testflighthub/domain-workspace-ui";
import type { MissionProfile, WorkbenchConfig, WorkbenchModel } from "@/lib/realtime-video-pipeline/workbench-types";
import { BCN_VALIDATION_STATUS } from "@/lib/realtime-video-pipeline/workbench-reference-data";

import { fmtNum } from "./shared";

type Props = {
  model: WorkbenchModel;
  onSave: (config: WorkbenchConfig) => Promise<void>;
  saving: boolean;
};

export function MissionProfilesTab({ model, onSave, saving }: Props) {
  const [draft, setDraft] = useState(model.config.missionProfiles);

  useEffect(() => {
    setDraft(model.config.missionProfiles);
  }, [model.config.missionProfiles]);

  function updateProfile(slug: string, patch: Partial<MissionProfile>) {
    setDraft((rows) => rows.map((p) => (p.slug === slug ? { ...p, ...patch } : p)));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/55">
        Mission compute profiles drive GPU weighting in the cost calculator. All values are{" "}
        <span className="text-amber-200/90">{BCN_VALIDATION_STATUS}</span>.
      </p>
      <div className="space-y-3">
        {draft.map((profile) => (
          <div key={profile.slug} className="rounded-xl border border-white/10 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-white">{profile.name}</h3>
                <p className="mt-1 text-xs text-white/45">{profile.description}</p>
              </div>
              <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-100">
                {profile.processingIntensity.replace("_", " ")} · {profile.status}
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <label className="text-sm">
                <span className="text-white/45">GPU intensity (0–1)</span>
                <input
                  type="number"
                  step="0.05"
                  min={0}
                  max={1}
                  className={WsInputClass()}
                  value={profile.gpuIntensity}
                  onChange={(e) =>
                    updateProfile(profile.slug, { gpuIntensity: Number(e.target.value) })
                  }
                />
              </label>
              <label className="text-sm">
                <span className="text-white/45">CPU intensity (0–1)</span>
                <input
                  type="number"
                  step="0.05"
                  min={0}
                  max={1}
                  className={WsInputClass()}
                  value={profile.cpuIntensity}
                  onChange={(e) =>
                    updateProfile(profile.slug, { cpuIntensity: Number(e.target.value) })
                  }
                />
              </label>
              <label className="text-sm">
                <span className="text-white/45">Live Mbps</span>
                <input
                  type="number"
                  className={WsInputClass()}
                  value={profile.liveBitrateMbps}
                  onChange={(e) =>
                    updateProfile(profile.slug, { liveBitrateMbps: Number(e.target.value) })
                  }
                />
              </label>
              <label className="text-sm">
                <span className="text-white/45">Inference Hz</span>
                <input
                  type="number"
                  className={WsInputClass()}
                  value={profile.inferenceFrequencyHz}
                  onChange={(e) =>
                    updateProfile(profile.slug, { inferenceFrequencyHz: Number(e.target.value) })
                  }
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-white/40">
              Weighted contribution: GPU {fmtNum(profile.gpuIntensity, 2)} · Live{" "}
              {profile.liveBitrateMbps} Mbps · Sampling {profile.frameSamplingPct}%
            </p>
          </div>
        ))}
      </div>
      <button
        type="button"
        className={WsPrimaryButtonClass(saving)}
        disabled={saving}
        onClick={() => void onSave({ ...model.config, missionProfiles: draft })}
      >
        {saving ? "Saving…" : "Save mission profiles"}
      </button>
    </div>
  );
}
