"use client";

import { useMemo, useState } from "react";

import { wolfCardClass, wolfMetricLabelClass } from "@/components/wolf/wolf-ui";
import {
  stableArea,
  stableCamerasInMonitorOrder,
  stableHorse,
  type StableFacility,
  type StableHorse,
} from "@/lib/wolf/stable/demo-data";
import {
  activitiesForFacility,
  appointmentsForFacility,
  careTasksForFacility,
  infrastructureForFacility,
  maintenanceForFacility,
  staffForFacility,
  type StableAppointmentKind,
  type StableCareGroup,
} from "@/lib/wolf/stable/demo-operations";
import type { WolfGroundWebRtcLinkStatus } from "@/lib/wolf/webrtc-link-status";

import { cameraConnectionCopy } from "./StableCameraGrid";
import { DemonstrationMark, NOT_IN_DEMONSTRATION } from "./stable-ui";

const HEALTH_KINDS: { id: StableAppointmentKind | "record"; label: string }[] = [
  { id: "veterinary", label: "Veterinary" },
  { id: "dental", label: "Dental" },
  { id: "farrier", label: "Farrier" },
  { id: "vaccination", label: "Vaccination" },
  { id: "record", label: "Stored clinical file" },
];

function horseName(facility: StableFacility, horseId: string | null): string {
  if (!horseId) return "Yard";
  return stableHorse(facility, horseId)?.name ?? "Unknown horse";
}

function staffName(facilityId: string, staffId: string | null): string {
  if (!staffId) return "Unassigned";
  return staffForFacility(facilityId).find((member) => member.id === staffId)?.name ?? "Unassigned";
}

