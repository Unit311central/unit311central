"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Thermometer, Wind } from "lucide-react";

import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import { wolfCardClass, wolfEyebrowClass, wolfMetricLabelClass, wolfShellClass } from "@/components/wolf/wolf-ui";
import {
  activeStableAlerts,
  stableArea,
  stableFacilityById,
  WOLF_STABLE_DIRECTORY,
  WOLF_STABLE_FACILITIES,
  type StableFacility,
  type StableHorse,
} from "@/lib/wolf/stable/demo-data";
import {
  activitiesForFacility,
  appointmentsForFacility,
  outstandingCareTasks,
  type StableActivity,
} from "@/lib/wolf/stable/demo-operations";
import { STABLE_FACILITY_TABS } from "@/lib/wolf/stable/facility-tabs";
import type { WolfStableView } from "@/lib/wolf/stable/views";
import { wolfGroundWebRtcLinkLabel, type WolfGroundWebRtcLinkStatus } from "@/lib/wolf/webrtc-link-status";
import { cn } from "@/lib/utils";

import { StableCameraGrid } from "./StableCameraGrid";
import {
  horseMatchesFilters,
  StableCameraRegister,
  StableCarePanel,
  StableFacilitiesPanel,
  StableHealthPanel,
  StableReportsPanel,
  StableSettingsPanel,
  StableStaffPanel,
} from "./StableFacilityModules";
import { StableHorseProfile } from "./StableHorseProfile";
import {
  DemonstrationMark,
  facilityTabFromSearch,
  horseStatusLabel,
  Metric,
  STABLE_FACILITY_QUERY,
  STABLE_HORSE_QUERY,
  STABLE_TAB_QUERY,
  stableDirectoryHref,
  stableFacilityHref,
  stablePortfolioHref,
  statusLabel,
} from "./stable-ui";

function FacilitySummaryCard({ facility }: { facility: StableFacility }) {
  const basePath = useInternalOperationsBasePath();
  const href = stableFacilityHref(basePath, facility.id, "overview");
  const activeAlerts = activeStableAlerts(facility).length;
  const webrtc = facility.cameras.filter((camera) => camera.mode === "webrtc").length;
  const simulated = facility.cameras.filter((camera) => camera.mode === "simulated").length;

  return (
    <Link href={href} className={`${wolfCardClass} overflow-hidden transition hover:border-white/20`}>
      <div className="relative grid aspect-[16/8] min-h-44 overflow-hidden bg-black">
        <img src={facility.photo} alt="" className="pointer-events-none col-start-1 row-start-1 h-full min-h-0 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080c0a] via-black/25 to-black/20" />
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
      <dl className="grid grid-cols-2 gap-3 px-5 py-4 text-sm sm:grid-cols-4">
        <div>
          <dt className={wolfMetricLabelClass}>Horses</dt>
          <dd className="mt-1 text-lg font-semibold text-white">{facility.horses.length}</dd>
        </div>
        <div>
          <dt className={wolfMetricLabelClass}>Stable areas</dt>
          <dd className="mt-1 text-lg font-semibold text-white">{facility.areas.length}</dd>
        </div>
        <div>
          <dt className={wolfMetricLabelClass}>Cameras</dt>
          <dd className="mt-1 text-lg font-semibold text-white">{facility.cameras.length}</dd>
        </div>
        <div>
          <dt className={wolfMetricLabelClass}>Active alerts</dt>
          <dd className="mt-1 text-lg font-semibold text-white">{activeAlerts}</dd>
        </div>
      </dl>
      <p className="border-t border-white/10 px-5 py-3 text-xs text-white/45">
        {simulated} simulated stills. {webrtc} WebRTC path — connection is confirmed only on the facility cameras.
        {" "}
        {facility.photoCredit}
      </p>
    </Link>
  );
}

