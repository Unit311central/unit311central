"use client";

import { Plus, Trash2, Users, X } from "lucide-react";
import { useState } from "react";

import {
  deleteAcceleratorCohort,
  deleteWorkingGroup,
  listAcceleratorCohorts,
  toggleAcceleratorCompany,
  toggleWorkingGroupMember,
  upsertAcceleratorCohort,
  upsertWorkingGroup,
  type AbhiAcceleratorCohort,
  type AbhiAcceleratorRegion,
  type AbhiAcceleratorStatus,
  type AbhiMemberCompany,
  type AbhiWorkingGroup,
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

function membersByIds(members: AbhiMemberCompany[], ids: string[]) {
  const byId = new Map(members.map((member) => [member.id, member]));
  return ids.map((id) => byId.get(id)).filter((member): member is AbhiMemberCompany => Boolean(member));
}

function WorkingGroupsPanel({
  members,
  groups,
}: {
  members: AbhiMemberCompany[];
  groups: AbhiWorkingGroup[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<GroupFormState>(emptyGroupForm());

  const selected = groups.find((row) => row.id === selectedId) ?? null;

  function openCreate() {
    setForm(emptyGroupForm());
    setFormOpen(true);
  }

  function openEdit(group: AbhiWorkingGroup) {
    setForm(groupFormFrom(group));
    setFormOpen(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return;
    upsertWorkingGroup({
      id: form.id ?? undefined,
      name: form.name.trim(),
      description: form.description.trim(),
      lead: form.lead.trim(),
      meetingCadence: form.meetingCadence.trim(),
    });
    setFormOpen(false);
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
          <div className="grid gap-3 sm:grid-cols-2">
            {groups.map((group) => (
              <div key={group.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedId(group.id)}
                    className="text-left text-sm font-semibold text-white hover:text-sky-200"
                  >
                    {group.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteWorkingGroup(group.id)}
                    className="text-white/30 transition-colors hover:text-rose-300"
                    aria-label="Delete group"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-white/50">{group.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-white/45">
                  <TqmsStatusPill className="border-white/15 bg-white/[0.04] text-white/60">
                    Lead: {group.lead || "—"}
                  </TqmsStatusPill>
                  <TqmsStatusPill className="border-white/15 bg-white/[0.04] text-white/60">
                    {group.meetingCadence}
                  </TqmsStatusPill>
                  <TqmsStatusPill className="border-sky-400/25 bg-sky-500/10 text-sky-200">
                    <Users className="mr-1 inline h-3 w-3" />
                    {group.memberIds.length}
                  </TqmsStatusPill>
                </div>
              </div>
            ))}
          </div>
        )}
      </TqmsSection>

      {selected ? (
        <TqmsSlideOver
          title={selected.name}
          subtitle={`Led by ${selected.lead || "—"} · ${selected.meetingCadence}`}
          onClose={() => setSelectedId(null)}
          footer={
            <div className="flex justify-end">
              <button type="button" onClick={() => openEdit(selected)} className={tqmsSecondaryButtonClass()}>
                Edit details
              </button>
            </div>
          }
        >
          <p className="text-sm text-white/70">{selected.description}</p>
          <p className="mt-4 mb-2 text-sm font-medium text-white">Members</p>
          <div className="space-y-1.5">
            {members.map((member) => {
              const active = selected.memberIds.includes(member.id);
              return (
                <label
                  key={member.id}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
                    active
                      ? "border-sky-400/30 bg-sky-500/10 text-sky-100"
                      : "border-white/10 bg-transparent text-white/55 hover:border-white/20",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleWorkingGroupMember(selected.id, member.id)}
                    className="h-3.5 w-3.5 rounded border-white/30 bg-transparent"
                  />
                  {member.companyName}
                </label>
              );
            })}
          </div>
        </TqmsSlideOver>
      ) : null}

      {formOpen ? (
        <TqmsSlideOver
          title={form.id ? "Edit working group" : "Add working group"}
          onClose={() => setFormOpen(false)}
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className={tqmsLabelClass()}>Name</span>
              <input
                value={form.name}
                onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                className={tqmsInputClass()}
                required
              />
            </label>
            <label className="block">
              <span className={tqmsLabelClass()}>Description</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
                rows={3}
                className={cn(tqmsInputClass(), "resize-none")}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={tqmsLabelClass()}>Lead</span>
                <input
                  value={form.lead}
                  onChange={(e) => setForm((current) => ({ ...current, lead: e.target.value }))}
                  className={tqmsInputClass()}
                />
              </label>
              <label className="block">
                <span className={tqmsLabelClass()}>Meeting cadence</span>
                <input
                  value={form.meetingCadence}
                  onChange={(e) => setForm((current) => ({ ...current, meetingCadence: e.target.value }))}
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
};

function emptyCohortForm(): CohortFormState {
  return { id: null, cohortName: "", location: "", startYear: String(new Date().getFullYear()), status: "recruiting" };
}

function cohortFormFrom(cohort: AbhiAcceleratorCohort): CohortFormState {
  return {
    id: cohort.id,
    cohortName: cohort.cohortName,
    location: cohort.location,
    startYear: String(cohort.startYear),
    status: cohort.status,
  };
}

const STATUS_PILL_CLASS: Record<AbhiAcceleratorStatus, string> = {
  recruiting: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  active: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  completed: "border-white/15 bg-white/[0.04] text-white/55",
};

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
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CohortFormState>(emptyCohortForm());
  const [addingCompanyFor, setAddingCompanyFor] = useState<string | null>(null);
  const [pickCompanyId, setPickCompanyId] = useState("");

  function openCreate() {
    setForm(emptyCohortForm());
    setFormOpen(true);
  }

  function openEdit(cohort: AbhiAcceleratorCohort) {
    setForm(cohortFormFrom(cohort));
    setFormOpen(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.cohortName.trim()) return;
    upsertAcceleratorCohort({
      id: form.id ?? undefined,
      region,
      cohortName: form.cohortName.trim(),
      location: form.location.trim(),
      startYear: Number(form.startYear) || new Date().getFullYear(),
      status: form.status,
    });
    setFormOpen(false);
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
          <div className="space-y-3">
            {cohorts.map((cohort) => {
              const companies = membersByIds(members, cohort.companyIds);
              const availableToAdd = members.filter((member) => !cohort.companyIds.includes(member.id));
              return (
                <div key={cohort.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <button
                        type="button"
                        onClick={() => openEdit(cohort)}
                        className="text-left text-sm font-semibold text-white hover:text-sky-200"
                      >
                        {cohort.cohortName}
                      </button>
                      <p className="mt-1 text-xs text-white/50">
                        {cohort.location} · Cohort year {cohort.startYear}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <TqmsStatusPill className={STATUS_PILL_CLASS[cohort.status]}>
                        {cohort.status}
                      </TqmsStatusPill>
                      <button
                        type="button"
                        onClick={() => deleteAcceleratorCohort(cohort.id)}
                        className="text-white/30 transition-colors hover:text-rose-300"
                        aria-label="Delete cohort"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {companies.length === 0 ? (
                      <p className="text-xs text-white/35">No companies added yet.</p>
                    ) : (
                      companies.map((company) => (
                        <span
                          key={company.id}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/70"
                        >
                          {company.companyName}
                          <button
                            type="button"
                            onClick={() => toggleAcceleratorCompany(cohort.id, company.id)}
                            className="text-white/35 hover:text-rose-300"
                            aria-label={`Remove ${company.companyName}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {addingCompanyFor === cohort.id ? (
                      <>
                        <select
                          value={pickCompanyId}
                          onChange={(e) => setPickCompanyId(e.target.value)}
                          className="rounded-lg border border-white/10 bg-[#0b1524] px-2.5 py-1.5 text-xs text-white outline-none focus:border-sky-400/50"
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
                          onClick={() => {
                            toggleAcceleratorCompany(cohort.id, pickCompanyId);
                            setPickCompanyId("");
                            setAddingCompanyFor(null);
                          }}
                          className={tqmsSecondaryButtonClass(!pickCompanyId)}
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddingCompanyFor(null)}
                          className="text-xs text-white/40 hover:text-white/65"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAddingCompanyFor(cohort.id)}
                        className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-dashed border-white/15 px-2.5 text-[11px] text-white/50 transition-colors hover:border-white/30 hover:text-white/80"
                      >
                        <Plus className="h-3 w-3" />
                        Add company
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </TqmsSection>

      {formOpen ? (
        <TqmsSlideOver title={form.id ? "Edit cohort" : "Add cohort"} onClose={() => setFormOpen(false)}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className={tqmsLabelClass()}>Cohort name</span>
              <input
                value={form.cohortName}
                onChange={(e) => setForm((current) => ({ ...current, cohortName: e.target.value }))}
                className={tqmsInputClass()}
                required
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={tqmsLabelClass()}>Location</span>
                <input
                  value={form.location}
                  onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))}
                  className={tqmsInputClass()}
                />
              </label>
              <label className="block">
                <span className={tqmsLabelClass()}>Cohort year</span>
                <input
                  value={form.startYear}
                  onChange={(e) => setForm((current) => ({ ...current, startYear: e.target.value }))}
                  className={tqmsInputClass()}
                />
              </label>
            </div>
            <label className="block">
              <span className={tqmsLabelClass()}>Status</span>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((current) => ({ ...current, status: e.target.value as AbhiAcceleratorStatus }))
                }
                className={tqmsInputClass()}
              >
                <option value="recruiting">Recruiting</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
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
    return <WorkingGroupsPanel members={store.members} groups={store.workingGroups} />;
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
