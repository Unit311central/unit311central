"use client";

import { useEffect, useState } from "react";

import { WsInputClass, WsPrimaryButtonClass } from "@/components/testflighthub/domain-workspace-ui";
import type { WorkbenchConfig, WorkbenchModel } from "@/lib/realtime-video-pipeline/workbench-types";
import { BCN_VALIDATION_STATUS, ORYX_AIRCRAFT_NAME } from "@/lib/realtime-video-pipeline/workbench-reference-data";

import { cn } from "@/lib/utils";

import { contentionTone, fmtNum, metricTile } from "./shared";

export function VideoBandwidthTab({
  model,
  onSave,
  saving,
}: {
  model: WorkbenchModel;
  onSave: (config: WorkbenchConfig) => Promise<void>;
  saving: boolean;
}) {
  const [draft, setDraft] = useState(model.config);
  const c = model.contention;
  const v = model.videoData;

  useEffect(() => {
    setDraft(model.config);
  }, [model.config]);

  function patchLiveBitrate(newVal: number) {
    const old = draft.videoProfile.liveStreamBitrateMbps;
    const ratio = old > 0 ? newVal / old : 1;
    setDraft({
      ...draft,
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
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-400/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-100/90">
        Recording bitrate and live stream bitrate are modelled separately. Live stream reference:{" "}
        {model.config.videoProfile.liveStreamBitrateMbps} Mbps — {BCN_VALIDATION_STATUS}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metricTile("Live bitrate", `${fmtNum(v.mbps, 1)} Mbps`, "Mission-weighted effective")}
        {metricTile("GB / hour", fmtNum(v.gbPerHour))}
        {metricTile("GB / day", fmtNum(v.gbPerDay))}
        {metricTile("GB / week", fmtNum(v.gbPerWeek))}
        {metricTile("GB / month", fmtNum(v.gbPerMonth))}
        {metricTile("TB / month", fmtNum(v.tbPerMonth, 3))}
        {metricTile("Max recording Mbps", String(model.config.videoProfile.maxRecordingBitrateMbps))}
        {metricTile("Protocol overhead", `${model.config.videoProfile.protocolOverheadPct}%`)}
      </div>

      <div className="rounded-xl border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-white">Edit video assumptions</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="text-sm">
            <span className="text-white/45">Live stream Mbps</span>
            <input
              type="number"
              className={WsInputClass()}
              value={draft.videoProfile.liveStreamBitrateMbps}
              onChange={(e) => patchLiveBitrate(Number(e.target.value))}
            />
            <span className="mt-1 block text-[11px] text-amber-200/80">{BCN_VALIDATION_STATUS}</span>
          </label>
          <label className="text-sm">
            <span className="text-white/45">Max recording Mbps</span>
            <input
              type="number"
              className={WsInputClass()}
              value={draft.videoProfile.maxRecordingBitrateMbps}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  videoProfile: {
                    ...draft.videoProfile,
                    maxRecordingBitrateMbps: Number(e.target.value),
                    maxRecordingBitrateStatus: "User Input",
                  },
                })
              }
            />
          </label>
          <label className="text-sm">
            <span className="text-white/45">Protocol overhead %</span>
            <input
              type="number"
              className={WsInputClass()}
              value={draft.videoProfile.protocolOverheadPct}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  videoProfile: {
                    ...draft.videoProfile,
                    protocolOverheadPct: Number(e.target.value),
                  },
                })
              }
            />
          </label>
        </div>
        <button
          type="button"
          className={cn("mt-4", WsPrimaryButtonClass(saving))}
          disabled={saving}
          onClick={() => void onSave(draft)}
        >
          {saving ? "Saving…" : "Save video profile"}
        </button>
      </div>

      <div className="rounded-xl border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-white">Park shared Internet — contention model</h3>
        <p className="mt-1 text-xs text-amber-200/80">{BCN_VALIDATION_STATUS}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {metricTile("Download (reference)", `${draft.connectivity.downloadMbps} Mbps`)}
          {metricTile("Upload (reference)", `${draft.connectivity.uploadMbps} Mbps`)}
          {metricTile("Contention status", c.status, `WOLF utilisation ${fmtNum(c.wolfUploadUtilisationPct, 0)}%`)}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="text-sm">
            <span className="text-white/45">Download Mbps</span>
            <input
              type="number"
              className={WsInputClass()}
              value={draft.connectivity.downloadMbps}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  connectivity: { ...draft.connectivity, downloadMbps: Number(e.target.value) },
                })
              }
            />
          </label>
          <label className="text-sm">
            <span className="text-white/45">Upload Mbps</span>
            <input
              type="number"
              className={WsInputClass()}
              value={draft.connectivity.uploadMbps}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  connectivity: { ...draft.connectivity, uploadMbps: Number(e.target.value) },
                })
              }
            />
          </label>
          <label className="text-sm">
            <span className="text-white/45">Guest capacity</span>
            <input
              type="number"
              className={WsInputClass()}
              value={draft.parkContention.guestCapacity}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  parkContention: {
                    ...draft.parkContention,
                    guestCapacity: Number(e.target.value),
                  },
                })
              }
            />
          </label>
        </div>
        <button
          type="button"
          className={cn("mt-4", WsPrimaryButtonClass(saving))}
          disabled={saving}
          onClick={() => void onSave(draft)}
        >
          {saving ? "Saving…" : "Save connectivity assumptions"}
        </button>
      </div>

      <div className="rounded-xl border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-white">Starlink / connectivity tiers</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {(["conservative", "reference", "optimistic"] as const).map((tier) => {
            const t = model.config.connectivityTiers[tier];
            const active = model.config.activeConnectivityTier === tier;
            return (
              <div
                key={tier}
                className={`rounded-lg border p-3 ${active ? "border-sky-400/40 bg-sky-500/10" : "border-white/10"}`}
              >
                <p className="font-medium capitalize text-white">{tier}</p>
                <p className="mt-1 text-xs text-white/50">
                  ↓ {t.downloadMbps} Mbps · ↑ {t.uploadMbps} Mbps
                </p>
                <p className="text-xs text-white/40">
                  Latency {t.latencyMs ?? "TBD"} ms · ${t.monthlyCostUsd ?? "TBD"}/mo · {t.status}
                </p>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-white/40">
          Switch active tier in Flight Scenarios tab. Safari pays connectivity — not included in WOLF cost.
        </p>
      </div>
    </div>
  );
}
