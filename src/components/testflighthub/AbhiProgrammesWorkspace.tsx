"use client";

import {
  Building2,
  Calendar,
  Check,
  ChevronRight,
  Hospital,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  addMember,
  deleteAcceleratorCohort,
  deleteAcceleratorScheduleItem,
  deleteWorkingGroup,
  deleteWorkingGroupPerson,
  listAcceleratorCohorts,
  toggleAcceleratorCompany,
  toggleWorkingGroupMeetingAttendee,
  updateAcceleratorCohortPlan,
  updateMember,
  updateWorkingGroupMeeting,
  upsertAcceleratorCohort,
  upsertAcceleratorScheduleItem,
  upsertWorkingGroup,
  upsertWorkingGroupPerson,
  type AbhiAcceleratorCohort,
  type AbhiAcceleratorRegion,
  type AbhiAcceleratorScheduleItem,
  type AbhiAcceleratorStatus,
  type AbhiAcceleratorVisitTarget,
  type AbhiAcceleratorVisitType,
  type AbhiMemberCompany,
  type AbhiWorkingGroup,
  type AbhiWorkingGroupPerson,
} from "@/lib/abhi-marketing-store";
import { cn } from "@/lib/utils";
import { useAbhiMarketingStore } from "./useAbhiMarketingStore";
import {
  TqmsEmpty,
  TqmsSection,
  TqmsSlideOver,
  TqmsStatusPill,
  tqmsInputClass,
  tqmsLabelClass,
  tqmsPrimaryButtonClass,
  tqmsSecondaryButtonClass,
} from "./tqms-ui";

export type AbhiProgrammesMode = "working-groups" | "us-accelerator" | "me-accelerator";

type GroupFormState = {
  id: string | null;
  name: string;
  description: string;
  lead: string;
  meetingCadence: string;
};

type PersonFormState = {
  id: string | null;
  name: string;
  company: string;
  email: string;
  role: string;
};

function emptyGroupForm(): GroupFormState {
  return { id: null, name: "", description: "", lead: "", meetingCadence: "Monthly" };
}

function groupFormFrom(group: AbhiWorkingGroup): GroupFormState {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    lead: group.lead,
    meetingCadence: group.meetingCadence,
  };
}

function emptyPersonForm(): PersonFormState {
  return { id: null, name: "", company: "", email: "", role: "Member" };
}

function personFormFrom(person: AbhiWorkingGroupPerson): PersonFormState {
  return {
    id: person.id,
    name: person.name,
    company: person.company,
    email: person.email,
    role: person.role,
  };
}

function formatMeetingDate(date: string, time: string) {
  const parsed = Date.parse(`${date}T${time || "00:00"}`);
  if (Number.isNaN(parsed)) return date;
  const formatted = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(parsed));
  return time ? `${formatted} · ${time}` : formatted;
}

function formatScheduleRange(startDate: string, endDate: string) {
  const fmt = (value: string) =>
    new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
      new Date(value),
    );
  if (startDate === endDate) return fmt(startDate);
  return `${fmt(startDate)} – ${fmt(endDate)}`;
}

const VISIT_TYPE_META: Record<
  AbhiAcceleratorVisitType,
  { label: string; icon: typeof Building2; pill: string }
> = {
  company: {
    label: "Company",
    icon: Building2,
    pill: "border-violet-400/30 bg-violet-500/10 text-violet-200",
  },
  hospital: {
    label: "Hospital",
    icon: Hospital,
    pill: "border-sky-400/30 bg-sky-500/10 text-sky-200",
  },
  "health-system": {
    label: "Health system",
    icon: Building2,
    pill: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  },
};

