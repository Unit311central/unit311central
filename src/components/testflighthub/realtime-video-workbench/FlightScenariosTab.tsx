"use client";

import { useEffect, useState } from "react";

import {
  BCN_REFERENCE_CAMERA_LABEL,
  BCN_REFERENCE_CONFIG_STATUS,
  BCN_REFERENCE_LIVE_STREAM_LABEL,
  BCN_VALIDATION_STATUS,
  ORYX_AIRCRAFT_NAME,
} from "@/lib/realtime-video-pipeline/workbench-reference-data";
import type { WorkbenchConfig, WorkbenchModel } from "@/lib/realtime-video-pipeline/workbench-types";
import { WsInputClass, WsPrimaryButtonClass } from "@/components/testflighthub/domain-workspace-ui";

import { fmtNum } from "./shared";

type Props = {
  model: WorkbenchModel;
  onSave: (config: WorkbenchConfig) => Promise<void>;
  saving: boolean;
};

export function FlightScenariosTab({ model, onSave, saving }: Props) {
  const [draft, setDraft] = useState<WorkbenchConfig>(model.config);

  useEffect(() => {
    setDraft(model.config);
  }, [model.config]);

  function patch(partial: Partial<WorkbenchConfig>) {
    setDraft((current) => ({ ...current, ...partial }));
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <h3 className="text-sm font-semibold text-white">{model.flightScenario.name}</h3>
        <p className="mt-1 text-sm text-white/50">{model.flightScenario.description}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="block space-y-1 text-sm">
            <span className="text-white/45">Location</span>
            <input
              className={WsInputClass()}
              value={draft.location}
              onChange={(e) => patch({ location: e.target.value })}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-white/45">Days / week</span>
            <input
              type="number"
              className={WsInputClass()}
              value={draft.daysPerWeek}
              onChange={(e) => patch({ daysPerWeek: Number(e.target.value) })}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-white/45">Days / month</span>
            <input
              type="number"
              className={WsInputClass()}
              value={draft.daysPerMonth}
              onChange={(e) => patch({ daysPerMonth: Number(e.target.value) })}
            />
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-white">Flight schedule</h3>
        <div className="mt-3 space-y-2">
          {draft.flightSchedule.map((leg) => (
            <div key={leg.id} className="grid gap-2 rounded-lg border border-white/8 p-3 md:grid-cols-4">
              <input
                className={WsInputClass()}
                value={leg.label}
                onChange={(e) =>
                  patch({
                    flightSchedule: draft.flightSchedule.map((l) =>
                      l.id === leg.id ? { ...l, label: e.target.value } : l,
                    ),
                  })
                }
              />
              <input
                type="number"
                className={WsInputClass()}
                value={leg.durationHours}
                onChange={(e) =>
                  patch({
                    flightSchedule: draft.flightSchedule.map((l) =>
                      l.id === leg.id ? { ...l, durationHours: Number(e.target.value) } : l,
                    ),
                  })
                }
                aria-label="Duration hours"
              />
              <select
                className={WsInputClass()}
                value={leg.missionProfileSlug}
                onChange={(e) =>
                  patch({
                    flightSchedule: draft.flightSchedule.map((l) =>
                      l.id === leg.id ? { ...l, missionProfileSlug: e.target.value } : l,
                    ),
                  })
                }
              >
                {draft.missionProfiles.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className={WsInputClass()}
                value={leg.gapAfterHours}
                onChange={(e) =>
                  patch({
                    flightSchedule: draft.flightSchedule.map((l) =>
                      l.id === leg.id ? { ...l, gapAfterHours: Number(e.target.value) } : l,
                    ),
                  })
                }
                aria-label="Gap after hours"
              />
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-white/40">
          Total {fmtNum(model.schedule.flightHoursPerDay, 1)} flight-hours / day ·{" "}
          {model.schedule.flightsPerDay} flights (updates after save)
        </p>
      </div>

      <div className="rounded-xl border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-white">Aircraft &amp; video profile</h3>
        <p className="mt-1 text-xs text-white/45">
          Recording and live-stream bitrates are modelled separately. Values below are reference
          assumptions until validated with BCN.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-white/8 bg-black/20 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">Aircraft</p>
            <p className="mt-1 text-lg font-semibold text-white">{ORYX_AIRCRAFT_NAME}</p>
          </div>
          <div className="rounded-lg border border-amber-400/20 bg-amber-500/5 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">Status</p>
            <p className="mt-1 text-sm text-amber-100/90">{BCN_REFERENCE_CONFIG_STATUS}</p>
          </div>
          <div className="rounded-lg border border-white/8 bg-black/20 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">Camera</p>
            <p className="mt-1 text-sm text-white/80">{BCN_REFERENCE_CAMERA_LABEL}</p>
            <p className="mt-0.5 text-xs text-white/45">
              {draft.videoProfile.recordingResolution} · {draft.videoProfile.recordingFps} FPS ·{" "}
              {draft.videoProfile.recordingCodec}
            </p>
          </div>
          <div className="rounded-lg border border-white/8 bg-black/20 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
              Live stream
            </p>
            <p className="mt-1 text-sm text-white/80">{BCN_REFERENCE_LIVE_STREAM_LABEL}</p>
            <p className="mt-0.5 text-xs text-white/45">
              {draft.videoProfile.liveStreamResolution} · {draft.videoProfile.liveStreamFps} FPS ·{" "}
              {draft.videoProfile.liveStreamCodec}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-amber-200/80">{BCN_VALIDATION_STATUS}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="text-sm">
            <span className="text-white/45">Max recording Mbps</span>
            <input
              type="number"
              className={WsInputClass()}
              value={draft.videoProfile.maxRecordingBitrateMbps}
              onChange={(e) =>
                patch({
                  videoProfile: {
                    ...draft.videoProfile,
                    droneModel: ORYX_AIRCRAFT_NAME,
                    maxRecordingBitrateMbps: Number(e.target.value),
                    maxRecordingBitrateStatus: "User Input",
                  },
                })
              }
            />
          </label>
          <label className="text-sm">
            <span className="text-white/45">Operational flight min</span>
            <input
              type="number"
              className={WsInputClass()}
              value={draft.videoProfile.operationalFlightTimeMin}
              onChange={(e) =>
                patch({
                  videoProfile: {
                    ...draft.videoProfile,
                    droneModel: ORYX_AIRCRAFT_NAME,
                    operationalFlightTimeMin: Number(e.target.value),
                  },
                })
              }
            />
          </label>
          <label className="text-sm">
            <span className="text-white/45">Live stream Mbps</span>
            <input
              type="number"
              className={WsInputClass()}
              value={draft.videoProfile.liveStreamBitrateMbps}
              onChange={(e) => {
                const old = draft.videoProfile.liveStreamBitrateMbps;
                const newVal = Number(e.target.value);
                const ratio = old > 0 ? newVal / old : 1;
                patch({
                  videoProfile: {
                    ...draft.videoProfile,
                    droneModel: ORYX_AIRCRAFT_NAME,
                    liveStreamBitrateMbps: newVal,
                    liveStreamBitrateStatus: "User Input",
                  },
                  missionProfiles: draft.missionProfiles.map((p) => ({
                    ...p,
                    liveBitrateMbps: Number((p.liveBitrateMbps * ratio).toFixed(2)),
                  })),
                });
              }}
            />
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-white">Park connectivity contention</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {(
            [
              ["guestCapacity", "Guest capacity"],
              ["concurrentGuestPct", "Concurrent guest %"],
              ["avgGuestBandwidthMbps", "Avg guest Mbps"],
              ["staffCount", "Staff count"],
              ["operationalTrafficMbps", "Operational Mbps"],
              ["safetyHeadroomPct", "Safety headroom %"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="text-sm">
              <span className="text-white/45">{label}</span>
              <input
                type="number"
                className={WsInputClass()}
                value={draft.parkContention[key]}
                onChange={(e) =>
                  patch({
                    parkContention: {
                      ...draft.parkContention,
                      [key]: Number(e.target.value),
                    },
                  })
                }
              />
            </label>
          ))}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="text-sm">
            <span className="text-white/45">Upload Mbps (reference)</span>
            <input
              type="number"
              className={WsInputClass()}
              value={draft.connectivity.uploadMbps}
              onChange={(e) =>
                patch({
                  connectivity: { ...draft.connectivity, uploadMbps: Number(e.target.value) },
                })
              }
            />
          </label>
          <label className="text-sm">
            <span className="text-white/45">Download Mbps (reference)</span>
            <input
              type="number"
              className={WsInputClass()}
              value={draft.connectivity.downloadMbps}
              onChange={(e) =>
                patch({
                  connectivity: { ...draft.connectivity, downloadMbps: Number(e.target.value) },
                })
              }
            />
          </label>
          <label className="text-sm">
            <span className="text-white/45">Starlink tier</span>
            <select
              className={WsInputClass()}
              value={draft.activeConnectivityTier}
              onChange={(e) => {
                const tier = e.target.value as typeof draft.activeConnectivityTier;
                patch({
                  activeConnectivityTier: tier,
                  connectivity: draft.connectivityTiers[tier],
                });
              }}
            >
              <option value="conservative">Conservative</option>
              <option value="reference">Reference</option>
              <option value="optimistic">Optimistic</option>
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-white">GPU configuration</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="text-sm">
            <span className="text-white/45">Model</span>
            <select
              className={WsInputClass()}
              value={draft.gpuConfig.model}
              onChange={(e) => {
                const alt = draft.gpuAlternatives.find((g) => g.model === e.target.value);
                if (alt) patch({ gpuConfig: alt });
              }}
            >
              {draft.gpuAlternatives.map((g) => (
                <option key={g.model} value={g.model}>
                  {g.model}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="text-white/45">Hourly USD</span>
            <input
              type="number"
              step="0.01"
              className={WsInputClass()}
              value={draft.gpuConfig.hourlyPriceUsd ?? ""}
              onChange={(e) =>
                patch({
                  gpuConfig: {
                    ...draft.gpuConfig,
                    hourlyPriceUsd: e.target.value === "" ? null : Number(e.target.value),
                    hourlyPriceStatus: "User Input",
                  },
                })
              }
            />
          </label>
          <label className="text-sm">
            <span className="text-white/45">Architecture mode</span>
            <select
              className={WsInputClass()}
              value={draft.architectureMode}
              onChange={(e) =>
                patch({
                  architectureMode: e.target.value as typeof draft.architectureMode,
                })
              }
            >
              <option value="cloud">Cloud processing</option>
              <option value="edge_cloud">Edge + Cloud AI</option>
              <option value="on_site">On-site processing</option>
            </select>
          </label>
        </div>
        <p className="mt-2 text-xs text-white/45">{draft.gpuConfig.source}</p>
      </div>

      <button
        type="button"
        className={WsPrimaryButtonClass(saving)}
        disabled={saving}
        onClick={() => void onSave(draft)}
      >
        {saving ? "Saving…" : "Save flight scenario"}
      </button>
    </div>
  );
}
