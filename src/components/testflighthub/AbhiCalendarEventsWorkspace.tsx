"use client";

import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import {
  ABHI_CALENDAR_EVENT_CATEGORIES,
  type AbhiCalendarEvent,
} from "@/lib/abhi-calendar-events-data";
import {
  addAbhiCalendarEvent,
  formatAbhiCalendarDate,
  getAbhiCalendarEvents,
  removeAbhiCalendarEvent,
  subscribeAbhiCalendarEvents,
  updateAbhiCalendarEvent,
} from "@/lib/abhi-calendar-events-store";
import { cn } from "@/lib/utils";
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

type FormState = {
  id: string | null;
  title: string;
  dateIso: string;
  year: string;
  description: string;
  contactEmail: string;
  category: string;
  url: string;
};

function emptyForm(): FormState {
  const year = String(new Date().getFullYear());
  return {
    id: null,
    title: "",
    dateIso: "",
    year,
    description: "",
    contactEmail: "",
    category: "ABHI Event",
    url: "",
  };
}

function formFromEvent(event: AbhiCalendarEvent): FormState {
  return {
    id: event.id,
    title: event.title,
    dateIso: event.dateIso,
    year: String(event.year),
    description: event.description,
    contactEmail: event.contactEmail,
    category: event.category,
    url: event.url,
  };
}