export function StableHealthPanel({ facility }: { facility: StableFacility }) {
  const [horseId, setHorseId] = useState("all");
  const [kind, setKind] = useState("all");
  const appointments = appointmentsForFacility(facility.id).filter((item) => {
    if (item.kind !== "veterinary" && item.kind !== "dental" && item.kind !== "farrier" && item.kind !== "vaccination") {
      return false;
    }
    if (horseId !== "all" && item.horseId !== horseId) return false;
    if (kind !== "all" && kind !== "record" && item.kind !== kind) return false;
    return true;
  });

  return (
    <div className="grid gap-4">
      <div className={`${wolfCardClass} px-4 py-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white">Health</h2>
          <DemonstrationMark>Demonstration data</DemonstrationMark>
        </div>
        <p className="mt-2 text-sm text-white/60">
          No veterinary, injury, medication, vaccination, dental, or farrier record is stored. The list below is a
          sample schedule, not a clinical history. There is no dated clinical file, so these slots are not filtered
          by date.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <label className="text-xs text-white/50">
            Horse
            <select
              value={horseId}
              onChange={(event) => setHorseId(event.target.value)}
              className="mt-1 block rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-sm text-white"
            >
              <option value="all">All horses</option>
              {facility.horses.map((horse) => (
                <option key={horse.id} value={horse.id}>
                  {horse.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-white/50">
            Type
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value)}
              className="mt-1 block rounded-lg border border-white/15 bg-black/30 px-2 py-1.5 text-sm text-white"
            >
              <option value="all">All sample types</option>
              {HEALTH_KINDS.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {kind === "record" ? (
        <p className={`${wolfCardClass} px-4 py-4 text-sm text-white/70`}>No stored clinical file matches this filter.</p>
      ) : appointments.length === 0 ? (
        <p className={`${wolfCardClass} px-4 py-4 text-sm text-white/70`}>No sample appointment matches this filter.</p>
      ) : (
        <ul className="grid gap-3">
          {appointments.map((item) => (
            <li key={item.id} className={`${wolfCardClass} px-4 py-3`}>
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-xs text-white/50">
                {horseName(facility, item.horseId)} · {item.whenLabel}
              </p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/80">
                Demonstration scenario · not booked
              </p>
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {["Injuries and conditions", "Medication", "Treatment and recovery", "Health alerts"].map((label) => (
          <div key={label} className={`${wolfCardClass} px-4 py-3`}>
            <p className={wolfMetricLabelClass}>{label}</p>
            <p className="mt-2 text-sm text-white/55">None on file.</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const CARE_GROUPS: { id: StableCareGroup; title: string }[] = [
  { id: "feeding", title: "Feeding" },
  { id: "grooming", title: "Grooming" },
  { id: "exercise", title: "Exercise and turnout" },
  { id: "task", title: "Daily tasks" },
];

export function StableCarePanel({ facility }: { facility: StableFacility }) {
  const tasks = careTasksForFacility(facility.id);
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">Daily care</h2>
        <DemonstrationMark>Demonstration data</DemonstrationMark>
      </div>
      <p className="text-sm text-white/60">
        Sample yard routine for this facility. Completion marks are not live staff confirmations. Feed quantities are
        not stored.
      </p>
      {CARE_GROUPS.map((group) => {
        const rows = tasks.filter((task) => task.group === group.id);
        return (
          <section key={group.id} className={`${wolfCardClass} px-4 py-4`}>
            <h3 className="text-sm font-semibold text-white">{group.title}</h3>
            {rows.length === 0 ? (
              <p className="mt-2 text-sm text-white/55">No sample item in this group.</p>
            ) : (
              <ul className="mt-3 divide-y divide-white/10">
                {rows.map((task) => (
                  <li key={task.id} className="grid gap-1 py-3 text-sm sm:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,0.8fr))]">
                    <div>
                      <p className="font-medium text-white">{task.title}</p>
                      <p className="mt-1 text-xs text-white/45">{task.detail}</p>
                    </div>
                    <p className="text-white/70">{horseName(facility, task.horseId)}</p>
                    <p className="text-white/70">{staffName(facility.id, task.staffId)}</p>
                    <p className="text-white/70">
                      {task.scheduleLabel}
                      <span className="mt-1 block text-xs uppercase tracking-wide text-amber-100/80">
                        {task.status === "complete" ? "Sample complete" : "Sample outstanding"}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function StableStaffPanel({ facility }: { facility: StableFacility }) {
  const staff = staffForFacility(facility.id);
  const tasks = careTasksForFacility(facility.id);
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">Staff</h2>
        <DemonstrationMark>Demonstration data</DemonstrationMark>
      </div>
      <p className="text-sm text-white/60">
        Sample roles for this facility. No WOLF user account is created and no notification is sent.
      </p>
      <ul className="grid gap-3 lg:grid-cols-2">
        {staff.map((member) => {
          const assigned = tasks.filter((task) => task.staffId === member.id);
          const horses = member.horseIds
            .map((id) => stableHorse(facility, id)?.name)
            .filter((name): name is string => Boolean(name));
          return (
            <li key={member.id} className={`${wolfCardClass} px-4 py-4`}>
              <p className="text-base font-semibold text-white">{member.name}</p>
              <p className="mt-1 text-sm text-emerald-100/80">{member.role}</p>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className={wolfMetricLabelClass}>Contact</dt>
                  <dd className="mt-1 text-white/70">{member.contact ?? NOT_IN_DEMONSTRATION}</dd>
                </div>
                <div>
                  <dt className={wolfMetricLabelClass}>Responsibilities</dt>
                  <dd className="mt-1 text-white/70">{member.responsibilities.join(", ")}</dd>
                </div>
                <div>
                  <dt className={wolfMetricLabelClass}>Horses</dt>
                  <dd className="mt-1 text-white/70">{horses.length ? horses.join(", ") : "None assigned"}</dd>
                </div>
              </dl>
              <ul className="mt-3 space-y-1">
                {assigned.length === 0 ? (
                  <li className="text-xs text-white/45">No sample task allocated.</li>
                ) : (
                  assigned.map((task) => (
                    <li key={task.id} className="text-xs text-white/70">
                      {task.title} · {task.status === "complete" ? "Sample complete" : "Sample outstanding"}
                    </li>
                  ))
                )}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function StableFacilitiesPanel({ facility }: { facility: StableFacility }) {
  const extras = infrastructureForFacility(facility.id);
  const maintenance = maintenanceForFacility(facility.id);
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">Facilities</h2>
        <DemonstrationMark>Demonstration data</DemonstrationMark>
      </div>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {facility.areas.map((area) => {
          const horse = stableHorse(facility, area.horseId);
          const cameras = facility.cameras.filter((camera) => camera.areaId === area.id);
          return (
            <article key={area.id} className={`${wolfCardClass} px-4 py-3`}>
              <p className="text-sm font-semibold text-white">{area.name}</p>
              <p className="mt-1 text-xs text-white/45">Stable box · In the demonstration layout</p>
              <p className="mt-2 text-sm text-white/75">Horse: {horse?.name ?? "None"}</p>
              <p className="text-sm text-white/75">
                Camera: {cameras.map((camera) => camera.name).join(", ") || "None"}
              </p>
            </article>
          );
        })}
        {extras.map((area) => (
          <article key={area.id} className={`${wolfCardClass} px-4 py-3`}>
            <p className="text-sm font-semibold text-white">{area.name}</p>
            <p className="mt-1 text-xs text-white/45">
              {area.type} · {area.status}
            </p>
            <p className="mt-2 text-sm text-white/75">
              Horses:{" "}
              {area.horseIds.length
                ? area.horseIds.map((id) => horseName(facility, id)).join(", ")
                : "None assigned"}
            </p>
            <p className="text-sm text-white/75">
              Cameras: {area.cameraIds.length ? area.cameraIds.join(", ") : "None"}
            </p>
          </article>
        ))}
        <article className={`${wolfCardClass} px-4 py-3`}>
          <p className="text-sm font-semibold text-white">Environmental sensors</p>
          <p className="mt-1 text-xs text-white/45">Not connected</p>
          <p className="mt-2 text-sm text-white/75">
            Temperature, humidity, air quality, and ventilation on the overview are demonstration readings.
            CO₂ and ammonia are not in this data set.
          </p>
        </article>
      </section>
      <section className={`${wolfCardClass} px-4 py-4`}>
        <h3 className="text-sm font-semibold text-white">Maintenance</h3>
        <ul className="mt-3 space-y-2">
          {maintenance.map((item) => (
            <li key={item.id} className="rounded-xl border border-white/10 px-3 py-2">
              <p className="text-sm text-white">{item.title}</p>
              <p className="mt-1 text-xs text-white/50">
                {item.detail}
                {item.areaId ? ` · ${stableArea(facility, item.areaId)?.name ?? item.areaId}` : ""}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/80">
                {item.status === "outstanding" ? "Sample outstanding" : "Demonstration note"}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function StableReportsPanel({ facility }: { facility: StableFacility }) {
  const tasks = careTasksForFacility(facility.id);
  const complete = tasks.filter((task) => task.status === "complete").length;
  const groups = [
    {
      title: "Horse reports",
      rows: [
        `Horse directory — ${facility.horses.length} demonstration horses`,
        "Horse movements — current area assignment only; no earlier move is stored",
        "Health history — no clinical file",
        "Veterinary appointments — sample slots, not bookings",
        "Vaccination records — none stored",
        "Exercise history — sample tasks only",
      ],
    },
    {
      title: "Operational reports",
      rows: [
        `Daily care — ${complete} sample complete, ${tasks.length - complete} sample outstanding`,
        "Feeding records — schedule labels only; quantities are not stored",
        "Staff task completion — sample marks, not live confirmations",
        `Facility activity — ${activitiesForFacility(facility.id).length} demonstration entries`,
      ],
    },
    {
      title: "Incident reports",
      rows: [
        "Health incidents — none stored",
        "Environmental incidents — none stored; readings are simulated",
        "Security and monitoring incidents — none stored",
        "Camera outages — none recorded. Open Cameras to see whether Camera 05 is receiving frames",
      ],
    },
    {
      title: "Facility reports",
      rows: [
        `Stable occupancy — ${facility.horses.length} horses assigned across ${facility.areas.length} areas`,
        `Other areas — ${infrastructureForFacility(facility.id).length} demonstration spaces`,
        `Cameras — ${facility.cameras.filter((camera) => camera.mode === "simulated").length} stills, ${facility.cameras.filter((camera) => camera.mode === "webrtc").length} WebRTC path`,
        `Maintenance — ${maintenanceForFacility(facility.id).filter((item) => item.status === "outstanding").length} sample item outstanding`,
      ],
    },
  ];

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">Reports</h2>
        <DemonstrationMark>Demonstration data</DemonstrationMark>
      </div>
      <p className="text-sm text-white/60">
        Counts below are taken from the Windsor demonstration record. They are not operational results.
      </p>
      {groups.map((group) => (
        <section key={group.title} className={`${wolfCardClass} px-4 py-4`}>
          <h3 className="text-sm font-semibold text-white">{group.title}</h3>
          <ul className="mt-3 space-y-2">
            {group.rows.map((row) => (
              <li key={row} className="text-sm text-white/75">
                {row}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function StableSettingsPanel({ facility }: { facility: StableFacility }) {
  const cameras = stableCamerasInMonitorOrder(facility);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className={`${wolfCardClass} px-4 py-4`}>
        <h2 className="text-sm font-semibold text-white">Facility information</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className={wolfMetricLabelClass}>Name</dt>
            <dd className="mt-1 text-white">{facility.name}</dd>
          </div>
          <div>
            <dt className={wolfMetricLabelClass}>Location</dt>
            <dd className="mt-1 text-white">{facility.location}</dd>
          </div>
          <div>
            <dt className={wolfMetricLabelClass}>Record</dt>
            <dd className="mt-1 text-white/70">Demonstration facility. Changes on this page are not saved.</dd>
          </div>
        </dl>
      </section>
      <section className={`${wolfCardClass} px-4 py-4`}>
        <h2 className="text-sm font-semibold text-white">Stable areas</h2>
        <ul className="mt-3 space-y-1 text-sm text-white/75">
          {facility.areas.map((area) => (
            <li key={area.id}>{area.name}</li>
          ))}
        </ul>
      </section>
      <section className={`${wolfCardClass} px-4 py-4`}>
        <h2 className="text-sm font-semibold text-white">Cameras</h2>
        <ul className="mt-3 space-y-2 text-sm text-white/75">
          {cameras.map((camera) => (
            <li key={camera.id}>
              {camera.name} · {stableArea(facility, camera.areaId)?.name} ·{" "}
              {camera.mode === "webrtc" ? "Existing Ground WebRTC path" : "Demonstration still"}
            </li>
          ))}
        </ul>
      </section>
      <section className={`${wolfCardClass} px-4 py-4`}>
        <h2 className="text-sm font-semibold text-white">Environmental sensors</h2>
        <p className="mt-3 text-sm text-white/70">
          Sensor id: none. Source: simulated readings. No sensor is connected.
        </p>
      </section>
      <section className={`${wolfCardClass} px-4 py-4`}>
        <h2 className="text-sm font-semibold text-white">Staff permissions</h2>
        <p className="mt-3 text-sm text-white/70">
          Access follows the existing WOLF Central workspace. This screen does not grant accounts or change permissions.
        </p>
      </section>
      <section className={`${wolfCardClass} px-4 py-4`}>
        <h2 className="text-sm font-semibold text-white">Alert preferences</h2>
        <ul className="mt-3 space-y-2">
          {facility.alerts.map((alert) => (
            <li key={alert.id} className="text-sm text-white/75">
              {alert.title}
              <span className="mt-1 block text-xs uppercase tracking-wide text-amber-100/80">
                Inactive demonstration scenario
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function StableCameraRegister({
  facility,
  linkStatus,
}: {
  facility: StableFacility;
  linkStatus: WolfGroundWebRtcLinkStatus;
}) {
  const cameras = stableCamerasInMonitorOrder(facility);
  const rows = useMemo(
    () =>
      cameras.map((camera) => ({
        camera,
        area: stableArea(facility, camera.areaId)?.name ?? "",
        copy: cameraConnectionCopy(camera, linkStatus),
      })),
    [cameras, facility, linkStatus],
  );

  return (
    <section className={`${wolfCardClass} mt-4 overflow-x-auto px-4 py-4`}>
      <h2 className="text-sm font-semibold text-white">Camera register</h2>
      <table className="mt-3 w-full min-w-[640px] text-left text-sm">
        <thead className="text-[11px] uppercase tracking-[0.14em] text-white/40">
          <tr>
            <th className="py-2 pr-3 font-medium">Camera</th>
            <th className="py-2 pr-3 font-medium">Area</th>
            <th className="py-2 pr-3 font-medium">Type</th>
            <th className="py-2 pr-3 font-medium">Status</th>
            <th className="py-2 font-medium">Last connection</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.camera.id} className="border-t border-white/10 text-white/80">
              <td className="py-2 pr-3">{row.camera.name}</td>
              <td className="py-2 pr-3">{row.area}</td>
              <td className="py-2 pr-3">{row.copy.type}</td>
              <td className="py-2 pr-3">{row.copy.status}</td>
              <td className="py-2">{row.copy.last}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function horseMatchesFilters(
  horse: StableHorse,
  facility: StableFacility,
  query: string,
  status: string,
  areaId: string,
): boolean {
  const name = horse.name.toLowerCase();
  if (query && !name.includes(query.trim().toLowerCase())) return false;
  if (status !== "all" && horse.status !== status) return false;
  if (areaId !== "all" && horse.areaId !== areaId) return false;
  return stableArea(facility, horse.areaId) != null;
}
