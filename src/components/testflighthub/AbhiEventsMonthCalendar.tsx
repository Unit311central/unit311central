"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import { tqmsSecondaryButtonClass } from "./tqms-ui";

export type AbhiCalendarMonthItem = {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  location?: string;
  colorClass?: string;
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const DEFAULT_MARKER_COLORS = [
  "bg-sky-400",
  "bg-violet-400",
  "bg-amber-400",
  "bg-emerald-400",
  "bg-rose-400",
  "bg-cyan-400",
  "bg-orange-400",
  "bg-indigo-400",
] as const;

function parseIso(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

function isoKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parseIso(iso));
}

function formatDateRange(startDate: string, endDate?: string): string {
  const end = endDate || startDate;
  return startDate === end
    ? formatShortDate(startDate)
    : `${formatShortDate(startDate)} – ${formatShortDate(end)}`;
}

function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(
    new Date(year, month, 1),
  );
}

function buildMonthCells(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];

  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function markerColor(item: AbhiCalendarMonthItem, index: number): string {
  return item.colorClass ?? DEFAULT_MARKER_COLORS[index % DEFAULT_MARKER_COLORS.length];
}

function CalendarTooltip({
  item,
  align = "center",
}: {
  item: AbhiCalendarMonthItem;
  align?: "left" | "center" | "right";
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute bottom-full z-30 mb-2 w-56 rounded-xl border border-white/15 bg-[#0b1524]/95 p-3 opacity-0 shadow-[0_16px_48px_rgba(0,0,0,0.55)] backdrop-blur-xl transition-opacity group-hover/marker:opacity-100",
        align === "left" && "left-0",
        align === "center" && "left-1/2 -translate-x-1/2",
        align === "right" && "right-0",
      )}
    >
      <p className="text-sm font-semibold leading-snug text-white">{item.title}</p>
      {item.location ? (
        <p className="mt-1.5 text-xs text-white/55">{item.location}</p>
      ) : null}
      <p className="mt-1 text-xs tabular-nums text-sky-200/90">
        {formatDateRange(item.startDate, item.endDate)}
      </p>
    </div>
  );
}

export default function AbhiEventsMonthCalendar({
  items,
  selectedId,
  onSelect,
  focusDate,
  className,
}: {
  items: AbhiCalendarMonthItem[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  focusDate?: string;
  className?: string;
}) {
  const initial = focusDate ? parseIso(focusDate) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  useEffect(() => {
    if (!focusDate) return;
    const focused = parseIso(focusDate);
    setViewYear(focused.getFullYear());
    setViewMonth(focused.getMonth());
  }, [focusDate]);

  const todayKey = isoKey(new Date());

  const itemsByDay = useMemo(() => {
    const map = new Map<string, AbhiCalendarMonthItem[]>();
    for (const item of items) {
      const start = parseIso(item.startDate);
      const end = parseIso(item.endDate || item.startDate);
      const cursor = new Date(start);
      while (cursor <= end) {
        const key = isoKey(cursor);
        const bucket = map.get(key) ?? [];
        bucket.push(item);
        map.set(key, bucket);
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    return map;
  }, [items]);

  const cells = useMemo(() => buildMonthCells(viewYear, viewMonth), [viewYear, viewMonth]);

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  function goToToday() {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  }

  return (
    <div
      className={cn(
        "flex h-full min-h-[28rem] flex-col rounded-xl border border-white/10 bg-[#0b1524]/60 p-3 sm:p-4",
        className,
      )}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">{monthLabel(viewYear, viewMonth)}</h3>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={goToToday} className={tqmsSecondaryButtonClass()}>
            Today
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-white/70 transition-colors hover:bg-white/[0.08]"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-white/70 transition-colors hover:bg-white/[0.08]"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px rounded-lg border border-white/[0.06] bg-white/[0.06]">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="bg-[#0b1524]/90 px-1 py-2 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-white/35"
          >
            {label}
          </div>
        ))}

        {cells.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="min-h-[4.5rem] bg-[#0b1524]/40" />;
          }

          const dayKey = isoKey(date);
          const dayItems = itemsByDay.get(dayKey) ?? [];
          const isToday = dayKey === todayKey;
          const col = index % 7;
          const tooltipAlign = col <= 1 ? "left" : col >= 5 ? "right" : "center";

          return (
            <div
              key={dayKey}
              className={cn(
                "group/day relative min-h-[4.5rem] bg-[#0b1524]/80 p-1.5 transition-colors hover:bg-white/[0.04]",
                isToday && "ring-1 ring-inset ring-sky-400/40",
                dayItems.some((item) => item.id === selectedId) && "bg-sky-500/[0.08]",
              )}
            >
              <p
                className={cn(
                  "mb-1 text-right text-xs tabular-nums",
                  isToday ? "font-semibold text-sky-200" : "text-white/55",
                )}
              >
                {date.getDate()}
              </p>

              <div className="space-y-0.5">
                {dayItems.slice(0, 3).map((item, itemIndex) => {
                  const color = markerColor(item, itemIndex);
                  const selected = item.id === selectedId;
                  return (
                    <button
                      key={`${item.id}-${dayKey}`}
                      type="button"
                      title={`${item.title}${item.location ? ` · ${item.location}` : ""}`}
                      onClick={() => onSelect?.(item.id)}
                      className={cn(
                        "group/marker relative flex w-full items-center gap-1 rounded px-1 py-0.5 text-left transition-colors hover:bg-white/[0.06]",
                        selected && "bg-white/[0.06]",
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", color)} />
                      <span className="truncate text-[10px] leading-tight text-white/70 group-hover/marker:text-white">
                        {item.title}
                      </span>
                      <CalendarTooltip item={item} align={tooltipAlign} />
                    </button>
                  );
                })}
                {dayItems.length > 3 ? (
                  <p className="px-1 text-[10px] text-white/40">+{dayItems.length - 3} more</p>
                ) : null}
              </div>

              {dayItems.length > 0 ? (
                <div className="pointer-events-none absolute inset-x-1 bottom-1 hidden group-hover/day:block">
                  <div className="rounded-lg border border-white/10 bg-[#0b1524]/95 p-2 shadow-lg backdrop-blur-xl">
                    {dayItems.slice(0, 4).map((item) => (
                      <div key={`tip-${item.id}`} className="py-0.5">
                        <p className="truncate text-[11px] font-medium text-white">{item.title}</p>
                        <p className="truncate text-[10px] text-white/45">
                          {[item.location, formatDateRange(item.startDate, item.endDate)]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {items.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-3 border-t border-white/[0.06] pt-3">
          {[...new Map(items.map((item, i) => [item.id, { item, i }])).values()]
            .slice(0, 6)
            .map(({ item, i }) => (
              <span key={item.id} className="inline-flex items-center gap-1.5 text-[10px] text-white/45">
                <span className={cn("h-2 w-2 rounded-full", markerColor(item, i))} />
                <span className="max-w-[8rem] truncate">{item.title}</span>
              </span>
            ))}
        </div>
      ) : null}
    </div>
  );
}

export { formatDateRange as formatAbhiEventDateRange };