function Portfolio() {
  const facilities = WOLF_STABLE_FACILITIES;
  const horses = facilities.reduce((total, facility) => total + facility.horses.length, 0);
  const areas = facilities.reduce((total, facility) => total + facility.areas.length, 0);
  const alerts = facilities.reduce((total, facility) => total + activeStableAlerts(facility).length, 0);
  const tasks = facilities.reduce((total, facility) => total + outstandingCareTasks(facility.id).length, 0);
  const scenarios = facilities.flatMap((facility) =>
    facility.alerts.filter((alert) => alert.demonstration && !alert.active).map((alert) => ({ facility, alert })),
  );

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6 max-w-3xl">
        <p className={wolfEyebrowClass}>Stable Management</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Overview</h1>
        <p className="mt-2 text-sm text-white/65">
          Portfolio view of the facilities in this demonstration. Windsor Estate Stables is the only facility loaded.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6" aria-label="Portfolio summary">
        <Metric label="Total Stables" value={String(facilities.length)} hint="Demonstration directory" />
        <Metric label="Total Horses" value={String(horses)} hint="Assigned in the demonstration" />
        <Metric label="Monitored Areas" value={String(areas)} hint="Stable areas in the record" />
        <Metric label="Connected Cameras" value="0" hint="None confirmed. Open a facility to check Camera 05." compact />
        <Metric label="Active Alerts" value={String(alerts)} hint="System alerts. Scenarios are listed separately." />
        <Metric label="Outstanding Tasks" value={String(tasks)} hint="Sample routines" />
      </section>

      <section className="mt-8" aria-label="Facility overview">
        <h2 className="text-sm font-semibold text-white">Facilities</h2>
        <div className="mt-3 grid gap-4">
          {facilities.map((facility) => (
            <FacilitySummaryCard key={facility.id} facility={facility} />
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section className={`${wolfCardClass} px-4 py-4`} aria-label="Alerts and incidents">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">Alerts and incidents</h2>
            <span className="text-xs text-emerald-100/80">{alerts} system alerts</span>
          </div>
          <p className="mt-2 text-sm text-white/70">No system-generated alert is active.</p>
          <ul className="mt-3 space-y-2">
            {scenarios.map(({ facility, alert }) => (
              <li key={`${facility.id}-${alert.id}`} className="rounded-xl border border-white/10 px-3 py-2">
                <p className="text-sm text-white">{alert.title}</p>
                <p className="mt-1 text-xs text-white/50">
                  {facility.name} · {alert.detail}
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/80">
                  Inactive demonstration scenario
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className={`${wolfCardClass} px-4 py-4`} aria-label="Upcoming activities">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">Upcoming activities</h2>
            <DemonstrationMark>Demonstration data</DemonstrationMark>
          </div>
          <ul className="mt-3 space-y-2">
            {facilities.flatMap((facility) =>
              appointmentsForFacility(facility.id).map((item) => (
                <li key={item.id} className="rounded-xl border border-white/10 px-3 py-2">
                  <p className="text-sm text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-white/50">
                    {facility.name} · {item.whenLabel}
                  </p>
                </li>
              )),
            )}
          </ul>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className={`${wolfCardClass} px-4 py-4`} aria-label="Operational activity">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">Operational activity</h2>
            <DemonstrationMark>Demonstration data</DemonstrationMark>
          </div>
          <ol className="mt-3 space-y-3">
            {facilities.flatMap((facility) =>
              activitiesForFacility(facility.id).map((item) => (
                <li key={item.id} className="border-l border-white/15 pl-3">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">{item.whenLabel}</p>
                  <p className="mt-1 text-sm text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-white/50">
                    {facility.name} · {item.detail}
                  </p>
                </li>
              )),
            )}
          </ol>
        </section>

        <section className={`${wolfCardClass} px-4 py-4`} aria-label="Facility status">
          <h2 className="text-sm font-semibold text-white">Facility status</h2>
          <ul className="mt-3 space-y-3">
            {facilities.map((facility) => (
              <li key={facility.id} className="rounded-xl border border-white/10 px-3 py-3">
                <p className="text-sm font-semibold text-white">{facility.name}</p>
                <p className="mt-1 text-sm text-white/75">{statusLabel(facility.status)}</p>
                <p className="mt-2 text-xs text-white/50">
                  Cameras: {facility.cameras.filter((camera) => camera.mode === "simulated").length} simulated,{" "}
                  {facility.cameras.filter((camera) => camera.mode === "webrtc").length} WebRTC path not confirmed here.
                </p>
                <p className="mt-1 text-xs text-white/50">
                  Environment: demonstration readings, no sensor connected. Outstanding sample tasks:{" "}
                  {outstandingCareTasks(facility.id).length}.
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Directory() {
  const basePath = useInternalOperationsBasePath();
  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6 max-w-3xl">
        <p className={wolfEyebrowClass}>Stable Management</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Stables</h1>
        <p className="mt-2 text-sm text-white/65">
          Windsor Estate Stables is the live facility. The other rows are example listings and do not open a yard.
        </p>
      </header>
      <div className={`${wolfCardClass} overflow-x-auto`}>
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {["Stable", "Location", "Horses", "Areas", "Cameras", "Alerts", "Listing"].map((label) => (
                <th key={label} className={`${wolfMetricLabelClass} px-4 py-3 font-semibold`}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WOLF_STABLE_DIRECTORY.map((row) => (
              <tr key={row.id} className="border-b border-white/10 last:border-b-0">
                <td className="px-4 py-3">
                  {row.live ? (
                    <Link
                      href={stableFacilityHref(basePath, row.id, "overview")}
                      className="font-semibold text-white underline-offset-2 hover:text-emerald-100 hover:underline"
                    >
                      {row.name}
                    </Link>
                  ) : (
                    <span className="font-semibold text-white">{row.name}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-white/70">{row.location}</td>
                <td className="px-4 py-3 text-white/80">{row.horses ?? "—"}</td>
                <td className="px-4 py-3 text-white/80">{row.areas ?? "—"}</td>
                <td className="px-4 py-3 text-white/80">{row.cameras ?? "—"}</td>
                <td className="px-4 py-3 text-white/80">{row.alerts ?? "—"}</td>
                <td className="px-4 py-3">
                  {row.live ? (
                    <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-100">
                      Live
                    </span>
                  ) : (
                    <DemonstrationMark>Example</DemonstrationMark>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HorseDirectory({ facility }: { facility: StableFacility }) {
  const basePath = useInternalOperationsBasePath();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [areaId, setAreaId] = useState("all");
  const horses = facility.horses.filter((horse) => horseMatchesFilters(horse, facility, query, status, areaId));

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by horse name"
          aria-label="Search by horse name"
          className="min-w-48 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter by status"
          className="rounded-lg border border-white/15 bg-black/30 px-2 py-2 text-sm text-white"
        >
          <option value="all">All statuses</option>
          <option value="in-stable">In stable</option>
          <option value="turned-out">Turned out</option>
          <option value="attention">Attention</option>
        </select>
        <select
          value={areaId}
          onChange={(event) => setAreaId(event.target.value)}
          aria-label="Filter by stable area"
          className="rounded-lg border border-white/15 bg-black/30 px-2 py-2 text-sm text-white"
        >
          <option value="all">All areas</option>
          {facility.areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </div>
      {horses.length === 0 ? (
        <p className={`${wolfCardClass} px-4 py-4 text-sm text-white/70`}>No horse matches that search.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {horses.map((horse) => (
            <li key={horse.id}>
              <HorseCard facility={facility} horse={horse} href={stableFacilityHref(basePath, facility.id, "horses", horse.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function lastHorseActivity(facility: StableFacility, horse: StableHorse): StableActivity | null {
  const matches = activitiesForFacility(facility.id).filter((item) => item.horseId === horse.id);
  return matches.length ? matches[matches.length - 1] : null;
}

function HorseCard({ facility, horse, href }: { facility: StableFacility; horse: StableHorse; href: string }) {
  const area = stableArea(facility, horse.areaId);
  const activity = lastHorseActivity(facility, horse);
  return (
    <Link href={href} className={`${wolfCardClass} flex h-full gap-3 px-3 py-3 hover:border-white/20`}>
      <img src={horse.photo} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
      <div className="min-w-0">
        <p className="font-semibold text-white">{horse.name}</p>
        <p className="mt-1 text-xs text-white/55">
          {horse.breed} · {horse.ageYears} years · {horse.sex}
        </p>
        <p className="mt-1 text-xs text-white/70">{area?.name}</p>
        <p className="mt-1 text-xs text-emerald-100/80">{horseStatusLabel(horse.status)}</p>
        <p className="mt-1 text-xs text-white/45">
          Last recorded: {activity ? activity.title : "No activity stored"} · Demonstration
        </p>
      </div>
    </Link>
  );
}

function FacilityOverview({
  facility,
  onOpenHorse,
  onLinkStatus,
  linkStatus,
}: {
  facility: StableFacility;
  onOpenHorse: (horseId: string) => void;
  onLinkStatus: (status: WolfGroundWebRtcLinkStatus) => void;
  linkStatus: WolfGroundWebRtcLinkStatus;
}) {
  const basePath = useInternalOperationsBasePath();
  const activeAlerts = activeStableAlerts(facility);
  const connected = facility.cameras.filter((camera) => camera.mode === "webrtc" && linkStatus === "live").length;

  return (
    <div>
      <section aria-label="Camera monitoring">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className={wolfEyebrowClass}>Camera monitoring</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Stable areas</h2>
          </div>
          <p className="max-w-sm text-xs text-white/45">
            Camera 05 uses the existing Ground WebRTC player. Cameras 01–04 are photographs labelled SIMULATED LIVE.
          </p>
        </div>
        <StableCameraGrid facility={facility} onOpenHorse={onOpenHorse} onLinkStatus={onLinkStatus} />
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6" aria-label="Facility summary">
        <Metric label="Total Horses" value={String(facility.horses.length)} />
        <Metric label="Stable Areas" value={String(facility.areas.length)} />
        <Metric label="Cameras" value={String(facility.cameras.length)} />
        <Metric
          label="Cameras Connected"
          value={String(connected)}
          hint={linkStatus === "live" ? "Camera 05 is receiving frames" : wolfGroundWebRtcLinkLabel(linkStatus)}
          compact
        />
        <Metric label="Active Alerts" value={String(activeAlerts.length)} />
        <Metric label="Facility Status" value={statusLabel(facility.status)} />
      </section>

      <section className="mt-6" aria-label="Horses">
        <h2 className="text-sm font-semibold text-white">Horses</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {facility.horses.map((horse) => (
            <li key={horse.id}>
              <HorseCard
                facility={facility}
                horse={horse}
                href={stableFacilityHref(basePath, facility.id, "horses", horse.id)}
              />
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className={`${wolfCardClass} px-4 py-4`} aria-label="Environmental monitoring">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-white">Environmental monitoring</h2>
            <DemonstrationMark>Demonstration data</DemonstrationMark>
          </div>
          <p className="mt-1 text-xs text-white/45">
            Simulated readings. No sensor is connected. CO₂ and ammonia are not in this demonstration.
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {facility.environment.readings.map((reading) => (
              <div key={reading.id} className="rounded-xl border border-white/10 px-3 py-3">
                <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                  {reading.id === "ventilation" ? (
                    <Wind className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <Thermometer className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {reading.label}
                </dt>
                <dd className="mt-1 text-xl font-semibold text-white">{reading.value}</dd>
                <p className="mt-1 text-xs text-white/45">{reading.detail}</p>
              </div>
            ))}
          </dl>
        </section>

        <section className={`${wolfCardClass} px-4 py-4`} aria-label="Alerts and incidents">
          <h2 className="text-sm font-semibold text-white">Alerts and incidents</h2>
          <p className="mt-2 text-sm text-white/70">
            {activeAlerts.length === 0 ? "No system alert is active." : `${activeAlerts.length} system alerts.`}
          </p>
          <ul className="mt-3 space-y-2">
            {facility.alerts
              .filter((alert) => !alert.active)
              .map((alert) => (
                <li key={alert.id} className="rounded-xl border border-white/10 px-3 py-2">
                  <p className="text-sm text-white">{alert.title}</p>
                  <p className="mt-1 text-xs text-white/50">{alert.detail}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/80">
                    Inactive demonstration scenario
                  </p>
                </li>
              ))}
          </ul>
        </section>
      </div>

      <section className={`${wolfCardClass} mt-4 px-4 py-4`} aria-label="Recent activity">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white">Recent activity</h2>
          <DemonstrationMark>Demonstration data</DemonstrationMark>
        </div>
        <ol className="mt-3 space-y-3">
          {activitiesForFacility(facility.id).map((item) => (
            <li key={item.id} className="border-l border-white/15 pl-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">{item.whenLabel}</p>
              <p className="mt-1 text-sm text-white">{item.title}</p>
              <p className="mt-1 text-xs text-white/50">{item.detail}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function FacilityWorkspace({ facility }: { facility: StableFacility }) {
  const basePath = useInternalOperationsBasePath();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = facilityTabFromSearch(searchParams.get(STABLE_TAB_QUERY));
  const horseId = searchParams.get(STABLE_HORSE_QUERY);
  const horse = horseId ? facility.horses.find((entry) => entry.id === horseId) ?? null : null;
  const [linkStatus, setLinkStatus] = useState<WolfGroundWebRtcLinkStatus>("connecting");

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={wolfEyebrowClass}>Stable Management</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">{facility.name}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-white/70">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {facility.location}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DemonstrationMark>Demonstration facility</DemonstrationMark>
          <Link href={stableDirectoryHref(basePath)} className="text-sm text-white/70 underline-offset-2 hover:text-white hover:underline">
            Stables
          </Link>
          <Link href={stablePortfolioHref(basePath)} className="text-sm text-white/70 underline-offset-2 hover:text-white hover:underline">
            Overview
          </Link>
        </div>
      </header>

      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-white/10" aria-label="Facility sections">
        {STABLE_FACILITY_TABS.map((item) => {
          const selected = item.id === tab;
          return (
            <Link
              key={item.id}
              href={stableFacilityHref(basePath, facility.id, item.id, horseId)}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "shrink-0 border-b-2 px-3 py-2 text-sm",
                selected ? "border-emerald-400 font-semibold text-white" : "border-transparent text-white/50 hover:text-white/80",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {tab === "overview" ? (
        <FacilityOverview
          facility={facility}
          linkStatus={linkStatus}
          onLinkStatus={setLinkStatus}
          onOpenHorse={(id) => router.push(stableFacilityHref(basePath, facility.id, "horses", id))}
        />
      ) : null}
      {tab === "horses" ? (
        horse ? (
          <StableHorseProfile
            facility={facility}
            horse={horse}
            backHref={stableFacilityHref(basePath, facility.id, "horses")}
          />
        ) : horseId ? (
          <p className="text-sm text-white/70">That horse is not at this facility.</p>
        ) : (
          <HorseDirectory facility={facility} />
        )
      ) : null}
      {tab === "cameras" ? (
        <>
          <StableCameraGrid
            facility={facility}
            onOpenHorse={(id) => router.push(stableFacilityHref(basePath, facility.id, "horses", id))}
            onLinkStatus={setLinkStatus}
          />
          <StableCameraRegister facility={facility} linkStatus={linkStatus} />
        </>
      ) : null}
      {tab === "health" ? <StableHealthPanel facility={facility} /> : null}
      {tab === "care" ? <StableCarePanel facility={facility} /> : null}
      {tab === "staff" ? <StableStaffPanel facility={facility} /> : null}
      {tab === "facilities" ? <StableFacilitiesPanel facility={facility} /> : null}
      {tab === "reports" ? <StableReportsPanel facility={facility} /> : null}
      {tab === "settings" ? <StableSettingsPanel facility={facility} /> : null}
    </div>
  );
}

function MissingFacility() {
  const basePath = useInternalOperationsBasePath();
  return (
    <div className="px-4 py-8 sm:px-6">
      <h1 className="text-xl font-semibold text-white">Facility not in this directory</h1>
      <p className="mt-2 text-sm text-white/65">The link does not match a demonstration facility.</p>
      <Link href={stableDirectoryHref(basePath)} className="mt-4 inline-block text-sm text-emerald-200 underline">
        Back to Stables
      </Link>
    </div>
  );
}

export default function WolfStableManagementWorkspace({ view }: { view: WolfStableView }) {
  const searchParams = useSearchParams();
  const requestedId = searchParams.get(STABLE_FACILITY_QUERY);
  const facility = requestedId ? stableFacilityById(requestedId) : null;
  let content = <Portfolio />;
  if (view === "wolf-stable") content = <Directory />;
  else if (view === "wolf-stable-facility") content = facility ? <FacilityWorkspace facility={facility} /> : <MissingFacility />;
  return <div className={wolfShellClass}>{content}</div>;
}
