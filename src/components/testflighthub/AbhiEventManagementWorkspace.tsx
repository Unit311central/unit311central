"use client";

import { CheckSquare, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";

import {
  addChecklistItem,
  deleteChecklistItem,
  deleteEventEquipment,
  deleteEventMember,
  deleteEventTable,
  deleteManagedEvent,
  toggleChecklistItem,
  upsertEventEquipment,
  upsertEventMember,
  upsertEventTable,
  upsertManagedEvent,
  type AbhiEventEquipment,
  type AbhiEventEquipmentStatus,
  type AbhiEventMember,
  type AbhiEventTable,
  type AbhiManagedEvent,
  type AbhiManagedEventStatus,
} from "@/lib/abhi-event-management-store";
import { cn } from "@/lib/utils";
import { useAbhiEventManagementStore } from "./useAbhiEventManagementStore";
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

type DetailTab = "setup" | "members" | "tables" | "equipment" | "checklist";

type EventFormState = {
  id: string | null;
  name: string;
  venue: string;
  city: string;
  country: string;
  startDate: string;
  endDate: string;
  status: AbhiManagedEventStatus;
  leadName: string;
  capacity: string;
  roomLayout: string;
  setupNotes: string;
};

const STATUS_CLASS: Record<AbhiManagedEventStatus, string> = {
  planning: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  confirmed: "border-sky-400/30 bg-sky-500/10 text-sky-100",
  live: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  completed: "border-white/15 bg-white/[0.04] text-white/55",
};

const EQUIP_STATUS_CLASS: Record<AbhiEventEquipmentStatus, string> = {
  ordered: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  on_site: "border-sky-400/30 bg-sky-500/10 text-sky-100",
  installed: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  returned: "border-white/15 bg-white/[0.04] text-white/55",
};

function emptyEventForm(): EventFormState {
  return {
    id: null,
    name: "",
    venue: "",
    city: "",
    country: "",
    startDate: "",
    endDate: "",
    status: "planning",
    leadName: "",
    capacity: "",
    roomLayout: "",
    setupNotes: "",
  };
}

function formFromEvent(event: AbhiManagedEvent): EventFormState {
  return {
    id: event.id,
    name: event.name,
    venue: event.venue,
    city: event.city,
    country: event.country,
    startDate: event.startDate,
    endDate: event.endDate,
    status: event.status,
    leadName: event.leadName,
    capacity: String(event.capacity || ""),
    roomLayout: event.roomLayout,
    setupNotes: event.setupNotes,
  };
}

function formatDateRange(startDate: string, endDate: string) {
  const fmt = (value: string) =>
    new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
      new Date(`${value}T12:00:00`),
    );
  if (!startDate) return "—";
  return startDate === endDate || !endDate ? fmt(startDate) : `${fmt(startDate)} – ${fmt(endDate)}`;
}

