"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  CALENDAR_EVENT_TYPE_OPTIONS,
  combineDateAndTime,
  createBlankEventInput,
  dateKeyFromIso,
  eventTypeClass,
  eventTypeLabel,
  formatEventTimeRange,
  getMonthGrid,
  isSameDay,
  toDateInputValue,
  toDateKey,
  toTimeInputValue,
  type CalendarEvent,
  type CalendarEventType,
} from "@/lib/calendar-data";
import type { ManagedClient } from "@/lib/client-management-data";
import { createInitialUsers, type ManagedUser } from "@/lib/user-management-data";
import { cn } from "@/lib/utils";
import ResponsiveMasterDetail, { useMobileDetailPanel } from "@/components/ui/ResponsiveMasterDetail";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  Users,
} from "lucide-react";

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(response.ok ? "Invalid server response." : text.slice(0, 180));
  }
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
      {children}
    </label>
  );
}

function inputClassName() {
  return "mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-sky-400/50";
}

type EventDraft = {
  id: string | null;
  title: string;
  eventType: CalendarEventType;
  date: string;
  startTime: string;
  endTime: string;
  clientName: string;
  location: string;
  notes: string;
};

function eventToDraft(event: CalendarEvent): EventDraft {
  return {
    id: event.id,
    title: event.title,
    eventType: event.eventType,
    date: toDateInputValue(event.startsAt),
    startTime: toTimeInputValue(event.startsAt),
    endTime: toTimeInputValue(event.endsAt),
    clientName: event.clientName ?? "",
    location: event.location ?? "",
    notes: event.notes ?? "",
  };
}

function blankDraft(date: Date): EventDraft {
  const blank = createBlankEventInput(date);
  return {
    id: null,
    title: "",
    eventType: blank.eventType,
    date: toDateInputValue(blank.startsAt),
    startTime: toTimeInputValue(blank.startsAt),
    endTime: toTimeInputValue(blank.endsAt),
    clientName: "",
    location: "",
    notes: "",
  };
}

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type CalendarViewMode = "shared" | "internal" | "client" | "training";

const CALENDAR_VIEW_OPTIONS: { value: CalendarViewMode; label: string }[] = [
  { value: "shared", label: "Shared" },
  { value: "internal", label: "Internal user" },
  { value: "client", label: "Client" },
  { value: "training", label: "Training" },
];

type CalendarWorkspaceProps = {
  users?: ManagedUser[];
  clients?: ManagedClient[];
};

function matchesCalendarView(
  event: CalendarEvent,
  viewMode: CalendarViewMode,
  selectedUserId: string,
  selectedClientId: string,
  users: ManagedUser[],
  clients: ManagedClient[],
) {
  const haystack = `${event.title} ${event.notes ?? ""} ${event.location ?? ""}`.toLowerCase();

  if (viewMode === "shared") return true;

  if (viewMode === "training") {
    return /\btraining\b/i.test(haystack);
  }

  if (viewMode === "client") {
    if (selectedClientId === "all") {
      return event.eventType === "onsite" || Boolean(event.clientName?.trim());
    }

    const client = clients.find((entry) => entry.id === selectedClientId);
    if (!client) return false;
    const needle = client.companyName.trim().toLowerCase();
    return Boolean(event.clientName?.trim().toLowerCase().includes(needle));
  }

  if (selectedUserId === "all") {
    return event.eventType === "meeting" || (!event.clientName?.trim() && event.eventType !== "onsite");
  }

  const user = users.find((entry) => entry.id === selectedUserId);
  if (!user) return false;

  const fullName = user.fullName.trim().toLowerCase();
  const username = user.username.trim().toLowerCase();
  return haystack.includes(fullName) || (username.length > 0 && haystack.includes(username));
}