function dateLabelFromIso(iso: string): string {
  if (!iso) return "";
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function categoryPillClass(category: string) {
  switch (category) {
    case "Exhibition":
      return "border-violet-400/30 bg-violet-500/10 text-violet-200";
    case "Trade Mission":
      return "border-sky-400/30 bg-sky-500/10 text-sky-200";
    case "External Event":
      return "border-amber-400/30 bg-amber-500/10 text-amber-200";
    case "Member Group Meeting":
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
    case "ABHI Event":
    default:
      return "border-rose-400/30 bg-rose-500/10 text-rose-200";
  }
}

export default function AbhiCalendarEventsWorkspace() {
  const [events, setEvents] = useState<AbhiCalendarEvent[]>(() => getAbhiCalendarEvents());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [query, setQuery] = useState("");

  useEffect(() => subscribeAbhiCalendarEvents(() => setEvents(getAbhiCalendarEvents())), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...events]
      .filter((event) => (filterCategory === "all" ? true : event.category === filterCategory))
      .filter((event) => {
        if (!q) return true;
        return (
          event.title.toLowerCase().includes(q) ||
          event.description.toLowerCase().includes(q) ||
          event.contactEmail.toLowerCase().includes(q) ||
          event.category.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.dateIso || a.dateLabel).localeCompare(b.dateIso || b.dateLabel));
  }, [events, filterCategory, query]);

  const categories = useMemo(() => {
    const fromData = new Set<string>([...ABHI_CALENDAR_EVENT_CATEGORIES, ...events.map((e) => e.category)]);
    return [...fromData].sort((a, b) => a.localeCompare(b));
  }, [events]);

  const upcomingCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return events.filter((event) => (event.dateIso || "9999") >= today).length;
  }, [events]);

  function openCreate() {
    setForm(emptyForm());
    setShowForm(true);
  }

  function openEdit(event: AbhiCalendarEvent) {
    setForm(formFromEvent(event));
    setShowForm(true);
  }

  function patchForm(patch: Partial<FormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) return;
    const year = Number(form.year) || new Date().getFullYear();
    const payload = {
      title: form.title,
      dateIso: form.dateIso,
      dateLabel: dateLabelFromIso(form.dateIso) || form.dateIso,
      year,
      description: form.description,
      contactEmail: form.contactEmail,
      category: form.category,
      url: form.url,
    };
    if (form.id) {
      updateAbhiCalendarEvent(form.id, payload);
    } else {
      addAbhiCalendarEvent(payload);
    }
    setShowForm(false);
  }

  function handleDelete(id: string, title: string) {
    if (typeof window !== "undefined" && !window.confirm(`Remove “${title}”?`)) return;
    removeAbhiCalendarEvent(id);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TqmsKpiTile label="Total events" value={events.length} />
        <TqmsKpiTile label="Upcoming" value={upcomingCount} />
        <TqmsKpiTile label="Categories" value={categories.length} />
        <TqmsKpiTile
          label="Source"
          value="ABHI.org.uk"
          hint="Loaded from spreadsheet.xlsx"
        />
      </div>

      <TqmsSection
        title="ABHI Events"
        subtitle="Member meetings, ABHI programmes, exhibitions, and trade missions."
        actions={
          <button type="button" onClick={openCreate} className={tqmsPrimaryButtonClass()}>
            <Plus className="h-3.5 w-3.5" />
            Add event
          </button>
        }
      >
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <label className="min-w-[12rem] flex-1">
            <span className={tqmsLabelClass()}>Search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Title, contact, description…"
              className={tqmsInputClass()}
            />
          </label>
          <label className="w-full sm:w-56">
            <span className={tqmsLabelClass()}>Category</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={tqmsInputClass()}
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <TqmsEmpty message="No ABHI events match this filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-[10px] font-medium uppercase tracking-[0.12em] text-white/35">
                  <th className="pb-2 pr-3 font-medium">Date</th>
                  <th className="pb-2 pr-3 font-medium">Title</th>
                  <th className="pb-2 pr-3 font-medium">Category</th>
                  <th className="pb-2 pr-3 font-medium">Contact</th>
                  <th className="pb-2 pr-3 font-medium">URL</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((event) => (
                  <tr key={event.id} className="border-b border-white/[0.05] last:border-0">
                    <td className="py-3 pr-3 align-top tabular-nums text-white/75">
                      {event.dateLabel || formatAbhiCalendarDate(event.dateIso)}
                      <p className="mt-0.5 text-[11px] text-white/35">{event.year}</p>
                    </td>
                    <td className="py-3 pr-3 align-top">
                      <p className="font-medium text-white">{event.title}</p>
                      {event.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-white/45">{event.description}</p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-3 align-top">
                      <TqmsStatusPill className={categoryPillClass(event.category)}>
                        {event.category}
                      </TqmsStatusPill>
                    </td>
                    <td className="py-3 pr-3 align-top text-xs text-white/65">
                      {event.contactEmail ? (
                        <a
                          href={`mailto:${event.contactEmail}`}
                          className="text-sky-300/90 hover:text-sky-200"
                        >
                          {event.contactEmail}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 pr-3 align-top">
                      {event.url ? (
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-sky-300/90 hover:text-sky-200"
                        >
                          Open
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-white/35">—</span>
                      )}
                    </td>
                    <td className="py-3 align-top">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(event)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/55 transition-colors hover:border-sky-400/40 hover:text-sky-200"
                          aria-label={`Edit ${event.title}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(event.id, event.title)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/40 transition-colors hover:border-rose-400/40 hover:text-rose-300"
                          aria-label={`Remove ${event.title}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TqmsSection>

      {showForm ? (
        <TqmsSlideOver
          title={form.id ? "Edit ABHI event" : "Add ABHI event"}
          subtitle="Update the events calendar shown to the membership team."
          onClose={() => setShowForm(false)}
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className={tqmsLabelClass()}>Title</span>
              <input
                value={form.title}
                onChange={(e) => patchForm({ title: e.target.value })}
                className={tqmsInputClass()}
                required
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={tqmsLabelClass()}>Date</span>
                <input
                  type="date"
                  value={form.dateIso}
                  onChange={(e) =>
                    patchForm({
                      dateIso: e.target.value,
                      year: e.target.value.slice(0, 4) || form.year,
                    })
                  }
                  className={tqmsInputClass()}
                />
              </label>
              <label className="block">
                <span className={tqmsLabelClass()}>Year</span>
                <input
                  value={form.year}
                  onChange={(e) => patchForm({ year: e.target.value })}
                  className={tqmsInputClass()}
                />
              </label>
            </div>
            <label className="block">
              <span className={tqmsLabelClass()}>Category</span>
              <select
                value={form.category}
                onChange={(e) => patchForm({ category: e.target.value })}
                className={tqmsInputClass()}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={tqmsLabelClass()}>Contact email</span>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => patchForm({ contactEmail: e.target.value })}
                className={tqmsInputClass()}
              />
            </label>
            <label className="block">
              <span className={tqmsLabelClass()}>URL</span>
              <input
                value={form.url}
                onChange={(e) => patchForm({ url: e.target.value })}
                placeholder="https://www.abhi.org.uk/events/…"
                className={tqmsInputClass()}
              />
            </label>
            <label className="block">
              <span className={tqmsLabelClass()}>Description</span>
              <textarea
                value={form.description}
                onChange={(e) => patchForm({ description: e.target.value })}
                className={cn(tqmsInputClass(), "min-h-[6rem] resize-y")}
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className={tqmsSecondaryButtonClass()}
              >
                Cancel
              </button>
              <button type="submit" className={tqmsPrimaryButtonClass()}>
                {form.id ? "Save changes" : "Add event"}
              </button>
            </div>
          </form>
        </TqmsSlideOver>
      ) : null}
    </div>
  );
}
