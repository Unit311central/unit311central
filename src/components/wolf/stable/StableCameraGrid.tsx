"use client";

import { useCallback, useState } from "react";
import { Expand, Maximize2, X } from "lucide-react";

import { WolfGroundWebRtcPlayer } from "@/components/wolf/WolfGroundWebRtcWorkspace";
import { wolfCardClass } from "@/components/wolf/wolf-ui";
import {
  wolfGroundWebRtcLinkLabel,
  type WolfGroundWebRtcLinkStatus,
} from "@/lib/wolf/webrtc-link-status";
import {
  stableArea,
  stableCamerasInMonitorOrder,
  stableHorse,
  type StableCamera,
  type StableFacility,
  type StableHorse,
} from "@/lib/wolf/stable/demo-data";
import { cn } from "@/lib/utils";

import { toggleFullscreen } from "./stable-ui";

function cameraTitle(camera: StableCamera): string {
  if (camera.mode === "webrtc") return "Camera 05 – Live Camera / Phone Camera";
  return camera.name;
}

function SimulatedCamera({
  camera,
  horse,
  areaName,
  onOpenHorse,
}: {
  camera: Extract<StableCamera, { mode: "simulated" }>;
  horse: StableHorse;
  areaName: string;
  onOpenHorse: () => void;
}) {
  const [enlarged, setEnlarged] = useState(false);

  return (
    <>
      <article className={`${wolfCardClass} flex h-full flex-col overflow-hidden`}>
        <header className="flex items-start justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-white">{cameraTitle(camera)}</p>
            <p className="mt-0.5 text-xs text-white/50">{areaName}</p>
            <button
              type="button"
              onClick={onOpenHorse}
              className="mt-2 flex items-center gap-2 text-left text-sm text-emerald-200 hover:text-emerald-100"
            >
              <img src={horse.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
              {horse.name}
            </button>
          </div>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/55">
            Still photograph
          </span>
        </header>
        <button
          type="button"
          onClick={() => setEnlarged(true)}
          className="relative grid aspect-video min-h-44 overflow-hidden bg-black text-left"
          aria-label={`Enlarge ${camera.name}`}
        >
          <img
            src={camera.image}
            alt={`${horse.name} in ${areaName}`}
            className="pointer-events-none col-start-1 row-start-1 h-full min-h-0 w-full object-cover"
          />
          <span className="absolute top-3 left-3 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold tracking-wide text-black">
            SIMULATED LIVE
          </span>
        </button>
        <footer className="flex items-center justify-between gap-2 px-4 py-3">
          <p className="text-xs text-white/50">Still photograph. Not a video feed.</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEnlarged(true)}
              className="rounded-full border border-white/20 p-2 text-white"
              aria-label={`View ${camera.name}`}
            >
              <Expand className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(event) => void toggleFullscreen(event.currentTarget.closest("article"))}
              className="rounded-full border border-white/20 p-2 text-white"
              aria-label={`Full screen ${camera.name}`}
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </footer>
      </article>
      {enlarged ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="presentation"
          onClick={() => setEnlarged(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${camera.name} ${areaName}`}
            className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-black"
            onClick={(event) => event.stopPropagation()}
          >
            <img src={camera.image} alt={`${horse.name} in ${areaName}`} className="max-h-[80vh] w-full object-contain" />
            <div className="absolute top-3 left-3 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold tracking-wide text-black">
              SIMULATED LIVE
            </div>
            <button
              type="button"
              onClick={() => setEnlarged(false)}
              className="absolute top-3 right-3 rounded-full bg-black/60 p-2 text-white"
              aria-label="Close camera view"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-white">
              <button type="button" onClick={onOpenHorse} className="text-left">
                <span className="font-semibold">{camera.name}</span>
                <span className="text-white/60">
                  {" "}
                  · {areaName} · {horse.name}
                </span>
              </button>
              <button
                type="button"
                onClick={(event) => void toggleFullscreen(event.currentTarget.closest("[role=dialog]"))}
                className="rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
              >
                Full screen
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function LiveCamera({
  camera,
  horse,
  areaName,
  onOpenHorse,
  onLinkStatus,
}: {
  camera: Extract<StableCamera, { mode: "webrtc" }>;
  horse: StableHorse;
  areaName: string;
  onOpenHorse: () => void;
  onLinkStatus: (status: WolfGroundWebRtcLinkStatus) => void;
}) {
  const [enlarged, setEnlarged] = useState(false);
  const [linkStatus, setLinkStatus] = useState<WolfGroundWebRtcLinkStatus>("connecting");
  const reportStatus = useCallback(
    (status: WolfGroundWebRtcLinkStatus) => {
      setLinkStatus(status);
      onLinkStatus(status);
    },
    [onLinkStatus],
  );
  const statusLabel = wolfGroundWebRtcLinkLabel(linkStatus);

  const shell = enlarged
    ? "fixed inset-4 z-50 flex flex-col overflow-hidden rounded-2xl border border-emerald-400/40 bg-[#080c0a] shadow-2xl"
    : `${wolfCardClass} flex h-full flex-col overflow-hidden ring-1 ring-emerald-400/35`;

  return (
    <article className={shell}>
      <header className="flex items-start justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-white">{cameraTitle(camera)}</p>
          <p className="mt-0.5 text-xs text-white/50">{areaName}</p>
          <button
            type="button"
            onClick={onOpenHorse}
            className="mt-2 flex items-center gap-2 text-left text-sm text-emerald-200 hover:text-emerald-100"
          >
            <img src={horse.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
            {horse.name}
          </button>
        </div>
        <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80">
          {statusLabel}
        </span>
      </header>
      <div className={cn("relative min-h-72 overflow-hidden bg-black", enlarged ? "min-h-0 flex-1" : "aspect-video")}>
        <div className="absolute inset-0">
          <WolfGroundWebRtcPlayer signallingPath={camera.signallingPath} onLinkStatus={reportStatus} />
        </div>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <p className="max-w-md text-xs text-white/50">
          Existing WOLF Ground WebRTC player. LIVE appears only while frames are arriving. Reconnect is on the player.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEnlarged((current) => !current)}
            className="rounded-full border border-white/20 p-2 text-white"
            aria-label={enlarged ? `Close enlarged ${camera.name}` : `Enlarge ${camera.name}`}
          >
            {enlarged ? <X className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={(event) => void toggleFullscreen(event.currentTarget.closest("article"))}
            className="rounded-full border border-white/20 p-2 text-white"
            aria-label={`Full screen ${camera.name}`}
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </article>
  );
}

export function StableCameraGrid({
  facility,
  onOpenHorse,
  onLinkStatus,
}: {
  facility: StableFacility;
  onOpenHorse: (horseId: string) => void;
  onLinkStatus: (status: WolfGroundWebRtcLinkStatus) => void;
}) {
  const cameras = stableCamerasInMonitorOrder(facility);

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-4">
      {cameras.map((camera) => {
        const horse = stableHorse(facility, camera.horseId);
        const area = stableArea(facility, camera.areaId);
        if (!horse || !area) return null;
        const prominent = camera.mode === "webrtc";
        return (
          <div key={camera.id} className={cn("min-w-0", prominent && "lg:col-span-2 lg:row-span-2")}>
            {camera.mode === "simulated" ? (
              <SimulatedCamera
                camera={camera}
                horse={horse}
                areaName={area.name}
                onOpenHorse={() => onOpenHorse(horse.id)}
              />
            ) : (
              <LiveCamera
                camera={camera}
                horse={horse}
                areaName={area.name}
                onOpenHorse={() => onOpenHorse(horse.id)}
                onLinkStatus={onLinkStatus}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function cameraConnectionCopy(
  camera: StableCamera,
  linkStatus: WolfGroundWebRtcLinkStatus,
): { type: string; status: string; last: string } {
  if (camera.mode === "simulated") {
    return {
      type: "Demonstration still",
      status: "SIMULATED LIVE",
      last: "No connection. This tile is a photograph.",
    };
  }
  return {
    type: "WOLF Ground WebRTC",
    status: wolfGroundWebRtcLinkLabel(linkStatus),
    last: "No earlier connection is stored. The status above is the player on this page.",
  };
}