function WorkingGroupMeetingsPanel({
  group,
  selectedMeetingId,
  onSelectMeeting,
}: {
  group: AbhiWorkingGroup;
  selectedMeetingId: string | null;
  onSelectMeeting: (id: string | null) => void;
}) {
  const meetings = useMemo(
    () => [...group.meetings].sort((a, b) => Date.parse(a.scheduledDate) - Date.parse(b.scheduledDate)),
    [group.meetings],
  );

  if (meetings.length === 0) {
    return (
      <TqmsSection title="Upcoming meetings" subtitle="Scheduled sessions for this working group.">
        <TqmsEmpty message="No upcoming meetings scheduled." />
      </TqmsSection>
    );
  }

  return (
    <TqmsSection
      title="Upcoming meetings"
      subtitle={`${meetings.length} session${meetings.length === 1 ? "" : "s"} · record attendance and notes`}
    >
      <div className="space-y-3">
        {meetings.map((meeting) => {
          const expanded = selectedMeetingId === meeting.id;
          const attendedCount = meeting.attendeePersonIds.length;
          return (
            <div
              key={meeting.id}
              className={cn(
                "rounded-xl border transition-colors",
                expanded
                  ? "border-sky-400/35 bg-sky-500/[0.07]"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20",
              )}
            >
              <button
                type="button"
                onClick={() => onSelectMeeting(expanded ? null : meeting.id)}
                className="flex w-full items-start justify-between gap-3 p-3.5 text-left"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{meeting.title}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/50">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatMeetingDate(meeting.scheduledDate, meeting.scheduledTime)}
                    </span>
                    {meeting.location ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {meeting.location}
                      </span>
                    ) : null}
                  </p>
                  {meeting.agenda ? (
                    <p className="mt-1.5 line-clamp-2 text-xs text-white/45">{meeting.agenda}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <TqmsStatusPill className="border-white/15 bg-white/[0.04] text-white/60">
                    {attendedCount}/{group.people.length} RSVP
                  </TqmsStatusPill>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 text-white/35 transition-transform",
                      expanded && "rotate-90 text-sky-300",
                    )}
                  />
                </div>
              </button>

              {expanded ? (
                <div className="space-y-4 border-t border-white/10 px-3.5 pb-3.5 pt-3">
                  <div>
                    <p className={tqmsLabelClass()}>Attendance</p>
                    {group.people.length === 0 ? (
                      <p className="mt-2 text-xs text-white/45">Add members to record attendance.</p>
                    ) : (
                      <ul className="mt-2 space-y-1.5">
                        {group.people.map((person) => {
                          const attended = meeting.attendeePersonIds.includes(person.id);
                          return (
                            <li key={person.id}>
                              <button
                                type="button"
                                onClick={() =>
                                  toggleWorkingGroupMeetingAttendee(group.id, meeting.id, person.id)
                                }
                                className={cn(
                                  "flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left text-sm transition-colors",
                                  attended
                                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                                    : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20",
                                )}
                              >
                                <span
                                  className={cn(
                                    "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                                    attended
                                      ? "border-emerald-400/40 bg-emerald-500/20"
                                      : "border-white/15 bg-white/[0.03]",
                                  )}
                                >
                                  {attended ? <Check className="h-3 w-3" /> : null}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="font-medium">{person.name}</span>
                                  <span className="ml-1.5 text-xs text-white/45">
                                    {[person.role, person.company].filter(Boolean).join(" · ")}
                                  </span>
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  <label className="block">
                    <span className={tqmsLabelClass()}>Meeting notes</span>
                    <textarea
                      value={meeting.notes}
                      onChange={(e) =>
                        updateWorkingGroupMeeting(group.id, meeting.id, { notes: e.target.value })
                      }
                      rows={4}
                      placeholder="Decisions, actions, follow-ups…"
                      className={cn(tqmsInputClass(), "mt-1.5 resize-none")}
                    />
                  </label>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </TqmsSection>
  );
}

function WorkingGroupsPanel({ groups }: { groups: AbhiWorkingGroup[] }) {
  useAbhiMarketingStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<GroupFormState>(emptyGroupForm());
  const [personFormOpen, setPersonFormOpen] = useState(false);
  const [personForm, setPersonForm] = useState<PersonFormState>(emptyPersonForm());

  useEffect(() => {
    if (groups.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !groups.some((row) => row.id === selectedId)) {
      setSelectedId(groups[0]?.id ?? null);
    }
  }, [groups, selectedId]);

  const selected = groups.find((row) => row.id === selectedId) ?? null;

  function openCreate() {
    setPersonFormOpen(false);
    setForm(emptyGroupForm());
    setFormOpen(true);
  }

  function openDetail(group: AbhiWorkingGroup) {
    setFormOpen(false);
    setPersonFormOpen(false);
    setSelectedMeetingId(null);
    setSelectedId(group.id);
  }

  function openEdit(group: AbhiWorkingGroup) {
    setPersonFormOpen(false);
    setForm(groupFormFrom(group));
    setFormOpen(true);
  }

  function handleDeleteGroup(group: AbhiWorkingGroup) {
    const ok = window.confirm(`Delete “${group.name}”? This cannot be undone.`);
    if (!ok) return;
    deleteWorkingGroup(group.id);
    if (selectedId === group.id) {
      setSelectedId(null);
      setSelectedMeetingId(null);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return;
    const saved = upsertWorkingGroup({
      id: form.id ?? undefined,
      name: form.name.trim(),
      description: form.description.trim(),
      lead: form.lead.trim(),
      meetingCadence: form.meetingCadence.trim(),
    });
    setFormOpen(false);
    setSelectedId(saved.id);
  }

  function openAddPerson() {
    setPersonForm(emptyPersonForm());
    setPersonFormOpen(true);
  }

  function openEditPerson(person: AbhiWorkingGroupPerson) {
    setPersonForm(personFormFrom(person));
    setPersonFormOpen(true);
  }

  function handlePersonSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !personForm.name.trim()) return;
    upsertWorkingGroupPerson(selected.id, {
      id: personForm.id ?? undefined,
      name: personForm.name.trim(),
      company: personForm.company.trim(),
      email: personForm.email.trim(),
      role: personForm.role.trim() || "Member",
    });
    setPersonFormOpen(false);
  }

  function handleDeletePerson(person: AbhiWorkingGroupPerson) {
    if (!selected) return;
    const ok = window.confirm(`Remove ${person.name} from this group?`);
    if (!ok) return;
    deleteWorkingGroupPerson(selected.id, person.id);
    if (personForm.id === person.id) setPersonFormOpen(false);
  }

  return (
    <div className="space-y-5">
      <TqmsSection
        title="ABHI Working Groups"
        subtitle="Member-led groups shaping ABHI policy positions and programmes."
        actions={
          <button type="button" onClick={openCreate} className={tqmsPrimaryButtonClass()}>
            <Plus className="h-3.5 w-3.5" />
            Add Group
          </button>
        }
      >
        {groups.length === 0 ? (
          <TqmsEmpty message="No working groups yet." />
        ) : (
          <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
            <div className="space-y-4">
              <div>
                <p className={tqmsLabelClass()}>Groups</p>
                <ul className="mt-2 space-y-2">
                  {groups.map((group) => {
                    const active = group.id === selectedId;
                    return (
                      <li key={group.id}>
                        <div
                          className={cn(
                            "rounded-xl border transition-colors",
                            active
                              ? "border-sky-400/40 bg-sky-500/10"
                              : "border-white/10 bg-white/[0.03] hover:border-white/20",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2 p-3">
                            <button
                              type="button"
                              onClick={() => openDetail(group)}
                              className="min-w-0 flex-1 text-left"
                            >
                              <p className="text-sm font-semibold text-white hover:text-sky-200">
                                {group.name}
                              </p>
                              <p className="mt-1 line-clamp-2 text-xs text-white/50">{group.description}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-white/45">
                                <TqmsStatusPill className="border-white/15 bg-white/[0.04] text-white/60">
                                  Lead: {group.lead || "—"}
                                </TqmsStatusPill>
                                <TqmsStatusPill className="border-white/15 bg-white/[0.04] text-white/60">
                                  {group.meetingCadence}
                                </TqmsStatusPill>
                                <TqmsStatusPill className="border-sky-400/25 bg-sky-500/10 text-sky-200">
                                  <Users className="mr-1 inline h-3 w-3" />
                                  {group.people.length}
                                </TqmsStatusPill>
                              </div>
                            </button>
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEdit(group)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/45 transition-colors hover:border-sky-400/40 hover:text-sky-200"
                                aria-label={`Edit ${group.name}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteGroup(group)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/35 transition-colors hover:border-rose-400/40 hover:text-rose-300"
                                aria-label={`Delete ${group.name}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {selected ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{selected.name}</p>
                      <p className="mt-1 text-xs text-white/50">
                        Led by {selected.lead || "—"} · {selected.meetingCadence}
                      </p>
                    </div>
                    <button type="button" onClick={openAddPerson} className={tqmsSecondaryButtonClass()}>
                      <Plus className="h-3.5 w-3.5" />
                      Add member
                    </button>
                  </div>
                  <p className="mb-3 text-xs leading-relaxed text-white/60">{selected.description}</p>

                  <p className="text-sm font-medium text-white">
                    Members <span className="text-white/40">({selected.people.length})</span>
                  </p>
                  {selected.people.length === 0 ? (
                    <p className="mt-2 rounded-lg border border-dashed border-white/15 px-3 py-5 text-center text-xs text-white/45">
                      No members yet.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-1.5">
                      {selected.people.map((person) => (
                        <li
                          key={person.id}
                          className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white">{person.name}</p>
                              <p className="text-xs text-white/50">
                                {[person.role, person.company].filter(Boolean).join(" · ")}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEditPerson(person)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-white/45 hover:border-sky-400/40 hover:text-sky-200"
                                aria-label={`Edit ${person.name}`}
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePerson(person)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-white/35 hover:border-rose-400/40 hover:text-rose-300"
                                aria-label={`Remove ${person.name}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {personFormOpen ? (
                    <form
                      className="mt-3 space-y-3 rounded-xl border border-sky-400/25 bg-sky-500/5 p-3"
                      onSubmit={handlePersonSubmit}
                    >
                      <p className="text-sm font-medium text-white">
                        {personForm.id ? "Edit member" : "Add member"}
                      </p>
                      <label className="block">
                        <span className={tqmsLabelClass()}>Name</span>
                        <input
                          value={personForm.name}
                          onChange={(e) => setPersonForm((c) => ({ ...c, name: e.target.value }))}
                          className={tqmsInputClass()}
                          required
                        />
                      </label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                          <span className={tqmsLabelClass()}>Company</span>
                          <input
                            value={personForm.company}
                            onChange={(e) => setPersonForm((c) => ({ ...c, company: e.target.value }))}
                            className={tqmsInputClass()}
                          />
                        </label>
                        <label className="block">
                          <span className={tqmsLabelClass()}>Role</span>
                          <input
                            value={personForm.role}
                            onChange={(e) => setPersonForm((c) => ({ ...c, role: e.target.value }))}
                            placeholder="Member, Lead, Chair…"
                            className={tqmsInputClass()}
                          />
                        </label>
                      </div>
                      <label className="block">
                        <span className={tqmsLabelClass()}>Email</span>
                        <input
                          type="email"
                          value={personForm.email}
                          onChange={(e) => setPersonForm((c) => ({ ...c, email: e.target.value }))}
                          className={tqmsInputClass()}
                        />
                      </label>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setPersonFormOpen(false)}
                          className={tqmsSecondaryButtonClass()}
                        >
                          Cancel
                        </button>
                        <button type="submit" className={tqmsPrimaryButtonClass()}>
                          {personForm.id ? "Save member" : "Add member"}
                        </button>
                      </div>
                    </form>
                  ) : null}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-white/15 px-3 py-8 text-center text-sm text-white/45">
                  Select a working group to view members.
                </p>
              )}
            </div>

            <div>
              {selected ? (
                <WorkingGroupMeetingsPanel
                  group={selected}
                  selectedMeetingId={selectedMeetingId}
                  onSelectMeeting={setSelectedMeetingId}
                />
              ) : (
                <TqmsSection title="Upcoming meetings" subtitle="Select a group to view its schedule.">
                  <TqmsEmpty message="Pick a working group on the left." />
                </TqmsSection>
              )}
            </div>
          </div>
        )}
      </TqmsSection>

      {formOpen ? (
        <TqmsSlideOver
          title={form.id ? "Edit working group" : "Add working group"}
          subtitle="Update group details. Manage people from the group view."
          onClose={() => setFormOpen(false)}
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className={tqmsLabelClass()}>Name</span>
              <input
                value={form.name}
                onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                className={tqmsInputClass()}
                required
              />
            </label>
            <label className="block">
              <span className={tqmsLabelClass()}>Description</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
                rows={3}
                className={cn(tqmsInputClass(), "resize-none")}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={tqmsLabelClass()}>Lead</span>
                <input
                  value={form.lead}
                  onChange={(e) => setForm((c) => ({ ...c, lead: e.target.value }))}
                  className={tqmsInputClass()}
                />
              </label>
              <label className="block">
                <span className={tqmsLabelClass()}>Meeting cadence</span>
                <input
                  value={form.meetingCadence}
                  onChange={(e) => setForm((c) => ({ ...c, meetingCadence: e.target.value }))}
                  className={tqmsInputClass()}
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setFormOpen(false)} className={tqmsSecondaryButtonClass()}>
                Cancel
              </button>
              <button type="submit" className={tqmsPrimaryButtonClass()}>
                {form.id ? "Save changes" : "Create group"}
              </button>
            </div>
          </form>
        </TqmsSlideOver>
      ) : null}
    </div>
  );
}

type CohortFormState = {
  id: string | null;
  cohortName: string;
  location: string;
  startYear: string;
  status: AbhiAcceleratorStatus;
  programmeLead: string;
  notes: string;
};

type CompanyFormState = {
  id: string | null;
  companyName: string;
  contactEmail: string;
};

function emptyCohortForm(): CohortFormState {
  return {
    id: null,
    cohortName: "",
    location: "",
    startYear: String(new Date().getFullYear()),
    status: "recruiting",
    programmeLead: "",
    notes: "",
  };
}

function cohortFormFrom(cohort: AbhiAcceleratorCohort): CohortFormState {
  return {
    id: cohort.id,
    cohortName: cohort.cohortName,
    location: cohort.location,
    startYear: String(cohort.startYear),
    status: cohort.status,
    programmeLead: cohort.programmeLead,
    notes: cohort.notes,
  };
}

function emptyCompanyForm(): CompanyFormState {
  return { id: null, companyName: "", contactEmail: "" };
}

function membersByIds(members: AbhiMemberCompany[], ids: string[]) {
  const byId = new Map(members.map((member) => [member.id, member]));
  return ids.map((id) => byId.get(id)).filter((member): member is AbhiMemberCompany => Boolean(member));
}

const STATUS_PILL_CLASS: Record<AbhiAcceleratorStatus, string> = {
  recruiting: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  active: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  completed: "border-white/15 bg-white/[0.04] text-white/55",
};

function VisitTargetCard({ target }: { target: AbhiAcceleratorVisitTarget }) {
  const meta = VISIT_TYPE_META[target.type];
  const Icon = meta.icon;
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-3.5 transition-colors",
        target.confirmed
          ? "border-emerald-400/25 bg-gradient-to-br from-emerald-500/[0.08] to-white/[0.02]"
          : "border-white/10 bg-white/[0.03]",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{target.name}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-white/50">
            <MapPin className="h-3 w-3 shrink-0" />
            {target.location}
          </p>
        </div>
        <TqmsStatusPill className={meta.pill}>
          <Icon className="mr-1 inline h-3 w-3" />
          {meta.label}
        </TqmsStatusPill>
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-white/60">{target.focus}</p>
      <div className="mt-3">
        <TqmsStatusPill
          className={
            target.confirmed
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
              : "border-amber-400/25 bg-amber-500/10 text-amber-100"
          }
        >
          {target.confirmed ? "Confirmed visit" : "Tentative"}
        </TqmsStatusPill>
      </div>
    </div>
  );
}

function AcceleratorScheduleEditor({
  cohort,
  onAddItem,
}: {
  cohort: AbhiAcceleratorCohort;
  onAddItem: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AbhiAcceleratorScheduleItem | null>(null);

  function startEdit(item: AbhiAcceleratorScheduleItem) {
    setEditingId(item.id);
    setDraft({ ...item });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  function saveEdit() {
    if (!draft) return;
    upsertAcceleratorScheduleItem(cohort.id, draft);
    cancelEdit();
  }

  const items = [...cohort.schedule].sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-white">Programme schedule</p>
        <button type="button" onClick={onAddItem} className={tqmsSecondaryButtonClass()}>
          <Plus className="h-3.5 w-3.5" />
          Add milestone
        </button>
      </div>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/15 px-3 py-5 text-center text-xs text-white/45">
          No schedule milestones yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const editing = editingId === item.id && draft;
            return (
              <li key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                {editing ? (
                  <div className="space-y-2">
                    <input
                      value={draft.label}
                      onChange={(e) => setDraft((c) => (c ? { ...c, label: e.target.value } : c))}
                      className={tqmsInputClass()}
                      placeholder="Milestone label"
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="block">
                        <span className={tqmsLabelClass()}>Start</span>
                        <input
                          type="date"
                          value={draft.startDate}
                          onChange={(e) => setDraft((c) => (c ? { ...c, startDate: e.target.value } : c))}
                          className={tqmsInputClass()}
                        />
                      </label>
                      <label className="block">
                        <span className={tqmsLabelClass()}>End</span>
                        <input
                          type="date"
                          value={draft.endDate}
                          onChange={(e) => setDraft((c) => (c ? { ...c, endDate: e.target.value } : c))}
                          className={tqmsInputClass()}
                        />
                      </label>
                    </div>
                    <textarea
                      value={draft.notes}
                      onChange={(e) => setDraft((c) => (c ? { ...c, notes: e.target.value } : c))}
                      rows={2}
                      className={cn(tqmsInputClass(), "resize-none")}
                      placeholder="Notes"
                    />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={cancelEdit} className={tqmsSecondaryButtonClass()}>
                        Cancel
                      </button>
                      <button type="button" onClick={saveEdit} className={tqmsPrimaryButtonClass()}>
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="mt-1 text-xs text-white/50">
                        {formatScheduleRange(item.startDate, item.endDate)}
                      </p>
                      {item.notes ? <p className="mt-1.5 text-xs text-white/45">{item.notes}</p> : null}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-white/45 hover:border-sky-400/40 hover:text-sky-200"
                        aria-label={`Edit ${item.label}`}
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const ok = window.confirm(`Remove “${item.label}” from the schedule?`);
                          if (!ok) return;
                          deleteAcceleratorScheduleItem(cohort.id, item.id);
                        }}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-white/35 hover:border-rose-400/40 hover:text-rose-300"
                        aria-label={`Delete ${item.label}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function AcceleratorPanel({
  region,
  title,
  subtitle,
  members,
}: {
  region: AbhiAcceleratorRegion;
  title: string;
  subtitle: string;
  members: AbhiMemberCompany[];
}) {
  useAbhiMarketingStore();
  const cohorts = listAcceleratorCohorts(region);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CohortFormState>(emptyCohortForm());
  const [companyFormOpen, setCompanyFormOpen] = useState(false);
  const [companyForm, setCompanyForm] = useState<CompanyFormState>(emptyCompanyForm());
  const [pickCompanyId, setPickCompanyId] = useState("");

  useEffect(() => {
    if (cohorts.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !cohorts.some((row) => row.id === selectedId)) {
      setSelectedId(cohorts[0]?.id ?? null);
    }
  }, [cohorts, selectedId]);

  const selected = cohorts.find((row) => row.id === selectedId) ?? null;
  const selectedCompanies = selected ? membersByIds(members, selected.companyIds) : [];
  const availableToAdd = selected
    ? members.filter((member) => !selected.companyIds.includes(member.id))
    : [];
  const confirmedVisits = selected?.visitTargets.filter((row) => row.confirmed).length ?? 0;

  function openCreate() {
    setCompanyFormOpen(false);
    setForm(emptyCohortForm());
    setFormOpen(true);
  }

  function openDetail(cohort: AbhiAcceleratorCohort) {
    setFormOpen(false);
    setCompanyFormOpen(false);
    setPickCompanyId("");
    setSelectedId(cohort.id);
  }

  function openEdit(cohort: AbhiAcceleratorCohort) {
    setCompanyFormOpen(false);
    setForm(cohortFormFrom(cohort));
    setFormOpen(true);
  }

  function handleDelete(cohort: AbhiAcceleratorCohort) {
    const ok = window.confirm(`Delete “${cohort.cohortName}”? This cannot be undone.`);
    if (!ok) return;
    deleteAcceleratorCohort(cohort.id);
    if (selectedId === cohort.id) setSelectedId(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.cohortName.trim()) return;
    const saved = upsertAcceleratorCohort({
      id: form.id ?? undefined,
      region,
      cohortName: form.cohortName.trim(),
      location: form.location.trim(),
      startYear: Number(form.startYear) || new Date().getFullYear(),
      status: form.status,
      programmeLead: form.programmeLead.trim(),
      notes: form.notes.trim(),
    });
    setFormOpen(false);
    setSelectedId(saved.id);
  }

  function openAddCompany() {
    setCompanyForm(emptyCompanyForm());
    setPickCompanyId("");
    setCompanyFormOpen(true);
  }

  function openEditCompany(company: AbhiMemberCompany) {
    setCompanyForm({
      id: company.id,
      companyName: company.companyName,
      contactEmail: company.contactEmail,
    });
    setPickCompanyId("");
    setCompanyFormOpen(true);
  }

  function handleCompanySubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !companyForm.companyName.trim()) return;
    if (companyForm.id) {
      updateMember(companyForm.id, {
        companyName: companyForm.companyName.trim(),
        contactEmail: companyForm.contactEmail.trim(),
      });
    } else {
      const member = addMember({
        companyName: companyForm.companyName.trim(),
        contactEmail:
          companyForm.contactEmail.trim() ||
          `contact@${companyForm.companyName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`,
      });
      toggleAcceleratorCompany(selected.id, member.id);
    }
    setCompanyFormOpen(false);
  }

  function handlePickExisting() {
    if (!selected || !pickCompanyId) return;
    toggleAcceleratorCompany(selected.id, pickCompanyId);
    setPickCompanyId("");
    setCompanyFormOpen(false);
  }

  function handleRemoveCompany(company: AbhiMemberCompany) {
    if (!selected) return;
    const ok = window.confirm(`Remove ${company.companyName} from this cohort?`);
    if (!ok) return;
    toggleAcceleratorCompany(selected.id, company.id);
    if (companyForm.id === company.id) setCompanyFormOpen(false);
  }

  function handleAddScheduleItem() {
    if (!selected) return;
    upsertAcceleratorScheduleItem(selected.id, {
      label: "New milestone",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      notes: "",
    });
  }

  return (
    <div className="space-y-5">
      <TqmsSection
        title={title}
        subtitle={subtitle}
        actions={
          <button type="button" onClick={openCreate} className={tqmsPrimaryButtonClass()}>
            <Plus className="h-3.5 w-3.5" />
            Add Cohort
          </button>
        }
      >
        {cohorts.length === 0 ? (
          <TqmsEmpty message="No cohorts yet." />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {cohorts.map((cohort) => {
                const active = cohort.id === selectedId;
                return (
                  <button
                    key={cohort.id}
                    type="button"
                    onClick={() => openDetail(cohort)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                        : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white",
                    )}
                  >
                    {cohort.cohortName}
                  </button>
                );
              })}
            </div>

            {selected ? (
              <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
                <div className="space-y-4">
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-white">{selected.cohortName}</p>
                        <p className="mt-1 text-xs text-white/50">
                          {selected.location} · Cohort year {selected.startYear}
                          {selected.programmeLead ? ` · Lead: ${selected.programmeLead}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <TqmsStatusPill className={STATUS_PILL_CLASS[selected.status]}>
                          {selected.status}
                        </TqmsStatusPill>
                        <button
                          type="button"
                          onClick={() => openEdit(selected)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/45 hover:border-sky-400/40 hover:text-sky-200"
                          aria-label={`Edit ${selected.cohortName}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(selected)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/35 hover:border-rose-400/40 hover:text-rose-300"
                          aria-label={`Delete ${selected.cohortName}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {selected.notes ? (
                      <p className="mt-3 text-xs leading-relaxed text-white/55">{selected.notes}</p>
                    ) : null}

                    <label className="mt-4 block">
                      <span className={tqmsLabelClass()}>Cohort plan</span>
                      <textarea
                        value={selected.cohortPlan}
                        onChange={(e) => updateAcceleratorCohortPlan(selected.id, e.target.value)}
                        rows={4}
                        placeholder="Outline the cohort immersion plan, themes, and outcomes…"
                        className={cn(tqmsInputClass(), "mt-1.5 resize-none")}
                      />
                    </label>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                    <AcceleratorScheduleEditor cohort={selected} onAddItem={handleAddScheduleItem} />
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">
                        Cohort members <span className="text-white/40">({selectedCompanies.length})</span>
                      </p>
                      <button type="button" onClick={openAddCompany} className={tqmsSecondaryButtonClass()}>
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </button>
                    </div>
                    {selectedCompanies.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-white/15 px-3 py-5 text-center text-xs text-white/45">
                        No member companies yet.
                      </p>
                    ) : (
                      <ul className="space-y-1.5">
                        {selectedCompanies.map((company) => (
                          <li
                            key={company.id}
                            className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white">{company.companyName}</p>
                              <p className="truncate text-xs text-sky-300/80">{company.contactEmail}</p>
                            </div>
                            <div className="flex shrink-0 gap-1">
                              <button
                                type="button"
                                onClick={() => openEditCompany(company)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-white/45 hover:border-sky-400/40 hover:text-sky-200"
                                aria-label={`Edit ${company.companyName}`}
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveCompany(company)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-white/35 hover:border-rose-400/40 hover:text-rose-300"
                                aria-label={`Remove ${company.companyName}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}

                    {companyFormOpen ? (
                      <div className="mt-3 space-y-3 rounded-xl border border-sky-400/25 bg-sky-500/5 p-3">
                        <p className="text-sm font-medium text-white">
                          {companyForm.id ? "Edit company" : "Add member company"}
                        </p>
                        {!companyForm.id && availableToAdd.length > 0 ? (
                          <div className="space-y-2 rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                            <p className={tqmsLabelClass()}>Pick existing member</p>
                            <div className="flex flex-wrap gap-2">
                              <select
                                value={pickCompanyId}
                                onChange={(e) => setPickCompanyId(e.target.value)}
                                className={cn(tqmsInputClass(), "mt-0 min-w-[180px] flex-1")}
                              >
                                <option value="">Select company…</option>
                                {availableToAdd.map((member) => (
                                  <option key={member.id} value={member.id}>
                                    {member.companyName}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                disabled={!pickCompanyId}
                                onClick={handlePickExisting}
                                className={tqmsSecondaryButtonClass(!pickCompanyId)}
                              >
                                Add selected
                              </button>
                            </div>
                          </div>
                        ) : null}
                        <form className="space-y-3" onSubmit={handleCompanySubmit}>
                          <label className="block">
                            <span className={tqmsLabelClass()}>Company name</span>
                            <input
                              value={companyForm.companyName}
                              onChange={(e) =>
                                setCompanyForm((c) => ({ ...c, companyName: e.target.value }))
                              }
                              className={tqmsInputClass()}
                              required
                            />
                          </label>
                          <label className="block">
                            <span className={tqmsLabelClass()}>Contact email</span>
                            <input
                              type="email"
                              value={companyForm.contactEmail}
                              onChange={(e) =>
                                setCompanyForm((c) => ({ ...c, contactEmail: e.target.value }))
                              }
                              className={tqmsInputClass()}
                            />
                          </label>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setCompanyFormOpen(false)}
                              className={tqmsSecondaryButtonClass()}
                            >
                              Cancel
                            </button>
                            <button type="submit" className={tqmsPrimaryButtonClass()}>
                              {companyForm.id ? "Save company" : "Create & add"}
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4">
                  <TqmsSection
                    title="Who's coming"
                    subtitle="Companies and hospitals the cohort will visit on immersion."
                  >
                    <div className="mb-4 flex flex-wrap gap-2">
                      <TqmsStatusPill className="border-sky-400/25 bg-sky-500/10 text-sky-200">
                        {selected.visitTargets.length} visit
                        {selected.visitTargets.length === 1 ? "" : "s"} planned
                      </TqmsStatusPill>
                      <TqmsStatusPill className="border-emerald-400/30 bg-emerald-500/10 text-emerald-200">
                        {confirmedVisits} confirmed
                      </TqmsStatusPill>
                      <TqmsStatusPill className="border-white/15 bg-white/[0.04] text-white/60">
                        {selectedCompanies.length} UK member
                        {selectedCompanies.length === 1 ? "" : "s"} travelling
                      </TqmsStatusPill>
                    </div>

                    {selected.visitTargets.length === 0 ? (
                      <TqmsEmpty message="No visit targets configured for this cohort." />
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {selected.visitTargets.map((target) => (
                          <VisitTargetCard key={target.id} target={target} />
                        ))}
                      </div>
                    )}
                  </TqmsSection>

                  {selectedCompanies.length > 0 ? (
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5">
                      <p className="text-sm font-medium text-white">Travelling members</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {selectedCompanies.map((company) => (
                          <span
                            key={company.id}
                            className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/70"
                          >
                            {company.companyName}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </TqmsSection>

      {formOpen ? (
        <TqmsSlideOver
          title={form.id ? "Edit cohort" : "Add cohort"}
          subtitle="Update cohort details. Manage member companies from the cohort view."
          onClose={() => setFormOpen(false)}
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className={tqmsLabelClass()}>Cohort name</span>
              <input
                value={form.cohortName}
                onChange={(e) => setForm((c) => ({ ...c, cohortName: e.target.value }))}
                className={tqmsInputClass()}
                required
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={tqmsLabelClass()}>Location</span>
                <input
                  value={form.location}
                  onChange={(e) => setForm((c) => ({ ...c, location: e.target.value }))}
                  className={tqmsInputClass()}
                />
              </label>
              <label className="block">
                <span className={tqmsLabelClass()}>Cohort year</span>
                <input
                  value={form.startYear}
                  onChange={(e) => setForm((c) => ({ ...c, startYear: e.target.value }))}
                  className={tqmsInputClass()}
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={tqmsLabelClass()}>Status</span>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((c) => ({ ...c, status: e.target.value as AbhiAcceleratorStatus }))
                  }
                  className={tqmsInputClass()}
                >
                  <option value="recruiting">Recruiting</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
              <label className="block">
                <span className={tqmsLabelClass()}>Programme lead</span>
                <input
                  value={form.programmeLead}
                  onChange={(e) => setForm((c) => ({ ...c, programmeLead: e.target.value }))}
                  className={tqmsInputClass()}
                />
              </label>
            </div>
            <label className="block">
              <span className={tqmsLabelClass()}>Details / notes</span>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))}
                rows={3}
                className={cn(tqmsInputClass(), "resize-none")}
                placeholder="Market focus, partners, delivery notes…"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setFormOpen(false)} className={tqmsSecondaryButtonClass()}>
                Cancel
              </button>
              <button type="submit" className={tqmsPrimaryButtonClass()}>
                {form.id ? "Save changes" : "Create cohort"}
              </button>
            </div>
          </form>
        </TqmsSlideOver>
      ) : null}
    </div>
  );
}

export default function AbhiProgrammesWorkspace({ mode }: { mode: AbhiProgrammesMode }) {
  const store = useAbhiMarketingStore();

  if (mode === "working-groups") {
    return <WorkingGroupsPanel groups={store.workingGroups} />;
  }

  if (mode === "us-accelerator") {
    return (
      <AcceleratorPanel
        region="us"
        title="ABHI US Accelerator"
        subtitle="Cohorts helping UK HealthTech members enter the US market."
        members={store.members}
      />
    );
  }

  return (
    <AcceleratorPanel
      region="me"
      title="ABHI Middle East Accelerator"
      subtitle="Cohorts helping UK HealthTech members enter Dubai and Riyadh markets."
      members={store.members}
    />
  );
}
