/**
 * ABHI Events calendar — client mock store seeded from spreadsheet.xlsx.
 */

import {
  ABHI_CALENDAR_EVENTS_SEED,
  type AbhiCalendarEvent,
} from "@/lib/abhi-calendar-events-data";

type Listener = () => void;

let events: AbhiCalendarEvent[] = ABHI_CALENDAR_EVENTS_SEED.map((event) => ({ ...event }));
const listeners = new Set<Listener>();

function notify() {
  for (const listener of listeners) listener();
}

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `abhi-cal-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `abhi-cal-${Math.random().toString(36).slice(2, 10)}`;
}

export function getAbhiCalendarEvents(): AbhiCalendarEvent[] {
  return events;
}

export function subscribeAbhiCalendarEvents(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function addAbhiCalendarEvent(
  input: Omit<AbhiCalendarEvent, "id"> & { id?: string },
): AbhiCalendarEvent {
  const next: AbhiCalendarEvent = {
    id: input.id ?? uid(),
    title: input.title.trim(),
    dateLabel: input.dateLabel.trim(),
    dateIso: input.dateIso.trim(),
    year: input.year,
    description: input.description.trim(),
    contactEmail: input.contactEmail.trim(),
    category: input.category.trim() || "ABHI Event",
    url: input.url.trim(),
  };
  events = [next, ...events];
  notify();
  return next;
}

export function updateAbhiCalendarEvent(
  id: string,
  patch: Partial<Omit<AbhiCalendarEvent, "id">>,
): AbhiCalendarEvent | null {
  let updated: AbhiCalendarEvent | null = null;
  events = events.map((event) => {
    if (event.id !== id) return event;
    updated = {
      ...event,
      ...patch,
      title: (patch.title ?? event.title).trim(),
      dateLabel: (patch.dateLabel ?? event.dateLabel).trim(),
      dateIso: (patch.dateIso ?? event.dateIso).trim(),
      description: (patch.description ?? event.description).trim(),
      contactEmail: (patch.contactEmail ?? event.contactEmail).trim(),
      category: (patch.category ?? event.category).toString().trim() || event.category,
      url: (patch.url ?? event.url).trim(),
      year: patch.year ?? event.year,
    };
    return updated;
  });
  if (updated) notify();
  return updated;
}

export function removeAbhiCalendarEvent(id: string): boolean {
  const before = events.length;
  events = events.filter((event) => event.id !== id);
  if (events.length !== before) {
    notify();
    return true;
  }
  return false;
}

export function formatAbhiCalendarDate(iso: string, fallback = "—"): string {
  if (!iso) return fallback;
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
