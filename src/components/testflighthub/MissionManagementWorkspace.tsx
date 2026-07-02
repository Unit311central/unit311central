"use client";

import { useMemo, type RefObject } from "react";

import {
  createMissionEvent,
  formatEventTime,
  formatMissionDateTime,
  missionStatusClass,
  type ManagedMission,
} from "@/lib/mission-management-data";
import { cn } from "@/lib/utils";

import type { FlightHubSandboxHandle } from "./FlightHubSandbox";

type MissionManagementWorkspaceProps = {
  missions: ManagedMission[];
  selectedMissionId: string;
  onSelectMission: (missionId: string) => void;
  onMissionsChange: (missions: ManagedMission[]) => void;
  sandboxRef: RefObject<FlightHubSandboxHandle | null>;
  onRunningMissionChange: (missionId: string | null) => void;
};

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function actionButtonClass(variant: "primary" | "warning" | "neutral" | "success") {
  switch (variant) {
    case "primary":
      return "border-sky-500/40 bg-sky-500/15 text-sky-300 hover:border-sky-400/60 hover:bg-sky-500/25";
    case "warning":
      return "border-amber-500/40 bg-amber-500/15 text-amber-200 hover:border-amber-400/60 hover:bg-amber-500/25";
    case "success":
      return "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:border-emerald-400/60 hover:bg-emerald-500/25";
    case "neutral":
      return "border-white/15 bg-white/[0.04] text-white hover:border-white/25 hover:bg-white/[0.08]";
  }
}

export default function MissionManagementWorkspace({
  missions,
  selectedMissionId,
  onSelectMission,
  onMissionsChange,
  sandboxRef,
  onRunningMissionChange,
}: MissionManagementWorkspaceProps) {
  const selectedMission = useMemo(
    () => missions.find((mission) => mission.id === selectedMissionId) ?? missions[0],
    [missions, selectedMissionId],
  );

  function updateMission(updated: ManagedMission) {
    onMissionsChange(missions.map((mission) => (mission.id === updated.id ? updated : mission)));
  }

  async function handleStartMission() {
    if (!selectedMission || selectedMission.status !== "READY") return;

    await sandboxRef.current?.startMissionFlow();

    onRunningMissionChange(selectedMission.id);
    updateMission({
      ...selectedMission,
      status: "IN PROGRESS",
      startTime: new Date(),
      paused: false,
      progressPct: 0,
      events: [...selectedMission.events, createMissionEvent("Mission Started")],
    });
  }

  async function handlePauseMission() {
    if (!selectedMission || selectedMission.status !== "IN PROGRESS" || selectedMission.paused) return;

    await sandboxRef.current?.stopSimulation();

    onRunningMissionChange(null);
    updateMission({
      ...selectedMission,
      paused: true,
    });
  }

  async function handleResumeMission() {
    if (!selectedMission || selectedMission.status !== "IN PROGRESS" || !selectedMission.paused) return;

    await sandboxRef.current?.startMissionFlow();

    onRunningMissionChange(selectedMission.id);
    updateMission({
      ...selectedMission,
      paused: false,
    });
  }

  async function handleCompleteMission() {
    if (!selectedMission || selectedMission.status !== "IN PROGRESS") return;

    await sandboxRef.current?.stopSimulation();

    onRunningMissionChange(null);
    updateMission({
      ...selectedMission,
      status: "COMPLETED",
      endTime: new Date(),
      progressPct: 100,
      paused: false,
      events: [...selectedMission.events, createMissionEvent("Mission Completed")],
    });
  }

  const canStart = selectedMission?.status === "READY";
  const canPause = selectedMission?.status === "IN PROGRESS" && !selectedMission.paused;
  const canResume = selectedMission?.status === "IN PROGRESS" && selectedMission.paused;
  const canComplete = selectedMission?.status === "IN PROGRESS";

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Missions</h2>
            <span className="text-xs text-white/45">{missions.length} active</span>
          </div>

          <ul className="mt-4 space-y-2">
            {missions.map((mission) => {
              const selected = mission.id === selectedMission?.id;

              return (
                <li key={mission.id}>
                  <button
                    type="button"
                    onClick={() => onSelectMission(mission.id)}
                    className={cn(
                      "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                      selected
                        ? "border-sky-400/40 bg-sky-500/10 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.15)]"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">{mission.name}</p>
                        <p className="mt-1 truncate text-xs text-white/50">{mission.client}</p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                          missionStatusClass(mission.status),
                        )}
                      >
                        {mission.status}
                      </span>
                    </div>
                    <p className="mt-2 font-mono text-[11px] text-white/45">{mission.droneId}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {selectedMission && (
          <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#60a5fa]">
                  Mission Detail
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">{selectedMission.name}</h2>
              </div>
              <span
                className={cn(
                  "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
                  missionStatusClass(selectedMission.status),
                )}
              >
                {selectedMission.status}
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <DetailField label="Mission Name" value={selectedMission.name} />
              <DetailField label="Client" value={selectedMission.client} />
              <DetailField label="Site" value={selectedMission.site} />
              <DetailField label="Operator" value={selectedMission.operator} />
              <DetailField label="Assigned Drone" value={selectedMission.droneId} />
              <DetailField label="Status" value={selectedMission.status} />
              <DetailField
                label="Start Time"
                value={formatMissionDateTime(selectedMission.startTime)}
              />
              <DetailField label="End Time" value={formatMissionDateTime(selectedMission.endTime)} />
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-white/45">
                <span>Progress</span>
                <span className="font-mono text-white/70">
                  {selectedMission.progressPct.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-500"
                  style={{
                    width: `${Math.max(0, Math.min(100, selectedMission.progressPct))}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleStartMission()}
                disabled={!canStart}
                className={cn(
                  "inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                  actionButtonClass("primary"),
                )}
              >
                Start Mission
              </button>
              <button
                type="button"
                onClick={() => void handlePauseMission()}
                disabled={!canPause}
                className={cn(
                  "inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                  actionButtonClass("warning"),
                )}
              >
                Pause Mission
              </button>
              <button
                type="button"
                onClick={() => void handleResumeMission()}
                disabled={!canResume}
                className={cn(
                  "inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                  actionButtonClass("success"),
                )}
              >
                Resume Mission
              </button>
              <button
                type="button"
                onClick={() => void handleCompleteMission()}
                disabled={!canComplete}
                className={cn(
                  "inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                  actionButtonClass("neutral"),
                )}
              >
                Complete Mission
              </button>
            </div>
          </section>
        )}
      </div>

      {selectedMission && (
        <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">Mission Event Log</h2>

          <ul className="mt-4 space-y-2">
            {[...selectedMission.events].reverse().map((event) => (
              <li
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">{event.type}</p>
                  {event.detail && <p className="mt-0.5 text-xs text-white/50">{event.detail}</p>}
                </div>
                <span className="font-mono text-xs text-white/45">
                  {formatEventTime(event.timestamp)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
