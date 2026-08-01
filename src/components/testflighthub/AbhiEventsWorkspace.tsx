"use client";

import { CalendarCheck2, CalendarPlus, ExternalLink, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { useMemo, useState } from "react";

import { ABHI_EVENTS_CALENDAR_EMAIL } from "@/lib/abhi-surface";
import {
  ABHI_EVENT_OWNERS,
  addMember,
  computeEventsDashboardKpis,
  deleteEvent,
  toggleEventCalendarSync,
  upsertEvent,
  type AbhiEvent,
} from "@/lib/abhi-marketing-store";
import { cn } from "@/lib/utils";
import { useAbhiMarketingStore } from "./useAbhiMarketingStore";
import {
  TqmsEmpty,
  TqmsKpiTile,
  TqmsSection,
  TqmsSlideOver,
  TqmsStatusPill,
  tqmsInputClass,
  tqmsLabelClass,
  tqmsPrimaryButtonClass,
  tqmsSecondaryButtonClass,
} from "./tqms-ui";

type EventFormState = {
  id: string | null;
  name: string;
  startDate: string;
  endDate: string;
  year: string;
  city: string;
  country: string;
  website: string;
  notes: string;
  ownerId: string;
  memberIds: string[];
  sendToAll: boolean;
};

function emptyForm(): EventFormState {
  return {
    id: null,
    name: "",
    startDate: "",
    endDate: "",
    year: String(new Date().getFullYear()),
    city: "",
    country: "",
    website: "",
    notes: "",
    ownerId: ABHI_EVENT_OWNERS[0]?.id ?? "",
    memberIds: [],
    sendToAll: false,
  };
}

function formFromEvent(event: AbhiEvent): EventFormState {
  return {
    id: event.id,
    name: event.name,
    startDate: event.startDate,
    endDate: event.endDate,
    year: String(event.year),
    city: event.city,
    country: event.country,
    website: event.website,
    notes: event.notes,
    ownerId: event.ownerId || ABHI_EVENT_OWNERS[0]?.id || "",
    memberIds: event.memberIds,
    sendToAll: false,
  };
}

function formatDateRange(startDate: string, endDate: string) {
  const fmt = (value: string) =>
    new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
      new Date(`${value}T12:00:00`),
    );
  return startDate === endDate ? fmt(startDate) : `${fmt(startDate)} – ${fmt(endDate)}`;
}

function ownerLabel(ownerId: string, ownerName: string) {
  if (ownerName.trim()) return ownerName;
  return ABHI_EVENT_OWNERS.find((row) => row.id === ownerId)?.name ?? "Unassigned";
}