export default function CalendarWorkspace({
  users = createInitialUsers(),
  clients = [],
}: CalendarWorkspaceProps) {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => new Date(today));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<EventDraft>(() => blankDraft(today));
  const [editing, setEditing] = useState(false);
  const [viewMode, setViewMode] = useState<CalendarViewMode>("shared");
  const [selectedUserId, setSelectedUserId] = useState("all");
  const [selectedClientId, setSelectedClientId] = useState("all");
  const { showDetail, openDetail, closeDetail } = useMobileDetailPanel();

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(viewDate),
    [viewDate],
  );

  const monthGrid = useMemo(
    () => getMonthGrid(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate],
  );

  const rangeFrom = useMemo(() => {
    const start = monthGrid[0];
    return new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0).toISOString();
  }, [monthGrid]);

  const rangeTo = useMemo(() => {
    const end = monthGrid[monthGrid.length - 1];
    return new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).toISOString();
  }, [monthGrid]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      if (!matchesCalendarView(event, viewMode, selectedUserId, selectedClientId, users, clients)) {
        continue;
      }
      const key = dateKeyFromIso(event.startsAt);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    }
    return map;
  }, [clients, events, selectedClientId, selectedUserId, users, viewMode]);

  const selectedDateKey = toDateKey(selectedDate);
  const selectedDayEvents = eventsByDate.get(selectedDateKey) ?? [];

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ from: rangeFrom, to: rangeTo });
      const response = await fetch(`/api/calendar/events?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await readApiJson<{ events?: CalendarEvent[]; error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to load calendar");

      setEvents(data.events ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load calendar");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [rangeFrom, rangeTo]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  function goToPreviousMonth() {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  function goToToday() {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
    setDraft(blankDraft(now));
    setEditing(true);
  }

  function selectDay(date: Date) {
    setSelectedDate(date);
    setDraft(blankDraft(date));
    setEditing(true);
    openDetail();
  }

  function editEvent(event: CalendarEvent) {
    setSelectedDate(new Date(event.startsAt));
    setDraft(eventToDraft(event));
    setEditing(true);
    openDetail();
  }

  async function saveDraft() {
    if (!draft.title.trim()) {
      setError("Title is required");
      return;
    }

    setBusy(true);
    setError(null);

    const payload = {
      title: draft.title.trim(),
      eventType: draft.eventType,
      startsAt: combineDateAndTime(draft.date, draft.startTime),
      endsAt: combineDateAndTime(draft.date, draft.endTime),
      clientName: draft.clientName,
      location: draft.location,
      notes: draft.notes,
    };

    try {
      if (draft.id) {
        const response = await fetch(`/api/calendar/events/${draft.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await readApiJson<{ event?: CalendarEvent; error?: string }>(response);
        if (!response.ok || !data.event) throw new Error(data.error ?? "Failed to save event");
        setEvents((current) => current.map((item) => (item.id === data.event!.id ? data.event! : item)));
      } else {
        const response = await fetch("/api/calendar/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await readApiJson<{ event?: CalendarEvent; error?: string }>(response);
        if (!response.ok || !data.event) throw new Error(data.error ?? "Failed to create event");
        setEvents((current) => [...current, data.event!].sort(
          (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        ));
        setDraft(eventToDraft(data.event));
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save event");
    } finally {
      setBusy(false);
    }
  }

  async function deleteDraft() {
    if (!draft.id) return;
    if (!window.confirm("Delete this event?")) return;

    setBusy(true);
    setError(null);

    try {
      const response = await fetch(`/api/calendar/events/${draft.id}`, { method: "DELETE" });
      const data = await readApiJson<{ ok?: boolean; error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to delete event");

      setEvents((current) => current.filter((item) => item.id !== draft.id));
      setDraft(blankDraft(selectedDate));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete event");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ResponsiveMasterDetail
      showDetail={showDetail}
      onBack={closeDetail}
      backLabel="Back to calendar"
      columnsClassName="xl:grid-cols-[minmax(0,1fr)_22rem]"
      master={
      <section className="min-w-0 rounded-2xl border border-white/10 bg-[#0a1422]/80 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-sky-300" />
            <h2 className="text-lg font-semibold text-white">{monthLabel}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-white/10 bg-[#0b1524]/80 p-1">
              {CALENDAR_VIEW_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setViewMode(option.value)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    viewMode === option.value
                      ? "bg-sky-500 text-white"
                      : "text-white/60 hover:text-white",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {viewMode === "internal" && (
              <select
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
                className="rounded-xl border border-white/10 bg-[#0b1524] px-3 py-1.5 text-xs text-white outline-none focus:border-sky-400/50"
              >
                <option value="all">All internal users</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName}
                  </option>
                ))}
              </select>
            )}
            {viewMode === "client" && (
              <select
                value={selectedClientId}
                onChange={(event) => setSelectedClientId(event.target.value)}
                className="rounded-xl border border-white/10 bg-[#0b1524] px-3 py-1.5 text-xs text-white outline-none focus:border-sky-400/50"
              >
                <option value="all">All clients</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.companyName}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={goToToday}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 transition-colors hover:bg-white/5 hover:text-white"
            >
              Today
            </button>
            <button
              type="button"
              onClick={goToPreviousMonth}
              aria-label="Previous month"
              className="rounded-lg border border-white/10 p-2 text-white/70 transition-colors hover:bg-white/5 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goToNextMonth}
              aria-label="Next month"
              className="rounded-lg border border-white/10 p-2 text-white/70 transition-colors hover:bg-white/5 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium uppercase tracking-[0.08em] text-white/40 sm:mt-4 sm:gap-1 sm:text-[11px]">
          {weekdayLabels.map((label) => (
            <div key={label} className="py-2">
              {label}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex min-h-[18rem] items-center justify-center text-white/50">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {monthGrid.map((date) => {
              const key = toDateKey(date);
              const dayEvents = eventsByDate.get(key) ?? [];
              const inMonth = date.getMonth() === viewDate.getMonth();
              const isToday = isSameDay(date, today);
              const isSelected = isSameDay(date, selectedDate);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectDay(date)}
                  className={cn(
                    "flex min-h-[4.25rem] flex-col rounded-lg border p-1.5 text-left transition-colors sm:min-h-[5.5rem] sm:rounded-xl sm:p-2 lg:min-h-[6.5rem]",
                    inMonth ? "border-white/8 bg-[#0b1524]/70" : "border-transparent bg-transparent opacity-40",
                    isSelected && "border-sky-400/40 bg-sky-500/10",
                    !isSelected && "hover:border-white/15 hover:bg-[#0d1828]",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                      isToday ? "bg-sky-500 text-white" : "text-white/80",
                    )}
                  >
                    {date.getDate()}
                  </span>
                  <div className="mt-1 space-y-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "truncate rounded-md border px-1.5 py-0.5 text-[10px] leading-tight",
                          eventTypeClass(event.eventType),
                        )}
                      >
                        {toTimeInputValue(event.startsAt)} {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-white/45">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
      }
      detail={
      <aside className="space-y-4">
        <section className="rounded-2xl border border-white/10 bg-[#0a1422]/80 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
                Selected day
              </p>
              <h3 className="mt-1 text-base font-semibold text-white">
                {new Intl.DateTimeFormat(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                }).format(selectedDate)}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setDraft(blankDraft(selectedDate));
                setEditing(true);
                openDetail();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-400/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-200 transition-colors hover:bg-sky-500/20"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {selectedDayEvents.length === 0 ? (
              <p className="text-sm text-white/45">No events scheduled.</p>
            ) : (
              selectedDayEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => editEvent(event)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2.5 text-left transition-colors hover:bg-white/[0.03]",
                    draft.id === event.id ? "border-sky-400/40 bg-sky-500/10" : "border-white/10",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-white">{event.title}</p>
                    <span
                      className={cn(
                        "shrink-0 rounded-md border px-1.5 py-0.5 text-[10px]",
                        eventTypeClass(event.eventType),
                      )}
                    >
                      {eventTypeLabel(event.eventType)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-white/50">
                    {formatEventTimeRange(event.startsAt, event.endsAt)}
                  </p>
                  {event.clientName && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-white/55">
                      <Users className="h-3 w-3" />
                      {event.clientName}
                    </p>
                  )}
                  {event.location && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-white/55">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>
        </section>

        {editing && (
          <section className="rounded-2xl border border-white/10 bg-[#0a1422]/80 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:p-5">
            <h3 className="text-base font-semibold text-white">
              {draft.id ? "Edit event" : "New event"}
            </h3>

            {error && (
              <p className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <FieldLabel>Title</FieldLabel>
                <input
                  value={draft.title}
                  onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Client meeting, site visit…"
                  className={inputClassName()}
                />
              </div>

              <div>
                <FieldLabel>Type</FieldLabel>
                <select
                  value={draft.eventType}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      eventType: event.target.value as CalendarEventType,
                    }))
                  }
                  className={inputClassName()}
                >
                  {CALENDAR_EVENT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-3 sm:col-span-1">
                  <FieldLabel>Date</FieldLabel>
                  <input
                    type="date"
                    value={draft.date}
                    onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))}
                    className={inputClassName()}
                  />
                </div>
                <div>
                  <FieldLabel>Start</FieldLabel>
                  <input
                    type="time"
                    value={draft.startTime}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, startTime: event.target.value }))
                    }
                    className={inputClassName()}
                  />
                </div>
                <div>
                  <FieldLabel>End</FieldLabel>
                  <input
                    type="time"
                    value={draft.endTime}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, endTime: event.target.value }))
                    }
                    className={inputClassName()}
                  />
                </div>
              </div>

              {draft.eventType === "onsite" && (
                <div>
                  <FieldLabel>Client</FieldLabel>
                  <select
                    value={draft.clientName}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, clientName: event.target.value }))
                    }
                    className={inputClassName()}
                  >
                    <option value="">Select client…</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.companyName}>
                        {client.companyName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <FieldLabel>Location</FieldLabel>
                <input
                  value={draft.location}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, location: event.target.value }))
                  }
                  placeholder="Address, site, or meeting link"
                  className={inputClassName()}
                />
              </div>

              <div>
                <FieldLabel>Notes</FieldLabel>
                <textarea
                  value={draft.notes}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, notes: event.target.value }))
                  }
                  rows={3}
                  className={cn(inputClassName(), "resize-y")}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveDraft()}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-400 disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </button>
              {draft.id && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void deleteDraft()}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-400/30 px-4 py-2 text-sm text-rose-200 transition-colors hover:bg-rose-500/10 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              )}
            </div>
          </section>
        )}
      </aside>
      }
    />
  );
}
