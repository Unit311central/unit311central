export type CalendarEventType = "meeting" | "onsite" | "other";

export type CalendarEvent = {
  id: string;
  title: string;
  eventType: CalendarEventType;
  startsAt: string;
  endsAt: string;
  clientName: string | null;
  location: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type DbCalendarEvent = {
  id: string;
  title: string;
  event_type: string;
  starts_at: string;
  ends_at: string;
  client_name: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const CALENDAR_EVENT_TYPE_OPTIONS: { value: CalendarEventType; label: string }[] = [
  { value: "meeting", label: "Meeting" },
  { value: "onsite", label: "Onsite at client" },
  { value: "other", label: "Other" },
];

export function mapCalendarEvent(row: DbCalendarEvent): CalendarEvent {
  const eventType = row.event_type as CalendarEventType;
  return {
    id: row.id,
    title: row.title,
    eventType: eventType === "meeting" || eventType === "onsite" ? eventType : "other",
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    clientName: row.client_name,
    location: row.location,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function eventTypeLabel(type: CalendarEventType) {
  return CALENDAR_EVENT_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

export function eventTypeClass(type: CalendarEventType) {
  switch (type) {
    case "meeting":
      return "bg-sky-500/20 text-sky-200 border-sky-400/30";
    case "onsite":
      return "bg-amber-500/20 text-amber-200 border-amber-400/30";
    default:
      return "bg-violet-500/20 text-violet-200 border-violet-400/30";
  }
}

export function createBlankEventInput(date?: Date) {
  const base = date ?? new Date();
  const start = new Date(base);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start);
  end.setHours(10, 0, 0, 0);

  return {
    title: "",
    eventType: "meeting" as CalendarEventType,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    clientName: "",
    location: "",
    notes: "",
  };
}

export function formatEventTimeRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const sameDay = start.toDateString() === end.toDateString();
  const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });
  const dateFmt = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  if (sameDay) {
    return `${dateFmt.format(start)} · ${timeFmt.format(start)} – ${timeFmt.format(end)}`;
  }

  return `${dateFmt.format(start)} ${timeFmt.format(start)} – ${dateFmt.format(end)} ${timeFmt.format(end)}`;
}

export function toDateKey(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toDateInputValue(iso: string) {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toTimeInputValue(iso: string) {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function combineDateAndTime(dateValue: string, timeValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hours, minutes] = timeValue.split(":").map(Number);
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return date.toISOString();
}

export function dateKeyFromIso(iso: string) {
  return toDateInputValue(iso);
}

export function getMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startDay = (first.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - startDay);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
