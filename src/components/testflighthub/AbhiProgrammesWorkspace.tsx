"use client";

import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";

import {
  addMember,
  deleteAcceleratorCohort,
  deleteWorkingGroup,
  deleteWorkingGroupPerson,
  listAcceleratorCohorts,
  toggleAcceleratorCompany,
  updateMember,
  upsertAcceleratorCohort,
  upsertWorkingGroup,
  upsertWorkingGroupPerson,
  type AbhiAcceleratorCohort,
  type AbhiAcceleratorRegion,
  type AbhiAcceleratorStatus,
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

function WorkingGroupsPanel({ groups }: { groups: AbhiWorkingGroup[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<GroupFormState>(emptyGroupForm());
  const [personFormOpen, setPersonFormOpen] = useState(false);
  const [personForm, setPersonForm] = useState<PersonFormState>(emptyPersonForm());

  const selected = groups.find((row) => row.id === selectedId) ?? null;

  function openCreate() {
    setSelectedId(null);
    setPersonFormOpen(false);
    setForm(emptyGroupForm());
    setFormOpen(true);
  }

  function openDetail(group: AbhiWorkingGroup) {
    setFormOpen(false);
    setPersonFormOpen(false);
    setSelectedId(group.id);
  }

  function openEdit(group: AbhiWorkingGroup) {
    setPersonFormOpen(false);
    setSelectedId(null);
    setForm(groupFormFrom(group));
    setFormOpen(true);
  }

  function handleDeleteGroup(group: AbhiWorkingGroup) {
    const ok = window.confirm(`Delete “${group.name}”? This cannot be undone.`);
    if (!ok) return;
    deleteWorkingGroup(group.id);
    if (selectedId === group.id) setSelectedId(null);
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
          <div className="grid gap-3 sm:grid-cols-2">
            {groups.map((group) => {
              const active = group.id === selectedId;
              return (
                <div
                  key={group.id}
                  className={cn(
                    "rounded-xl border p-3.5 transition-colors",
                    active
                      ? "border-sky-400/40 bg-sky-500/10"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openDetail(group)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="text-sm font-semibold text-white hover:text-sky-200">{group.name}</p>
                      <p className="mt-1.5 text-xs text-white/50">{group.description}</p>
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
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-white/45">
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
                </div>
              );
            })}
          </div>
        )}
      </TqmsSection>

      {selected && !formOpen ? (
        <TqmsSlideOver
          title={selected.name}
          subtitle={`Led by ${selected.lead || "—"} · ${selected.meetingCadence}`}
          onClose={() => {
            setSelectedId(null);
            setPersonFormOpen(false);
          }}
          footer={
            <div className="flex flex-wrap justify-between gap-2">
              <button
                type="button"
                onClick={() => handleDeleteGroup(selected)}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 text-xs font-semibold text-rose-200 transition-colors hover:bg-rose-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete group
              </button>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={openAddPerson} className={tqmsSecondaryButtonClass()}>
                  <Plus className="h-3.5 w-3.5" />
                  Add member
                </button>
                <button type="button" onClick={() => openEdit(selected)} className={tqmsPrimaryButtonClass()}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit group
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-white/70">{selected.description}</p>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-white">
                  Members <span className="text-white/40">({selected.people.length})</span>
                </p>
                <button type="button" onClick={openAddPerson} className={tqmsSecondaryButtonClass()}>
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>

              {selected.people.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/15 px-3 py-6 text-center text-sm text-white/45">
                  No members yet. Add people to this working group.
                </p>
              ) : (
                <ul className="space-y-2">
                  {selected.people.map((person) => (
                    <li
                      key={person.id}
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">{person.name}</p>
                          <p className="mt-0.5 text-xs text-white/50">
                            {[person.role, person.company].filter(Boolean).join(" · ")}
                          </p>
                          {person.email ? (
                            <p className="mt-0.5 truncate text-xs text-sky-300/80">{person.email}</p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditPerson(person)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/45 transition-colors hover:border-sky-400/40 hover:text-sky-200"
                            aria-label={`Edit ${person.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePerson(person)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/35 transition-colors hover:border-rose-400/40 hover:text-rose-300"
                            aria-label={`Remove ${person.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {personFormOpen ? (
              <form
                className="space-y-3 rounded-xl border border-sky-400/25 bg-sky-500/5 p-3"
                onSubmit={handlePersonSubmit}
              >
                <p className="text-sm font-medium text-white">
                  {personForm.id ? "Edit member" : "Add member"}
                </p>
                <label className="block">
                  <span className={tqmsLabelClass()}>Name</span>
                  <input
                    value={personForm.name}
                    onChange={(e) => setPersonForm((current) => ({ ...current, name: e.target.value }))}
                    className={tqmsInputClass()}
                    required
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className={tqmsLabelClass()}>Company</span>
                    <input
                      value={personForm.company}
                      onChange={(e) =>
                        setPersonForm((current) => ({ ...current, company: e.target.value }))
                      }
                      className={tqmsInputClass()}
                    />
                  </label>
                  <label className="block">
                    <span className={tqmsLabelClass()}>Role</span>
                    <input
                      value={personForm.role}
                      onChange={(e) => setPersonForm((current) => ({ ...current, role: e.target.value }))}
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
                    onChange={(e) => setPersonForm((current) => ({ ...current, email: e.target.value }))}
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
        </TqmsSlideOver>
      ) : null}

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

  const selected = cohorts.find((row) => row.id === selectedId) ?? null;
  const selectedCompanies = selected ? membersByIds(members, selected.companyIds) : [];
  const availableToAdd = selected
    ? members.filter((member) => !selected.companyIds.includes(member.id))
    : [];

  function openCreate() {
    setSelectedId(null);
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
    setSelectedId(null);
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
              const active = cohort.id === selectedId;
              return (
                <div
                  key={cohort.id}
                  className={cn(
                    "rounded-xl border p-3.5 transition-colors",
                    active
                      ? "border-sky-400/40 bg-sky-500/10"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <button type="button" onClick={() => openDetail(cohort)} className="min-w-0 flex-1 text-left">
                      <p className="text-sm font-semibold text-white hover:text-sky-200">{cohort.cohortName}</p>
                      <p className="mt-1 text-xs text-white/50">
                        {cohort.location} · Cohort year {cohort.startYear}
                        {cohort.programmeLead ? ` · Lead: ${cohort.programmeLead}` : ""}
                      </p>
                    </button>
                    <div className="flex items-center gap-2">
                      <TqmsStatusPill className={STATUS_PILL_CLASS[cohort.status]}>
                        {cohort.status}
                      </TqmsStatusPill>
                      <button
                        type="button"
                        onClick={() => openEdit(cohort)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/45 transition-colors hover:border-sky-400/40 hover:text-sky-200"
                        aria-label={`Edit ${cohort.cohortName}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cohort)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/35 transition-colors hover:border-rose-400/40 hover:text-rose-300"
                        aria-label={`Delete ${cohort.cohortName}`}
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
                          className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/70"
                        >
                          {company.companyName}
                        </span>
                      ))
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-white/40">
                    {companies.length} member{companies.length === 1 ? "" : "s"} · Click for details
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </TqmsSection>

      {selected && !formOpen ? (
        <TqmsSlideOver
          title={selected.cohortName}
          subtitle={`${selected.location} · Cohort year ${selected.startYear}`}
          onClose={() => {
            setSelectedId(null);
            setCompanyFormOpen(false);
          }}
          footer={
            <div className="flex flex-wrap justify-between gap-2">
              <button
                type="button"
                onClick={() => handleDelete(selected)}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 text-xs font-semibold text-rose-200 transition-colors hover:bg-rose-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete cohort
              </button>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={openAddCompany} className={tqmsSecondaryButtonClass()}>
                  <Plus className="h-3.5 w-3.5" />
                  Add member
                </button>
                <button type="button" onClick={() => openEdit(selected)} className={tqmsPrimaryButtonClass()}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit details
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-5">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className={tqmsLabelClass()}>Status</dt>
                <dd className="mt-1.5">
                  <TqmsStatusPill className={STATUS_PILL_CLASS[selected.status]}>{selected.status}</TqmsStatusPill>
                </dd>
              </div>
              <div>
                <dt className={tqmsLabelClass()}>Programme lead</dt>
                <dd className="mt-1.5 text-sm text-white">{selected.programmeLead || "—"}</dd>
              </div>
              <div>
                <dt className={tqmsLabelClass()}>Location</dt>
                <dd className="mt-1.5 text-sm text-white">{selected.location || "—"}</dd>
              </div>
              <div>
                <dt className={tqmsLabelClass()}>Cohort year</dt>
                <dd className="mt-1.5 text-sm text-white">{selected.startYear}</dd>
              </div>
            </dl>

            {selected.notes ? (
              <div>
                <p className={tqmsLabelClass()}>Details</p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/75">{selected.notes}</p>
              </div>
            ) : null}

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-white">
                  Member companies <span className="text-white/40">({selectedCompanies.length})</span>
                </p>
                <button type="button" onClick={openAddCompany} className={tqmsSecondaryButtonClass()}>
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>

              {selectedCompanies.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/15 px-3 py-6 text-center text-sm text-white/45">
                  No member companies yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {selectedCompanies.map((company) => (
                    <li
                      key={company.id}
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">{company.companyName}</p>
                          <p className="mt-0.5 truncate text-xs text-sky-300/80">{company.contactEmail}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditCompany(company)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/45 transition-colors hover:border-sky-400/40 hover:text-sky-200"
                            aria-label={`Edit ${company.companyName}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveCompany(company)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/35 transition-colors hover:border-rose-400/40 hover:text-rose-300"
                            aria-label={`Remove ${company.companyName}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {companyFormOpen ? (
              <div className="space-y-3 rounded-xl border border-sky-400/25 bg-sky-500/5 p-3">
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
                    <p className="text-[11px] text-white/40">Or create a new company below.</p>
                  </div>
                ) : null}

                <form className="space-y-3" onSubmit={handleCompanySubmit}>
                  <label className="block">
                    <span className={tqmsLabelClass()}>Company name</span>
                    <input
                      value={companyForm.companyName}
                      onChange={(e) =>
                        setCompanyForm((current) => ({ ...current, companyName: e.target.value }))
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
                        setCompanyForm((current) => ({ ...current, contactEmail: e.target.value }))
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
        </TqmsSlideOver>
      ) : null}

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
            <div className="grid gap-3 sm:grid-cols-2">
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
              <label className="block">
                <span className={tqmsLabelClass()}>Programme lead</span>
                <input
                  value={form.programmeLead}
                  onChange={(e) => setForm((current) => ({ ...current, programmeLead: e.target.value }))}
                  className={tqmsInputClass()}
                />
              </label>
            </div>
            <label className="block">
              <span className={tqmsLabelClass()}>Details / notes</span>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))}
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