export default function AbhiEventManagementWorkspace() {
  const store = useAbhiEventManagementStore();
  const [selectedId, setSelectedId] = useState<string | null>(store.events[0]?.id ?? null);
  const [tab, setTab] = useState<DetailTab>("setup");
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [eventForm, setEventForm] = useState<EventFormState>(emptyEventForm());
  const [memberForm, setMemberForm] = useState<Partial<AbhiEventMember> | null>(null);
  const [tableForm, setTableForm] = useState<Partial<AbhiEventTable> | null>(null);
  const [equipmentForm, setEquipmentForm] = useState<Partial<AbhiEventEquipment> | null>(null);
  const [checklistDraft, setChecklistDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...store.events].sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate)),
    [store.events],
  );

  const selected = sorted.find((row) => row.id === selectedId) ?? sorted[0] ?? null;

  const kpis = useMemo(() => {
    const active = store.events.filter((e) => e.status !== "completed").length;
    const members = store.events.reduce((sum, e) => sum + e.members.length, 0);
    const equipment = store.events.reduce((sum, e) => sum + e.equipment.length, 0);
    const openTasks = store.events.reduce(
      (sum, e) => sum + e.checklist.filter((item) => !item.done).length,
      0,
    );
    return { active, members, equipment, openTasks };
  }, [store.events]);

  function openCreateEvent() {
    setEventForm(emptyEventForm());
    setEventFormOpen(true);
  }

  function openEditEvent(event: AbhiManagedEvent) {
    setEventForm(formFromEvent(event));
    setEventFormOpen(true);
  }

  function handleEventSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventForm.name.trim() || !eventForm.startDate) return;
    const saved = upsertManagedEvent({
      id: eventForm.id ?? undefined,
      name: eventForm.name.trim(),
      venue: eventForm.venue.trim(),
      city: eventForm.city.trim(),
      country: eventForm.country.trim(),
      startDate: eventForm.startDate,
      endDate: eventForm.endDate || eventForm.startDate,
      status: eventForm.status,
      leadName: eventForm.leadName.trim(),
      capacity: Number(eventForm.capacity) || 0,
      roomLayout: eventForm.roomLayout.trim(),
      setupNotes: eventForm.setupNotes.trim(),
    });
    setSelectedId(saved.id);
    setEventFormOpen(false);
    setNotice(eventForm.id ? "Event updated." : "Event created.");
  }

  function handleDeleteEvent(event: AbhiManagedEvent) {
    const ok = window.confirm(`Delete “${event.name}”? This cannot be undone.`);
    if (!ok) return;
    deleteManagedEvent(event.id);
    if (selectedId === event.id) setSelectedId(null);
    setNotice("Event deleted.");
  }

  function handleMemberSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !memberForm?.name?.trim()) return;
    upsertEventMember(selected.id, {
      id: memberForm.id,
      name: memberForm.name.trim(),
      company: memberForm.company?.trim() ?? "",
      role: memberForm.role?.trim() || "Delegate",
      email: memberForm.email?.trim() ?? "",
      tableId: memberForm.tableId ?? "",
      dietary: memberForm.dietary?.trim() ?? "",
    });
    setMemberForm(null);
    setNotice(memberForm.id ? "Member updated." : "Member added.");
  }

  function handleTableSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !tableForm?.label?.trim()) return;
    upsertEventTable(selected.id, {
      id: tableForm.id,
      label: tableForm.label.trim(),
      capacity: Number(tableForm.capacity) || 8,
      zone: tableForm.zone?.trim() ?? "",
      notes: tableForm.notes?.trim() ?? "",
    });
    setTableForm(null);
    setNotice(tableForm.id ? "Table updated." : "Table added.");
  }

  function handleEquipmentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !equipmentForm?.name?.trim()) return;
    upsertEventEquipment(selected.id, {
      id: equipmentForm.id,
      name: equipmentForm.name.trim(),
      category: equipmentForm.category?.trim() || "Ops",
      quantity: Number(equipmentForm.quantity) || 1,
      status: equipmentForm.status ?? "ordered",
      assignedZone: equipmentForm.assignedZone?.trim() ?? "",
      notes: equipmentForm.notes?.trim() ?? "",
    });
    setEquipmentForm(null);
    setNotice(equipmentForm.id ? "Equipment updated." : "Equipment added.");
  }

  const tabs: { id: DetailTab; label: string }[] = [
    { id: "setup", label: "Setup" },
    { id: "members", label: "Members" },
    { id: "tables", label: "Tables" },
    { id: "equipment", label: "Equipment" },
    { id: "checklist", label: "Checklist" },
  ];

  return (
    <div className="space-y-5">
      {notice ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-4">
        <TqmsKpiTile label="Active conferences" value={kpis.active} hint={`${store.events.length} total`} />
        <TqmsKpiTile label="Delegates / members" value={kpis.members} />
        <TqmsKpiTile label="Equipment lines" value={kpis.equipment} />
        <TqmsKpiTile label="Open checklist items" value={kpis.openTasks} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[20rem_minmax(0,1fr)]">
        <TqmsSection
          title="Conferences"
          subtitle="Internal ops for ABHI-organised conferences."
          actions={
            <button type="button" onClick={openCreateEvent} className={tqmsPrimaryButtonClass()}>
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          }
          className="h-fit"
        >
          {sorted.length === 0 ? (
            <TqmsEmpty message="No conferences yet." />
          ) : (
            <ul className="space-y-2">
              {sorted.map((event) => {
                const active = selected?.id === event.id;
                return (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(event.id);
                        setTab("setup");
                        setMemberForm(null);
                        setTableForm(null);
                        setEquipmentForm(null);
                      }}
                      className={cn(
                        "w-full rounded-xl border px-3 py-2.5 text-left transition-colors",
                        active
                          ? "border-sky-400/40 bg-sky-500/10"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 text-sm font-medium text-white">{event.name}</p>
                        <TqmsStatusPill className={STATUS_CLASS[event.status]}>
                          {event.status}
                        </TqmsStatusPill>
                      </div>
                      <p className="mt-1 text-[11px] text-white/45">
                        {formatDateRange(event.startDate, event.endDate)} · {event.city}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-white/40">
                        <Users className="h-3 w-3" />
                        {event.members.length} members · Lead: {event.leadName || "—"}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </TqmsSection>

        {selected ? (
          <TqmsSection
            title={selected.name}
            subtitle={`${selected.venue || "Venue TBC"} · Lead: ${selected.leadName || "—"}`}
            actions={
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openEditEvent(selected)}
                  className={tqmsSecondaryButtonClass()}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit details
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteEvent(selected)}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 text-xs font-semibold text-rose-200 transition-colors hover:bg-rose-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            }
          >
            <div className="mb-4 flex flex-wrap gap-2">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                    tab === item.id
                      ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                      : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white/80",
                  )}
                >
                  {item.label}
                  {item.id === "members" ? ` (${selected.members.length})` : null}
                  {item.id === "tables" ? ` (${selected.tables.length})` : null}
                  {item.id === "equipment" ? ` (${selected.equipment.length})` : null}
                  {item.id === "checklist"
                    ? ` (${selected.checklist.filter((c) => !c.done).length})`
                    : null}
                </button>
              ))}
            </div>

            {tab === "setup" ? (
              <div className="space-y-4">
                <dl className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className={tqmsLabelClass()}>Dates</dt>
                    <dd className="mt-1.5 text-sm text-white">
                      {formatDateRange(selected.startDate, selected.endDate)}
                    </dd>
                  </div>
                  <div>
                    <dt className={tqmsLabelClass()}>Status</dt>
                    <dd className="mt-1.5">
                      <TqmsStatusPill className={STATUS_CLASS[selected.status]}>
                        {selected.status}
                      </TqmsStatusPill>
                    </dd>
                  </div>
                  <div>
                    <dt className={tqmsLabelClass()}>Location</dt>
                    <dd className="mt-1.5 text-sm text-white">
                      {selected.city}
                      {selected.country ? `, ${selected.country}` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className={tqmsLabelClass()}>Capacity</dt>
                    <dd className="mt-1.5 text-sm text-white">{selected.capacity || "—"}</dd>
                  </div>
                </dl>
                <div>
                  <p className={tqmsLabelClass()}>Room / pavilion layout</p>
                  <p className="mt-1.5 text-sm text-white/75">{selected.roomLayout || "—"}</p>
                </div>
                <div>
                  <p className={tqmsLabelClass()}>Setup notes</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/75">
                    {selected.setupNotes || "No setup notes yet."}
                  </p>
                </div>
              </div>
            ) : null}

            {tab === "members" ? (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setMemberForm({
                        name: "",
                        company: "",
                        role: "Delegate",
                        email: "",
                        tableId: selected.tables[0]?.id ?? "",
                        dietary: "",
                      })
                    }
                    className={tqmsPrimaryButtonClass()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add member
                  </button>
                </div>
                {selected.members.length === 0 ? (
                  <TqmsEmpty message="No members assigned yet." />
                ) : (
                  <ul className="space-y-2">
                    {selected.members.map((member) => {
                      const table = selected.tables.find((row) => row.id === member.tableId);
                      return (
                        <li
                          key={member.id}
                          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white">{member.name}</p>
                              <p className="mt-0.5 text-xs text-white/50">
                                {[member.role, member.company].filter(Boolean).join(" · ")}
                              </p>
                              <p className="mt-0.5 text-xs text-white/40">
                                Table: {table?.label || "Unassigned"}
                                {member.dietary ? ` · ${member.dietary}` : ""}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => setMemberForm(member)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/45 hover:border-sky-400/40 hover:text-sky-200"
                                aria-label={`Edit ${member.name}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Remove ${member.name}?`)) {
                                    deleteEventMember(selected.id, member.id);
                                  }
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/35 hover:border-rose-400/40 hover:text-rose-300"
                                aria-label={`Remove ${member.name}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : null}

            {tab === "tables" ? (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setTableForm({ label: "", capacity: 8, zone: "", notes: "" })
                    }
                    className={tqmsPrimaryButtonClass()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add table
                  </button>
                </div>
                {selected.tables.length === 0 ? (
                  <TqmsEmpty message="No tables planned yet." />
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {selected.tables.map((table) => {
                      const seated = selected.members.filter((m) => m.tableId === table.id).length;
                      return (
                        <div
                          key={table.id}
                          className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-white">{table.label}</p>
                              <p className="mt-1 text-xs text-white/50">
                                {table.zone || "No zone"} · {seated}/{table.capacity} seated
                              </p>
                              {table.notes ? (
                                <p className="mt-1 text-xs text-white/40">{table.notes}</p>
                              ) : null}
                            </div>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => setTableForm(table)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/45 hover:border-sky-400/40 hover:text-sky-200"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Delete ${table.label}?`)) {
                                    deleteEventTable(selected.id, table.id);
                                  }
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/35 hover:border-rose-400/40 hover:text-rose-300"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}

            {tab === "equipment" ? (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setEquipmentForm({
                        name: "",
                        category: "Ops",
                        quantity: 1,
                        status: "ordered",
                        assignedZone: "",
                        notes: "",
                      })
                    }
                    className={tqmsPrimaryButtonClass()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add equipment
                  </button>
                </div>
                {selected.equipment.length === 0 ? (
                  <TqmsEmpty message="No equipment listed yet." />
                ) : (
                  <ul className="space-y-2">
                    {selected.equipment.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium text-white">{item.name}</p>
                              <TqmsStatusPill className={EQUIP_STATUS_CLASS[item.status]}>
                                {item.status.replace("_", " ")}
                              </TqmsStatusPill>
                            </div>
                            <p className="mt-1 text-xs text-white/50">
                              {item.category} · Qty {item.quantity}
                              {item.assignedZone ? ` · ${item.assignedZone}` : ""}
                            </p>
                            {item.notes ? (
                              <p className="mt-1 text-xs text-white/40">{item.notes}</p>
                            ) : null}
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setEquipmentForm(item)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/45 hover:border-sky-400/40 hover:text-sky-200"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Remove ${item.name}?`)) {
                                  deleteEventEquipment(selected.id, item.id);
                                }
                              }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/35 hover:border-rose-400/40 hover:text-rose-300"
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
            ) : null}

            {tab === "checklist" ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <input
                    value={checklistDraft}
                    onChange={(e) => setChecklistDraft(e.target.value)}
                    placeholder="Add checklist item…"
                    className={cn(tqmsInputClass(), "mt-0 min-w-[200px] flex-1")}
                  />
                  <button
                    type="button"
                    disabled={!checklistDraft.trim()}
                    onClick={() => {
                      addChecklistItem(selected.id, checklistDraft);
                      setChecklistDraft("");
                    }}
                    className={tqmsPrimaryButtonClass(!checklistDraft.trim())}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </button>
                </div>
                {selected.checklist.length === 0 ? (
                  <TqmsEmpty message="No checklist items yet." />
                ) : (
                  <ul className="space-y-1.5">
                    {selected.checklist.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                      >
                        <button
                          type="button"
                          onClick={() => toggleChecklistItem(selected.id, item.id)}
                          className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-lg border",
                            item.done
                              ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                              : "border-white/15 text-white/35",
                          )}
                          aria-label={item.done ? "Mark incomplete" : "Mark complete"}
                        >
                          <CheckSquare className="h-3.5 w-3.5" />
                        </button>
                        <p
                          className={cn(
                            "min-w-0 flex-1 text-sm",
                            item.done ? "text-white/40 line-through" : "text-white/85",
                          )}
                        >
                          {item.label}
                        </p>
                        <button
                          type="button"
                          onClick={() => deleteChecklistItem(selected.id, item.id)}
                          className="text-white/30 hover:text-rose-300"
                          aria-label="Delete item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </TqmsSection>
        ) : (
          <TqmsSection title="Event detail" subtitle="Select a conference to manage setup and logistics.">
            <TqmsEmpty message="Select or create a conference on the left." />
          </TqmsSection>
        )}
      </div>

      {eventFormOpen ? (
        <TqmsSlideOver
          title={eventForm.id ? "Edit conference" : "Add conference"}
          subtitle="Core setup details for the event lead."
          onClose={() => setEventFormOpen(false)}
        >
          <form className="space-y-4" onSubmit={handleEventSubmit}>
            <label className="block">
              <span className={tqmsLabelClass()}>Conference name</span>
              <input
                value={eventForm.name}
                onChange={(e) => setEventForm((c) => ({ ...c, name: e.target.value }))}
                className={tqmsInputClass()}
                required
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={tqmsLabelClass()}>Start date</span>
                <input
                  type="date"
                  value={eventForm.startDate}
                  onChange={(e) => setEventForm((c) => ({ ...c, startDate: e.target.value }))}
                  className={tqmsInputClass()}
                  required
                />
              </label>
              <label className="block">
                <span className={tqmsLabelClass()}>End date</span>
                <input
                  type="date"
                  value={eventForm.endDate}
                  onChange={(e) => setEventForm((c) => ({ ...c, endDate: e.target.value }))}
                  className={tqmsInputClass()}
                />
              </label>
            </div>
            <label className="block">
              <span className={tqmsLabelClass()}>Venue</span>
              <input
                value={eventForm.venue}
                onChange={(e) => setEventForm((c) => ({ ...c, venue: e.target.value }))}
                className={tqmsInputClass()}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className={tqmsLabelClass()}>City</span>
                <input
                  value={eventForm.city}
                  onChange={(e) => setEventForm((c) => ({ ...c, city: e.target.value }))}
                  className={tqmsInputClass()}
                />
              </label>
              <label className="block">
                <span className={tqmsLabelClass()}>Country</span>
                <input
                  value={eventForm.country}
                  onChange={(e) => setEventForm((c) => ({ ...c, country: e.target.value }))}
                  className={tqmsInputClass()}
                />
              </label>
              <label className="block">
                <span className={tqmsLabelClass()}>Capacity</span>
                <input
                  value={eventForm.capacity}
                  onChange={(e) => setEventForm((c) => ({ ...c, capacity: e.target.value }))}
                  className={tqmsInputClass()}
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={tqmsLabelClass()}>Status</span>
                <select
                  value={eventForm.status}
                  onChange={(e) =>
                    setEventForm((c) => ({
                      ...c,
                      status: e.target.value as AbhiManagedEventStatus,
                    }))
                  }
                  className={tqmsInputClass()}
                >
                  <option value="planning">Planning</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
              <label className="block">
                <span className={tqmsLabelClass()}>Event lead</span>
                <input
                  value={eventForm.leadName}
                  onChange={(e) => setEventForm((c) => ({ ...c, leadName: e.target.value }))}
                  className={tqmsInputClass()}
                />
              </label>
            </div>
            <label className="block">
              <span className={tqmsLabelClass()}>Room / pavilion layout</span>
              <textarea
                value={eventForm.roomLayout}
                onChange={(e) => setEventForm((c) => ({ ...c, roomLayout: e.target.value }))}
                rows={2}
                className={cn(tqmsInputClass(), "resize-none")}
              />
            </label>
            <label className="block">
              <span className={tqmsLabelClass()}>Setup notes</span>
              <textarea
                value={eventForm.setupNotes}
                onChange={(e) => setEventForm((c) => ({ ...c, setupNotes: e.target.value }))}
                rows={3}
                className={cn(tqmsInputClass(), "resize-none")}
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEventFormOpen(false)}
                className={tqmsSecondaryButtonClass()}
              >
                Cancel
              </button>
              <button type="submit" className={tqmsPrimaryButtonClass()}>
                {eventForm.id ? "Save changes" : "Create conference"}
              </button>
            </div>
          </form>
        </TqmsSlideOver>
      ) : null}

      {memberForm && selected ? (
        <TqmsSlideOver
          title={memberForm.id ? "Edit member" : "Add member"}
          onClose={() => setMemberForm(null)}
        >
          <form className="space-y-3" onSubmit={handleMemberSubmit}>
            <label className="block">
              <span className={tqmsLabelClass()}>Name</span>
              <input
                value={memberForm.name ?? ""}
                onChange={(e) => setMemberForm((c) => ({ ...c, name: e.target.value }))}
                className={tqmsInputClass()}
                required
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={tqmsLabelClass()}>Company</span>
                <input
                  value={memberForm.company ?? ""}
                  onChange={(e) => setMemberForm((c) => ({ ...c, company: e.target.value }))}
                  className={tqmsInputClass()}
                />
              </label>
              <label className="block">
                <span className={tqmsLabelClass()}>Role</span>
                <input
                  value={memberForm.role ?? ""}
                  onChange={(e) => setMemberForm((c) => ({ ...c, role: e.target.value }))}
                  className={tqmsInputClass()}
                />
              </label>
            </div>
            <label className="block">
              <span className={tqmsLabelClass()}>Email</span>
              <input
                type="email"
                value={memberForm.email ?? ""}
                onChange={(e) => setMemberForm((c) => ({ ...c, email: e.target.value }))}
                className={tqmsInputClass()}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={tqmsLabelClass()}>Table</span>
                <select
                  value={memberForm.tableId ?? ""}
                  onChange={(e) => setMemberForm((c) => ({ ...c, tableId: e.target.value }))}
                  className={tqmsInputClass()}
                >
                  <option value="">Unassigned</option>
                  {selected.tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      {table.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={tqmsLabelClass()}>Dietary</span>
                <input
                  value={memberForm.dietary ?? ""}
                  onChange={(e) => setMemberForm((c) => ({ ...c, dietary: e.target.value }))}
                  className={tqmsInputClass()}
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setMemberForm(null)} className={tqmsSecondaryButtonClass()}>
                Cancel
              </button>
              <button type="submit" className={tqmsPrimaryButtonClass()}>
                {memberForm.id ? "Save member" : "Add member"}
              </button>
            </div>
          </form>
        </TqmsSlideOver>
      ) : null}

      {tableForm && selected ? (
        <TqmsSlideOver
          title={tableForm.id ? "Edit table" : "Add table"}
          onClose={() => setTableForm(null)}
        >
          <form className="space-y-3" onSubmit={handleTableSubmit}>
            <label className="block">
              <span className={tqmsLabelClass()}>Label</span>
              <input
                value={tableForm.label ?? ""}
                onChange={(e) => setTableForm((c) => ({ ...c, label: e.target.value }))}
                className={tqmsInputClass()}
                required
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={tqmsLabelClass()}>Capacity</span>
                <input
                  type="number"
                  min={1}
                  value={tableForm.capacity ?? 8}
                  onChange={(e) =>
                    setTableForm((c) => ({ ...c, capacity: Number(e.target.value) || 8 }))
                  }
                  className={tqmsInputClass()}
                />
              </label>
              <label className="block">
                <span className={tqmsLabelClass()}>Zone</span>
                <input
                  value={tableForm.zone ?? ""}
                  onChange={(e) => setTableForm((c) => ({ ...c, zone: e.target.value }))}
                  className={tqmsInputClass()}
                />
              </label>
            </div>
            <label className="block">
              <span className={tqmsLabelClass()}>Notes</span>
              <textarea
                value={tableForm.notes ?? ""}
                onChange={(e) => setTableForm((c) => ({ ...c, notes: e.target.value }))}
                rows={2}
                className={cn(tqmsInputClass(), "resize-none")}
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setTableForm(null)} className={tqmsSecondaryButtonClass()}>
                Cancel
              </button>
              <button type="submit" className={tqmsPrimaryButtonClass()}>
                {tableForm.id ? "Save table" : "Add table"}
              </button>
            </div>
          </form>
        </TqmsSlideOver>
      ) : null}

      {equipmentForm && selected ? (
        <TqmsSlideOver
          title={equipmentForm.id ? "Edit equipment" : "Add equipment"}
          onClose={() => setEquipmentForm(null)}
        >
          <form className="space-y-3" onSubmit={handleEquipmentSubmit}>
            <label className="block">
              <span className={tqmsLabelClass()}>Name</span>
              <input
                value={equipmentForm.name ?? ""}
                onChange={(e) => setEquipmentForm((c) => ({ ...c, name: e.target.value }))}
                className={tqmsInputClass()}
                required
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={tqmsLabelClass()}>Category</span>
                <input
                  value={equipmentForm.category ?? ""}
                  onChange={(e) => setEquipmentForm((c) => ({ ...c, category: e.target.value }))}
                  className={tqmsInputClass()}
                />
              </label>
              <label className="block">
                <span className={tqmsLabelClass()}>Quantity</span>
                <input
                  type="number"
                  min={1}
                  value={equipmentForm.quantity ?? 1}
                  onChange={(e) =>
                    setEquipmentForm((c) => ({
                      ...c,
                      quantity: Number(e.target.value) || 1,
                    }))
                  }
                  className={tqmsInputClass()}
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={tqmsLabelClass()}>Status</span>
                <select
                  value={equipmentForm.status ?? "ordered"}
                  onChange={(e) =>
                    setEquipmentForm((c) => ({
                      ...c,
                      status: e.target.value as AbhiEventEquipmentStatus,
                    }))
                  }
                  className={tqmsInputClass()}
                >
                  <option value="ordered">Ordered</option>
                  <option value="on_site">On site</option>
                  <option value="installed">Installed</option>
                  <option value="returned">Returned</option>
                </select>
              </label>
              <label className="block">
                <span className={tqmsLabelClass()}>Assigned zone</span>
                <input
                  value={equipmentForm.assignedZone ?? ""}
                  onChange={(e) =>
                    setEquipmentForm((c) => ({ ...c, assignedZone: e.target.value }))
                  }
                  className={tqmsInputClass()}
                />
              </label>
            </div>
            <label className="block">
              <span className={tqmsLabelClass()}>Notes</span>
              <textarea
                value={equipmentForm.notes ?? ""}
                onChange={(e) => setEquipmentForm((c) => ({ ...c, notes: e.target.value }))}
                rows={2}
                className={cn(tqmsInputClass(), "resize-none")}
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEquipmentForm(null)}
                className={tqmsSecondaryButtonClass()}
              >
                Cancel
              </button>
              <button type="submit" className={tqmsPrimaryButtonClass()}>
                {equipmentForm.id ? "Save equipment" : "Add equipment"}
              </button>
            </div>
          </form>
        </TqmsSlideOver>
      ) : null}
    </div>
  );
}
