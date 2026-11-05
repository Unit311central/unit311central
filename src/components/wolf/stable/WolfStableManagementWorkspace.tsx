"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Expand, MapPin, Maximize2, Thermometer, Wind, X } from "lucide-react";

import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import { WolfGroundWebRtcPlayer } from "@/components/wolf/WolfGroundWebRtcWorkspace";
import {
  wolfCardClass,
  wolfEyebrowClass,
  wolfMetricLabelClass,
  wolfShellClass,
} from "@/components/wolf/wolf-ui";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import {
  wolfGroundWebRtcLinkLabel,
  type WolfGroundWebRtcLinkStatus,
} from "@/lib/wolf/webrtc-link-status";
import {
  activeStableAlerts,
  stableArea,
  stableFacilityById,
  stableHorse,
  WOLF_STABLE_FACILITIES,
  type StableCamera,
  type StableFacility,
  type StableHorse,
} from "@/lib/wolf/stable/demo-data";
import type { WolfStableView } from "@/lib/wolf/stable/views";
import { cn } from "@/lib/utils";

const FACILITY_QUERY = "facility";

function statusLabel(status: StableFacility["status"]): string {
  if (status === "operational") return "Operational";
  if (status === "attention") return "Attention";
  return "Closed";
}

function horseStatusLabel(status: StableHorse["status"]): string {
  if (status === "in-stable") return "In stable";
  if (status === "turned-out") return "Turned out";
  return "Attention";
}

async function toggleFullscreen(element: Element | null) {
  if (!(element instanceof HTMLElement)) return;
  if (document.fullscreenElement === element) {
    await document.exitFullscreen().catch(() => undefined);
    return;
  }
  await element.requestFullscreen().catch(() => undefined);
}

function DemonstrationMark({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-amber-400/35 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-100">
      {children}
    </span>
  );
}

function Metric({
  label,
  value,
  hint,
  compact = false,
}: {
  label: string;
  value: string;
  hint?: string;
  compact?: boolean;
}) {
  return (
    <div className={`${wolfCardClass} px-4 py-3`}>
      <p className={wolfMetricLabelClass}>{label}</p>
      <p className={cn("mt-1 font-semibold tracking-tight text-white", compact ? "text-lg leading-snug" : "text-2xl")}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-white/45">{hint}</p> : null}
    </div>
  );
}