export default function AbhiEventsWorkspace() {
  const store = useAbhiMarketingStore();
  const kpis = useMemo(() => computeEventsDashboardKpis(store), [store]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<EventFormState>(emptyForm());
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyEmail, setNewCompanyEmail] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const sortedEvents = useMemo(
    () => [...store.events].sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate)),
    [store.events],
  );

  const selectedEvent = useMemo(
    () => sortedEvents.find((event) => event.id === selectedId) ?? null,
    [sortedEvents, selectedId],
  );

  const selectedMembers = useMemo(() => {
    if (!selectedEvent) return [];
    const byId = new Map(store.members.map((member) => [member.id, member]));
    return selectedEvent.memberIds.map((id) => byId.get(id)).filter(Boolean);
  }, [selectedEvent, store.members]);

  function openCreate() {
    setSelectedId(null);
    setForm(emptyForm());
    setShowForm(true);
  }

  function openDetail(event: AbhiEvent) {
    setShowForm(false);
    setSelectedId(event.id);
  }

  function openEdit(event: AbhiEvent) {
    setSelectedId(null);
    setForm(formFromEvent(event));
    setShowForm(true);
  }

  function handleDelete(event: AbhiEvent) {
    const ok = window.confirm(`Delete “${event.name}”? This cannot be undone.`);
    if (!ok) return;
    deleteEvent(event.id);
    if (selectedId === event.id) setSelectedId(null);
    if (form.id === event.id) setShowForm(false);
    setNotice("Event deleted.");
  }

  function patchForm(patch: Partial<EventFormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function toggleMember(memberId: string) {
    patchForm({
      memberIds: form.memberIds.includes(memberId)
        ? form.memberIds.filter((id) => id !== memberId)
        : [...form.memberIds, memberId],
      sendToAll: false,
    });
  }

  function handleAddCompany() {
    if (!newCompanyName.trim()) return;
    const member = addMember({
      companyName: newCompanyName.trim(),
      contactEmail:
        newCompanyEmail.trim() ||
        `contact@${newCompanyName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`,
    });
    patchForm({ memberIds: [...form.memberIds, member.id] });
    setNewCompanyName("");
    setNewCompanyEmail("");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.startDate) return;
    const memberIds = form.sendToAll ? store.members.map((m) => m.id) : form.memberIds;
    const owner = ABHI_EVENT_OWNERS.find((row) => row.id === form.ownerId);
    const saved = upsertEvent({
      id: form.id ?? undefined,
      name: form.name.trim(),
      startDate: form.startDate,
      endDate: form.endDate || form.startDate,
      year: Number(form.year) || new Date(form.startDate).getFullYear(),
      city: form.city.trim(),
      country: form.country.trim(),
      website: form.website.trim(),
      notes: form.notes.trim(),
      ownerId: owner?.id ?? "",
      ownerName: owner?.name ?? "",
      memberIds,
    });
    setNotice(form.id ? "Event updated." : "Event created.");
    setShowForm(false);
    setSelectedId(saved.id);
  }

  function assignOwner(eventId: string, ownerId: string) {
    const owner = ABHI_EVENT_OWNERS.find((row) => row.id === ownerId);
    upsertEvent({
      id: eventId,
      ownerId: owner?.id ?? "",
      ownerName: owner?.name ?? "",
    });
    setNotice(owner ? `Responsible user set to ${owner.name}.` : "Responsible user cleared.");
  }

  return (
    <div className="space-y-5">
      {notice ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <TqmsKpiTile label="Upcoming events" value={kpis.upcoming} hint={`${kpis.totalEvents} total tracked`} />
        <TqmsKpiTile
          label="Member companies signed up"
          value={kpis.uniqueMembersSignedUp}
          hint="Unique members across all events"
        />
        <TqmsKpiTile
          label="Calendar sync"
          value={`${kpis.calendarSyncedCount}/${kpis.totalEvents}`}
          hint={ABHI_EVENTS_CALENDAR_EMAIL}
        />
      </div>

      <TqmsSection
        title="External Events"
        subtitle="International trade shows, congresses, and delegations ABHI is coordinating."
        actions={
          <button type="button" onClick={openCreate} className={tqmsPrimaryButtonClass()}>
            <Plus className="h-3.5 w-3.5" />
            Add Event
          </button>
        }
      >
        {sortedEvents.length === 0 ? (
          <TqmsEmpty message="No events scheduled yet." />
        ) : (
          <ul className="space-y-3">
            {sortedEvents.map((event) => {
              const selected = event.id === selectedId;
              return (
                <li key={event.id}>
                  <div
                    className={cn(
                      "rounded-xl border p-3.5 transition-colors",
                      selected
                        ? "border-sky-400/40 bg-sky-500/10"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => openDetail(event)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="text-sm font-semibold text-white hover:text-sky-200">{event.name}</p>
                        <p className="mt-1 text-xs text-white/50">
                          {formatDateRange(event.startDate, event.endDate)} · {event.city}, {event.country}
                        </p>
                        <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-white/55">
                          <UserRound className="h-3.5 w-3.5 shrink-0" />
                          {ownerLabel(event.ownerId, event.ownerName)}
                        </p>
                      </button>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <TqmsStatusPill
                          className={
                            event.calendarSynced
                              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                              : "border-white/15 bg-white/[0.04] text-white/50"
                          }
                        >
                          {event.memberIds.length} member{event.memberIds.length === 1 ? "" : "s"}
                        </TqmsStatusPill>
                        <button
                          type="button"
                          onClick={() => openEdit(event)}
                          className={tqmsSecondaryButtonClass()}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(event)}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-white/10 px-3 text-xs font-semibold text-white/50 transition-colors hover:border-rose-400/40 hover:text-rose-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </TqmsSection>

      {selectedEvent && !showForm ? (
        <TqmsSlideOver
          title={selectedEvent.name}
          subtitle="Event details and ownership"
          onClose={() => setSelectedId(null)}
          footer={
            <div className="flex flex-wrap justify-between gap-2">
              <button
                type="button"
                onClick={() => handleDelete(selectedEvent)}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 text-xs font-semibold text-rose-200 transition-colors hover:bg-rose-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete event
              </button>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setSelectedId(null)} className={tqmsSecondaryButtonClass()}>
                  Close
                </button>
                <button type="button" onClick={() => openEdit(selectedEvent)} className={tqmsPrimaryButtonClass()}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit event
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-5">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className={tqmsLabelClass()}>Dates</dt>
                <dd className="mt-1.5 text-sm text-white">
                  {formatDateRange(selectedEvent.startDate, selectedEvent.endDate)}
                </dd>
              </div>
              <div>
                <dt className={tqmsLabelClass()}>Year</dt>
                <dd className="mt-1.5 text-sm text-white">{selectedEvent.year}</dd>
              </div>
              <div>
                <dt className={tqmsLabelClass()}>Location</dt>
                <dd className="mt-1.5 text-sm text-white">
                  {selectedEvent.city}, {selectedEvent.country}
                </dd>
              </div>
              <div>
                <dt className={tqmsLabelClass()}>Members signed up</dt>
                <dd className="mt-1.5 text-sm text-white">{selectedEvent.memberIds.length}</dd>
              </div>
            </dl>

            {selectedEvent.website ? (
              <div>
                <p className={tqmsLabelClass()}>Website</p>
                <a
                  href={selectedEvent.website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-sky-300 hover:text-sky-200"
                >
                  {selectedEvent.website.replace(/^https?:\/\//, "")}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            ) : null}

            <div>
              <label className="block">
                <span className={tqmsLabelClass()}>Responsible user</span>
                <select
                  value={selectedEvent.ownerId}
                  onChange={(e) => assignOwner(selectedEvent.id, e.target.value)}
                  className={tqmsInputClass()}
                >
                  <option value="">Unassigned</option>
                  {ABHI_EVENT_OWNERS.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name}
                    </option>
                  ))}
                </select>
              </label>
              <p className="mt-1.5 text-xs text-white/40">
                ABHI staff member accountable for delivery and member coordination.
              </p>
            </div>

            {selectedEvent.notes ? (
              <div>
                <p className={tqmsLabelClass()}>Notes</p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/75">{selectedEvent.notes}</p>
              </div>
            ) : null}

            <div>
              <p className={tqmsLabelClass()}>Member companies</p>
              {selectedMembers.length === 0 ? (
                <p className="mt-2 text-sm text-white/45">No members signed up yet.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {selectedMembers.map((member) =>
                    member ? (
                      <li
                        key={member.id}
                        className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/80"
                      >
                        <p className="font-medium text-white">{member.companyName}</p>
                        <p className="text-xs text-white/45">{member.contactEmail}</p>
                      </li>
                    ) : null,
                  )}
                </ul>
              )}
            </div>

            <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => toggleEventCalendarSync(selectedEvent.id)}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors",
                  selectedEvent.calendarSynced
                    ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25"
                    : "border-white/15 bg-white/[0.04] text-white/70 hover:border-white/25 hover:text-white",
                )}
              >
                <CalendarCheck2 className="h-3.5 w-3.5" />
                {selectedEvent.calendarSynced
                  ? "On calendar"
                  : `Add to ${ABHI_EVENTS_CALENDAR_EMAIL}`}
              </button>
            </div>
          </div>
        </TqmsSlideOver>
      ) : null}

      {showForm ? (
        <TqmsSlideOver
          title={form.id ? "Edit event" : "Add event"}
          subtitle="International event details, ownership, and member sign-up."
          onClose={() => setShowForm(false)}
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className={tqmsLabelClass()}>Event name</span>
              <input
                value={form.name}
                onChange={(e) => patchForm({ name: e.target.value })}
                placeholder="e.g. WHX Dubai 2027"
                className={tqmsInputClass()}
                required
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={tqmsLabelClass()}>Start date</span>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => patchForm({ startDate: e.target.value })}
                  className={tqmsInputClass()}
                  required
                />
              </label>
              <label className="block">
                <span className={tqmsLabelClass()}>End date</span>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => patchForm({ endDate: e.target.value })}
                  className={tqmsInputClass()}
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className={tqmsLabelClass()}>Year</span>
                <input
                  value={form.year}
                  onChange={(e) => patchForm({ year: e.target.value })}
                  className={tqmsInputClass()}
                />
              </label>
              <label className="block">
                <span className={tqmsLabelClass()}>City</span>
                <input
                  value={form.city}
                  onChange={(e) => patchForm({ city: e.target.value })}
                  className={tqmsInputClass()}
                />
              </label>
              <label className="block">
                <span className={tqmsLabelClass()}>Country</span>
                <input
                  value={form.country}
                  onChange={(e) => patchForm({ country: e.target.value })}
                  className={tqmsInputClass()}
                />
              </label>
            </div>

            <label className="block">
              <span className={tqmsLabelClass()}>Website</span>
              <input
                value={form.website}
                onChange={(e) => patchForm({ website: e.target.value })}
                placeholder="https://…"
                className={tqmsInputClass()}
              />
            </label>

            <label className="block">
              <span className={tqmsLabelClass()}>Responsible user</span>
              <select
                value={form.ownerId}
                onChange={(e) => patchForm({ ownerId: e.target.value })}
                className={tqmsInputClass()}
              >
                <option value="">Unassigned</option>
                {ABHI_EVENT_OWNERS.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={tqmsLabelClass()}>Notes</span>
              <textarea
                value={form.notes}
                onChange={(e) => patchForm({ notes: e.target.value })}
                rows={2}
                className={cn(tqmsInputClass(), "resize-none")}
              />
            </label>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-white">Member sign-up</p>
                <label className="flex items-center gap-2 text-xs text-white/60">
                  <input
                    type="checkbox"
                    checked={form.sendToAll}
                    onChange={(e) => patchForm({ sendToAll: e.target.checked })}
                    className="h-3.5 w-3.5 rounded border-white/30 bg-transparent"
                  />
                  Send to all members
                </label>
              </div>
              <div className="mt-3 max-h-40 space-y-1.5 overflow-y-auto pr-1">
                {store.members.map((member) => (
                  <label
                    key={member.id}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
                      form.sendToAll || form.memberIds.includes(member.id)
                        ? "border-sky-400/30 bg-sky-500/10 text-sky-100"
                        : "border-white/10 bg-transparent text-white/60 hover:border-white/20",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={form.sendToAll || form.memberIds.includes(member.id)}
                      disabled={form.sendToAll}
                      onChange={() => toggleMember(member.id)}
                      className="h-3.5 w-3.5 rounded border-white/30 bg-transparent"
                    />
                    {member.companyName}
                  </label>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-white/10 pt-3">
                <label className="min-w-[160px] flex-1">
                  <span className={tqmsLabelClass()}>New company name</span>
                  <input
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="Company name"
                    className={tqmsInputClass()}
                  />
                </label>
                <label className="min-w-[160px] flex-1">
                  <span className={tqmsLabelClass()}>Contact email</span>
                  <input
                    value={newCompanyEmail}
                    onChange={(e) => setNewCompanyEmail(e.target.value)}
                    placeholder="contact@company.com"
                    className={tqmsInputClass()}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleAddCompany}
                  disabled={!newCompanyName.trim()}
                  className={tqmsSecondaryButtonClass(!newCompanyName.trim())}
                >
                  <CalendarPlus className="h-3.5 w-3.5" />
                  Add company
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className={tqmsSecondaryButtonClass()}>
                Cancel
              </button>
              <button type="submit" className={tqmsPrimaryButtonClass()}>
                {form.id ? "Save changes" : "Create event"}
              </button>
            </div>
          </form>
        </TqmsSlideOver>
      ) : null}
    </div>
  );
}
