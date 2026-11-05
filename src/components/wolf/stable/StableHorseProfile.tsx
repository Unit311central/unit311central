"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { wolfCardClass, wolfEyebrowClass, wolfMetricLabelClass } from "@/components/wolf/wolf-ui";
import { stableArea, type StableFacility, type StableHorse } from "@/lib/wolf/stable/demo-data";
import {
  activitiesForFacility,
  appointmentsForFacility,
  careTasksForFacility,
  infrastructureForFacility,
  staffForFacility,
} from "@/lib/wolf/stable/demo-operations";

import { DemonstrationMark, horseStatusLabel, NOT_IN_DEMONSTRATION } from "./stable-ui";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className={wolfMetricLabelClass}>{label}</dt>
      <dd className="mt-1 text-sm text-white">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={`${wolfCardClass} px-4 py-4`}>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function StableHorseProfile({
  facility,
  horse,
  backHref,
}: {
  facility: StableFacility;
  horse: StableHorse;
  backHref: string;
}) {
  const area = stableArea(facility, horse.areaId);
  const paddock = infrastructureForFacility(facility.id).find(
    (areaItem) => areaItem.type === "Paddock" && areaItem.horseIds.includes(horse.id),
  );
  const tasks = careTasksForFacility(facility.id).filter((task) => task.horseId === horse.id);
  const yardFeeds = careTasksForFacility(facility.id).filter(
    (task) => task.group === "feeding" && task.horseId == null,
  );
  const appointments = appointmentsForFacility(facility.id).filter((item) => item.horseId === horse.id);
  const activities = activitiesForFacility(facility.id).filter((item) => item.horseId === horse.id);
  const staff = staffForFacility(facility.id).filter((member) => member.horseIds.includes(horse.id));
  const recordSlots = [
    horse.veterinary,
    horse.medication,
    horse.healthMonitoring,
    horse.ownership,
  ];

  const timeline = [
    {
      id: "assignment",
      when: "Current demonstration assignment",
      title: `Assigned to ${area?.name ?? "an area"}`,
      detail: "No earlier movement is stored.",
    },
    ...activities.map((item) => ({
      id: item.id,
      when: item.whenLabel,
      title: item.title,
      detail: item.detail,
    })),
    ...appointments.map((item) => ({
      id: item.id,
      when: item.whenLabel,
      title: item.title,
      detail: "Sample appointment. No clinical file is attached.",
    })),
    ...tasks.map((item) => ({
      id: item.id,
      when: item.scheduleLabel,
      title: item.title,
      detail: item.detail,
    })),
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link href={backHref} className="text-sm text-white/70 underline-offset-2 hover:text-white hover:underline">
          All horses
        </Link>
        <DemonstrationMark>Demonstration profile</DemonstrationMark>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        <div className={`${wolfCardClass} overflow-hidden`}>
          <img src={horse.photo} alt="" className="aspect-[4/3] w-full object-cover" />
          <div className="px-4 py-4">
            <p className={wolfEyebrowClass}>Identification</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">{horse.name}</h2>
            <p className="mt-2 text-sm text-white/70">{horse.summary}</p>
            <p className="mt-3 text-sm text-white/80">{horseStatusLabel(horse.status)}</p>
          </div>
        </div>
        <Section title="Identification">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Field label="Breed" value={horse.breed} />
            <Field label="Age" value={`${horse.ageYears} years`} />
            <Field label="Sex" value={horse.sex} />
            <Field label="Colour and markings" value={horse.colour} />
            <Field label="Date of birth" value={NOT_IN_DEMONSTRATION} />
            <Field label="Passport number" value={NOT_IN_DEMONSTRATION} />
            <Field label="Microchip number" value={NOT_IN_DEMONSTRATION} />
            <Field label="Owner" value={NOT_IN_DEMONSTRATION} />
            <Field label="Insurance" value={NOT_IN_DEMONSTRATION} />
          </dl>
        </Section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Section title="Location and allocation">
          <dl className="grid gap-3 sm:grid-cols-2">
            <Field label="Assigned stable" value={facility.name} />
            <Field label="Current stable box" value={area?.name ?? NOT_IN_DEMONSTRATION} />
            <Field label="Paddock allocation" value={paddock?.name ?? "No paddock is assigned"} />
            <Field label="Previous locations" value="No earlier location is stored." />
          </dl>
          <p className="mt-3 text-xs text-white/45">Movement history is the demonstration timeline below.</p>
        </Section>

        <Section title="Health history">
          <p className="text-sm text-white/70">No clinical records are stored for this horse.</p>
          <ul className="mt-3 space-y-2">
            {recordSlots.map((slot) => (
              <li key={slot.label} className="rounded-xl border border-white/10 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">{slot.label}</p>
                <p className="mt-1 text-sm text-white/55">
                  {slot.entries ? "Records on file" : "No records in this demonstration"}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
              Sample appointments
            </p>
            {appointments.length === 0 ? (
              <p className="text-sm text-white/55">No sample appointment is attached to this horse.</p>
            ) : (
              appointments.map((item) => (
                <p key={item.id} className="text-sm text-white/80">
                  {item.title}
                  <span className="text-white/45"> · {item.whenLabel} · Demonstration</span>
                </p>
              ))
            )}
          </div>
        </Section>

        <Section title="Daily care">
          <p className="text-sm text-white/70">No measured feed quantity or special diet is stored.</p>
          <ul className="mt-3 space-y-2">
            {yardFeeds.map((task) => (
              <li key={task.id} className="text-sm text-white/80">
                {task.title}
                <span className="text-white/45"> · {task.scheduleLabel} · Yard sample, not a horse ration</span>
              </li>
            ))}
            {tasks.length === 0 ? (
              <li className="text-sm text-white/55">No horse-specific care task is in the sample routine.</li>
            ) : (
              tasks.map((task) => (
                <li key={task.id} className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white">
                  <p>{task.title}</p>
                  <p className="mt-1 text-xs text-white/50">
                    {task.scheduleLabel} · {task.status === "complete" ? "Sample complete" : "Sample outstanding"} ·{" "}
                    {task.detail}
                  </p>
                </li>
              ))
            )}
          </ul>
          <p className="mt-3 text-xs text-white/45">
            Grooming, turnout, and exercise above are sample tasks. Staff:{" "}
            {staff.length ? staff.map((member) => member.name).join(", ") : "none assigned"}.
          </p>
        </Section>

        <Section title="Activity and exercise">
          {activities.length === 0 && tasks.filter((task) => task.group === "exercise").length === 0 ? (
            <p className="text-sm text-white/55">No exercise session or rest period is recorded.</p>
          ) : (
            <ul className="space-y-2">
              {activities.map((item) => (
                <li key={item.id} className="text-sm text-white/80">
                  {item.title}
                  <span className="text-white/45"> · {item.detail}</span>
                </li>
              ))}
              {tasks
                .filter((task) => task.group === "exercise")
                .map((task) => (
                  <li key={task.id} className="text-sm text-white/80">
                    {task.title}
                    <span className="text-white/45"> · {task.detail}</span>
                  </li>
                ))}
            </ul>
          )}
        </Section>

        <Section title="Documents and images">
          <div className="flex items-center gap-3">
            <img src={horse.photo} alt="" className="h-16 w-16 rounded-lg object-cover" />
            <p className="text-sm text-white/70">One demonstration photograph is on file.</p>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-white/55">
            <li>Veterinary documents — {NOT_IN_DEMONSTRATION}</li>
            <li>Passport documents — {NOT_IN_DEMONSTRATION}</li>
            <li>Insurance documents — {NOT_IN_DEMONSTRATION}</li>
            <li>Other attachments — none</li>
          </ul>
        </Section>

        <Section title="Historical timeline">
          <ol className="space-y-3">
            {timeline.map((item) => (
              <li key={item.id} className="border-l border-white/15 pl-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-200/80">{item.when}</p>
                <p className="mt-1 text-sm text-white">{item.title}</p>
                <p className="mt-1 text-xs text-white/50">{item.detail}</p>
              </li>
            ))}
          </ol>
        </Section>
      </div>
    </div>
  );
}