function FacilityCard({ facility }: { facility: StableFacility }) {
  const basePath = useInternalOperationsBasePath();
  const href = getInternalNavHref("wolf-stable-facility", basePath, {
    [FACILITY_QUERY]: facility.id,
  });
  const activeAlerts = activeStableAlerts(facility).length;

  return (
    <article className={`${wolfCardClass} overflow-hidden`}>
      <div className="relative grid aspect-[16/8] min-h-52 overflow-hidden bg-black">
        <img
          src={facility.photo}
          alt=""
          className="pointer-events-none col-start-1 row-start-1 h-full min-h-0 w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080c0a] via-black/20 to-black/30" />
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          <DemonstrationMark>Demonstration data</DemonstrationMark>
          <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-100">
            {statusLabel(facility.status)}
          </span>
        </div>
        <div className="absolute right-4 bottom-4 left-4">
          <h2 className="text-2xl font-semibold text-white">{facility.name}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/75">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {facility.location}
          </p>
        </div>
      </div>
      <div className="grid gap-4 px-5 py-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          <div>
            <dt className={wolfMetricLabelClass}>Horses</dt>
            <dd className="mt-1 text-lg font-semibold text-white">{facility.horses.length}</dd>
          </div>
          <div>
            <dt className={wolfMetricLabelClass}>Cameras</dt>
            <dd className="mt-1 text-lg font-semibold text-white">{facility.cameras.length}</dd>
          </div>
          <div>
            <dt className={wolfMetricLabelClass}>Monitored areas</dt>
            <dd className="mt-1 text-lg font-semibold text-white">{facility.areas.length}</dd>
          </div>
          <div>
            <dt className={wolfMetricLabelClass}>Active alerts</dt>
            <dd className="mt-1 text-lg font-semibold text-white">{activeAlerts}</dd>
          </div>
        </dl>
        <Link
          href={href}
          className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-[#062117] transition hover:bg-emerald-400"
        >
          Open Stable
        </Link>
      </div>
      <p className="border-t border-white/10 px-5 py-3 text-xs text-white/40">{facility.photoCredit}</p>
    </article>
  );
}

function Landing() {
  return (
    <div className={`${wolfShellClass} px-4 py-6 sm:px-6 sm:py-8`}>
      <header className="mb-8 max-w-3xl">
        <p className={wolfEyebrowClass}>WOLF Central</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Stable Management</h1>
        <p className="mt-2 text-sm text-white/70">Equestrian Facility Monitoring & Management</p>
      </header>
      <div className="grid gap-6">
        {WOLF_STABLE_FACILITIES.map((facility) => (
          <FacilityCard key={facility.id} facility={facility} />
        ))}
      </div>
    </div>
  );
}

function HorseProfile({
  horse,
  areaName,
  onClose,
}: {
  horse: StableHorse;
  areaName: string;
  onClose: () => void;
}) {
  const slots = [
    horse.veterinary,
    horse.feeding,
    horse.medication,
    horse.ownership,
    horse.healthMonitoring,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="stable-horse-title"
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0d1411] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative grid aspect-[16/8] overflow-hidden bg-black">
          <img src={horse.photo} alt="" className="pointer-events-none col-start-1 row-start-1 h-full min-h-0 w-full object-cover" />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 rounded-full bg-black/60 p-2 text-white"
            aria-label="Close horse profile"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-5">
          <p className={wolfEyebrowClass}>Horse profile · Demonstration</p>
          <h2 id="stable-horse-title" className="mt-1 text-2xl font-semibold text-white">
            {horse.name}
          </h2>
          <p className="mt-2 text-sm text-white/70">{horse.summary}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className={wolfMetricLabelClass}>Breed</dt>
              <dd className="mt-1 text-white">{horse.breed}</dd>
            </div>
            <div>
              <dt className={wolfMetricLabelClass}>Age</dt>
              <dd className="mt-1 text-white">{horse.ageYears} years</dd>
            </div>
            <div>
              <dt className={wolfMetricLabelClass}>Sex</dt>
              <dd className="mt-1 text-white">{horse.sex}</dd>
            </div>
            <div>
              <dt className={wolfMetricLabelClass}>Colour</dt>
              <dd className="mt-1 text-white">{horse.colour}</dd>
            </div>
            <div>
              <dt className={wolfMetricLabelClass}>Stable area</dt>
              <dd className="mt-1 text-white">{areaName}</dd>
            </div>
            <div>
              <dt className={wolfMetricLabelClass}>Status</dt>
              <dd className="mt-1 text-white">{horseStatusLabel(horse.status)}</dd>
            </div>
          </dl>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {slots.map((slot) => (
              <div key={slot.label} className="rounded-xl border border-white/10 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">{slot.label}</p>
                <p className="mt-1 text-sm text-white/55">
                  {slot.entries ? "Records on file" : "No records in this demonstration"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
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
            <p className="text-sm font-semibold text-white">
              {camera.name} – {areaName}
            </p>
            <button type="button" onClick={onOpenHorse} className="mt-1 flex items-center gap-2 text-left text-sm text-emerald-200 hover:text-emerald-100">
              <img src={horse.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
              {horse.name}
            </button>
          </div>
          <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
            Simulated still
          </span>
        </header>
        <button
          type="button"
          onClick={() => setEnlarged(true)}
          className="relative grid aspect-video min-h-52 overflow-hidden bg-black text-left"
          aria-label={`Enlarge ${camera.name}`}
        >
          <img src={camera.image} alt={`${horse.name} in ${areaName}`} className="pointer-events-none col-start-1 row-start-1 h-full min-h-0 w-full object-cover" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="presentation" onClick={() => setEnlarged(false)}>
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
                <span className="text-white/60"> · {areaName} · {horse.name}</span>
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

  const shell = enlarged
    ? "fixed inset-4 z-50 flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#080c0a] shadow-2xl"
    : `${wolfCardClass} flex h-full flex-col overflow-hidden`;

  return (
    <article className={shell}>
      <header className="flex items-start justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-white">
            {camera.name} – {areaName}
          </p>
          <button type="button" onClick={onOpenHorse} className="mt-1 flex items-center gap-2 text-left text-sm text-emerald-200 hover:text-emerald-100">
            <img src={horse.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
            {horse.name}
          </button>
        </div>
        <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80">
          {wolfGroundWebRtcLinkLabel(linkStatus)}
        </span>
      </header>
      <div className={cn("relative min-h-52 overflow-hidden bg-black", enlarged ? "min-h-0 flex-1" : "aspect-video")}>
        <div className="absolute inset-0">
          <WolfGroundWebRtcPlayer signallingPath={camera.signallingPath} onLinkStatus={reportStatus} />
        </div>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <p className="max-w-md text-xs text-white/50">
          Same player as Tools → WOLF Test Ground WebRTC. Phone source is the existing Brix publish to stream key test.
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

function FacilityDashboard({ facility }: { facility: StableFacility }) {
  const basePath = useInternalOperationsBasePath();
  const backHref = getInternalNavHref("wolf-stable", basePath);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<WolfGroundWebRtcLinkStatus>("connecting");
  const profile = profileId ? stableHorse(facility, profileId) : null;
  const profileArea = profile ? stableArea(facility, profile.areaId) : null;
  const connectedCameras = facility.cameras.filter((camera) => camera.mode === "webrtc" && liveStatus === "live").length;
  const activeAlerts = activeStableAlerts(facility);

  return (
    <div className={`${wolfShellClass} px-4 py-6 sm:px-6 sm:py-8`}>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={wolfEyebrowClass}>Stable Management</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">{facility.name}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-white/70">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {facility.location}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DemonstrationMark>Demonstration facility</DemonstrationMark>
          <Link href={backHref} className="text-sm text-white/70 underline-offset-2 hover:text-white hover:underline">
            All stables
          </Link>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6" aria-label="Facility summary">
        <Metric label="Total horses" value={String(facility.horses.length)} />
        <Metric label="Monitored areas" value={String(facility.areas.length)} />
        <Metric label="Cameras" value={String(facility.cameras.length)} />
        <Metric
          label="Cameras connected"
          value={wolfGroundWebRtcLinkLabel(liveStatus)}
          hint={connectedCameras === 1 ? "1 stream receiving frames" : "No stream receiving frames"}
          compact
        />
        <Metric label="Active alerts" value={String(activeAlerts.length)} />
        <Metric label="Facility status" value={statusLabel(facility.status)} />
      </section>

      <section className="mt-8" aria-label="Camera monitoring">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className={wolfEyebrowClass}>Camera monitoring</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Stable areas</h2>
          </div>
          <p className="max-w-sm text-right text-xs text-white/45">
            Cameras 01–04 are still photographs. Camera 05 reports the live WebRTC connection.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          {facility.cameras.map((camera, index) => {
            const horse = stableHorse(facility, camera.horseId);
            const area = stableArea(facility, camera.areaId);
            if (!horse || !area) return null;
            const className = cn(
              "min-w-0 xl:col-span-2",
              index === 3 && "xl:col-start-2",
              index === 4 && "xl:col-start-4",
            );
            if (camera.mode === "simulated") {
              return (
                <div key={camera.id} className={className}>
                  <SimulatedCamera
                    camera={camera}
                    horse={horse}
                    areaName={area.name}
                    onOpenHorse={() => setProfileId(horse.id)}
                  />
                </div>
              );
            }
            return (
              <div key={camera.id} className={className}>
                <LiveCamera
                  camera={camera}
                  horse={horse}
                  areaName={area.name}
                  onOpenHorse={() => setProfileId(horse.id)}
                  onLinkStatus={setLiveStatus}
                />
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className={`${wolfCardClass} px-4 py-4`} aria-label="Environmental monitoring">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">Environmental monitoring</h2>
            <DemonstrationMark>Simulated readings</DemonstrationMark>
          </div>
          <p className="mt-1 text-xs text-white/45">
            Not connected to physical sensors. The panel is ready for a yard sensor feed later.
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {facility.environment.readings.map((reading) => (
              <div key={reading.id} className="rounded-xl border border-white/10 px-3 py-3">
                <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                  {reading.id === "ventilation" ? <Wind className="h-3.5 w-3.5" aria-hidden /> : <Thermometer className="h-3.5 w-3.5" aria-hidden />}
                  {reading.label}
                </dt>
                <dd className="mt-1 text-xl font-semibold text-white">{reading.value}</dd>
                <p className="mt-1 text-xs text-white/45">{reading.detail}</p>
              </div>
            ))}
          </dl>
        </section>

        <section className={`${wolfCardClass} px-4 py-4`} aria-label="Alerts and incidents">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">Alerts and incidents</h2>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/12 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-100">
              {activeAlerts.length} active
            </span>
          </div>
          <p className="mt-1 text-xs text-white/45">
            Demonstration scenarios for how WOLF could manage a yard. No detection is running.
          </p>
          {activeAlerts.length === 0 ? (
            <p className="mt-3 text-sm text-white/70">No active alerts.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {activeAlerts.map((alert) => (
                <li key={alert.id} className="rounded-xl border border-amber-400/30 px-3 py-2 text-sm text-amber-50">
                  {alert.title}
                </li>
              ))}
            </ul>
          )}
          <ul className="mt-4 space-y-2">
            {facility.alerts.filter((alert) => !alert.active).map((alert) => (
              <li key={alert.id} className="rounded-xl border border-white/10 px-3 py-2">
                <p className="text-sm text-white">{alert.title}</p>
                <p className="mt-1 text-xs text-white/50">{alert.detail}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/80">
                  Demonstration scenario
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {profile && profileArea ? (
        <HorseProfile horse={profile} areaName={profileArea.name} onClose={() => setProfileId(null)} />
      ) : null}
    </div>
  );
}

export default function WolfStableManagementWorkspace({ view }: { view: WolfStableView }) {
  const searchParams = useSearchParams();
  const requestedId = searchParams.get(FACILITY_QUERY);
  const facility =
    view === "wolf-stable-facility"
      ? stableFacilityById(requestedId ?? WOLF_STABLE_FACILITIES[0]?.id ?? "")
      : null;

  if (view === "wolf-stable" || !facility) {
    return <Landing />;
  }

  return <FacilityDashboard facility={facility} />;
}
