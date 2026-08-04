"use client";

import {
  CalendarDays,
  ClipboardCheck,
  ExternalLink,
  LayoutDashboard,
  Mail,
  MapPin,
  Share2,
  Users,
} from "lucide-react";

import {
  OA_EXTERNAL_EVENTS,
  OA_MAILING_LISTS,
  OA_MANAGED_EVENTS,
  OA_NEWSLETTERS,
} from "@/lib/onwardair/marketing-events-data";
import { cn } from "@/lib/utils";
import {
  TqmsKpiTile,
  TqmsSection,
  TqmsStatusPill,
} from "@/components/testflighthub/tqms-ui";

export type OnwardAirMarketingPage =
  | "dashboard"
  | "newsletter"
  | "events"
  | "event-management"
  | "mailing-list";

function statusClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "sent" || s === "active" || s === "confirmed" || s === "live" || s === "completed") {
    return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
  }
  if (s === "scheduled" || s === "planning" || s === "booking" || s === "concept") {
    return "border-amber-400/30 bg-amber-500/15 text-amber-100";
  }
  return "border-white/15 bg-white/5 text-white/70";
}

function DashboardPage() {
  const subscribers = OA_MAILING_LISTS.reduce((sum, l) => sum + l.subscribers, 0);
  const growth = OA_MAILING_LISTS.reduce((sum, l) => sum + l.growth30d, 0);
  const registered = OA_MANAGED_EVENTS.reduce((sum, e) => sum + e.registered, 0);
  const capacity = OA_MANAGED_EVENTS.reduce((sum, e) => sum + e.capacity, 0);
  const sentNewsletters = OA_NEWSLETTERS.filter((n) => n.status === "sent");
  const avgOpen =
    sentNewsletters.length > 0
      ? sentNewsletters.reduce((sum, n) => sum + (n.openRate ?? 0), 0) / sentNewsletters.length
      : 0;
  const upcomingExternal = OA_EXTERNAL_EVENTS.filter((e) => e.status !== "Completed").slice(0, 3);
  const liveOwned = OA_MANAGED_EVENTS.filter((e) => e.stage === "Live" || e.stage === "Booking");
  const recentNewsletter = OA_NEWSLETTERS.find((n) => n.status === "sent") ?? OA_NEWSLETTERS[0];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TqmsKpiTile
          label="Newsletter open rate"
          value={`${avgOpen.toFixed(1)}%`}
          hint={`${sentNewsletters.length} sent campaigns`}
        />
        <TqmsKpiTile
          label="Mailing subscribers"
          value={subscribers.toLocaleString()}
          hint={`+${growth} last 30 days`}
        />
        <TqmsKpiTile
          label="External events"
          value={String(OA_EXTERNAL_EVENTS.filter((e) => e.status === "Confirmed").length)}
          hint={`${OA_EXTERNAL_EVENTS.length} on the calendar`}
        />
        <TqmsKpiTile
          label="Hosted event fill"
          value={`${registered}/${capacity}`}
          hint={`${OA_MANAGED_EVENTS.length} OnwardAir programmes`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TqmsSection title="Pipeline snapshot" subtitle="What needs attention across Marketing & Events.">
          <ul className="space-y-3">
            <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
              <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-rose-200/70">
                <Mail className="h-3.5 w-3.5" /> Newsletter
              </div>
              <p className="mt-1.5 text-sm text-white">
                {OA_NEWSLETTERS.filter((n) => n.status === "draft").length} draft
                {OA_NEWSLETTERS.filter((n) => n.status === "scheduled").length
                  ? ` · ${OA_NEWSLETTERS.filter((n) => n.status === "scheduled").length} scheduled`
                  : ""}
              </p>
              {recentNewsletter ? (
                <p className="mt-1 text-[12px] text-white/45">
                  Latest: {recentNewsletter.title}
                  {recentNewsletter.openRate != null
                    ? ` · ${recentNewsletter.openRate}% open`
                    : ""}
                </p>
              ) : null}
            </li>
            <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
              <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-rose-200/70">
                <Share2 className="h-3.5 w-3.5" /> Social
              </div>
              <p className="mt-1.5 text-sm text-white">
                LinkedIn, Instagram and X channels active for OnwardAir.
              </p>
              <p className="mt-1 text-[12px] text-white/45">
                Last LinkedIn post: certification cycle + Austin investor day.
              </p>
            </li>
            <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
              <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-rose-200/70">
                <Users className="h-3.5 w-3.5" /> Mailing lists
              </div>
              <p className="mt-1.5 text-sm text-white">
                {OA_MAILING_LISTS.filter((l) => l.status === "Active").length} active lists ·{" "}
                {OA_MAILING_LISTS.filter((l) => l.status === "Paused").length} paused
              </p>
              <p className="mt-1 text-[12px] text-white/45">
                Strongest growth on investor relations (+18 / 30d).
              </p>
            </li>
          </ul>
        </TqmsSection>

        <TqmsSection title="Upcoming external events" subtitle="Conferences and partner summits.">
          <div className="space-y-3">
            {upcomingExternal.map((event) => (
              <div
                key={event.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-white">{event.name}</p>
                  <TqmsStatusPill className={statusClass(event.status)}>{event.status}</TqmsStatusPill>
                </div>
                <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-white/50">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {event.startDate} → {event.endDate}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[12px] text-white/50">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.city}, {event.country}
                </p>
              </div>
            ))}
          </div>
        </TqmsSection>
      </div>

      <TqmsSection
        title="OnwardAir-hosted programmes"
        subtitle="Event management — live and booking stages."
      >
        <div className="space-y-3">
          {liveOwned.map((event) => (
            <div
              key={event.id}
              className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-white">{event.name}</p>
                  <TqmsStatusPill className={statusClass(event.stage)}>{event.stage}</TqmsStatusPill>
                </div>
                <p className="mt-1 text-[12px] text-white/45">
                  {event.date} · {event.venue}
                </p>
              </div>
              <p className="text-sm text-white/80">
                {event.registered}/{event.capacity} registered
              </p>
            </div>
          ))}
          {liveOwned.length === 0 ? (
            <p className="text-sm text-white/45">No hosted events currently in live or booking stage.</p>
          ) : null}
        </div>
      </TqmsSection>
    </div>
  );
}

function NewsletterPage() {
  const sent = OA_NEWSLETTERS.filter((n) => n.status === "sent").length;
  const scheduled = OA_NEWSLETTERS.filter((n) => n.status === "scheduled").length;
  const drafts = OA_NEWSLETTERS.filter((n) => n.status === "draft").length;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <TqmsKpiTile label="Sent" value={String(sent)} hint="Last 90 days" />
        <TqmsKpiTile label="Scheduled" value={String(scheduled)} hint="Upcoming sends" />
        <TqmsKpiTile label="Drafts" value={String(drafts)} hint="In progress" />
      </div>
      <TqmsSection title="Newsletter pipeline" subtitle="OnwardAir digital newsletter campaigns.">
        <div className="divide-y divide-white/8">
          {OA_NEWSLETTERS.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <TqmsStatusPill className={statusClass(item.status)}>{item.status}</TqmsStatusPill>
                </div>
                <p className="mt-1 text-[13px] text-white/55">{item.subject}</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-white/40">{item.preview}</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.08em] text-white/35">
                  Audience · {item.audience}
                </p>
              </div>
              <div className="shrink-0 text-left sm:text-right">
                {item.openRate != null ? (
                  <p className="text-sm text-white/80">
                    {item.openRate}% open · {item.clickRate}% click
                  </p>
                ) : (
                  <p className="text-sm text-white/45">
                    {item.scheduledAt
                      ? `Sched. ${new Date(item.scheduledAt).toLocaleDateString()}`
                      : "Not scheduled"}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </TqmsSection>
    </div>
  );
}

function ExternalEventsPage() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <TqmsKpiTile label="External events" value={String(OA_EXTERNAL_EVENTS.length)} />
        <TqmsKpiTile
          label="Confirmed"
          value={String(OA_EXTERNAL_EVENTS.filter((e) => e.status === "Confirmed").length)}
        />
        <TqmsKpiTile
          label="Planning"
          value={String(OA_EXTERNAL_EVENTS.filter((e) => e.status === "Planning").length)}
        />
      </div>
      <TqmsSection
        title="Industry & partner events"
        subtitle="External conferences and summits OnwardAir is attending."
      >
        <div className="space-y-3">
          {OA_EXTERNAL_EVENTS.map((event) => (
            <div
              key={event.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-white">{event.name}</p>
                    <TqmsStatusPill className={statusClass(event.status)}>
                      {event.status}
                    </TqmsStatusPill>
                  </div>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-white/50">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {event.startDate} → {event.endDate}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[12px] text-white/50">
                    <MapPin className="h-3.5 w-3.5" />
                    {event.city}, {event.country}
                  </p>
                </div>
                <a
                  href={event.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[12px] text-sky-300/90 hover:text-sky-200"
                >
                  Site <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="mt-2 text-[12px] text-white/40">{event.notes}</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.08em] text-white/30">
                Owner · {event.owner}
              </p>
            </div>
          ))}
        </div>
      </TqmsSection>
    </div>
  );
}

function EventManagementPage() {
  const registered = OA_MANAGED_EVENTS.reduce((sum, e) => sum + e.registered, 0);
  const capacity = OA_MANAGED_EVENTS.reduce((sum, e) => sum + e.capacity, 0);
  const budget = OA_MANAGED_EVENTS.reduce((sum, e) => sum + e.budgetUsd, 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <TqmsKpiTile label="Owned events" value={String(OA_MANAGED_EVENTS.length)} />
        <TqmsKpiTile label="Registrations" value={`${registered} / ${capacity}`} />
        <TqmsKpiTile
          label="Budget"
          value={`US$${(budget / 1000).toFixed(0)}k`}
          hint="Combined programme"
        />
      </div>
      <TqmsSection
        title="OnwardAir-hosted events"
        subtitle="Internal event delivery — venues, capacity, and stage."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead className="text-[11px] uppercase tracking-[0.08em] text-white/40">
              <tr className="border-b border-white/10">
                <th className="pb-2 pr-3 font-medium">Event</th>
                <th className="pb-2 pr-3 font-medium">Date</th>
                <th className="pb-2 pr-3 font-medium">Venue</th>
                <th className="pb-2 pr-3 font-medium">Fill</th>
                <th className="pb-2 pr-3 font-medium">Stage</th>
                <th className="pb-2 font-medium">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8 text-white/80">
              {OA_MANAGED_EVENTS.map((event) => (
                <tr key={event.id}>
                  <td className="py-3 pr-3 font-medium text-white">{event.name}</td>
                  <td className="py-3 pr-3 whitespace-nowrap">{event.date}</td>
                  <td className="py-3 pr-3 text-white/60">{event.venue}</td>
                  <td className="py-3 pr-3 whitespace-nowrap">
                    {event.registered}/{event.capacity}
                  </td>
                  <td className="py-3 pr-3">
                    <TqmsStatusPill className={statusClass(event.stage)}>{event.stage}</TqmsStatusPill>
                  </td>
                  <td className="py-3">{event.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TqmsSection>
    </div>
  );
}

function MailingListPage() {
  const total = OA_MAILING_LISTS.reduce((sum, l) => sum + l.subscribers, 0);
  const growth = OA_MAILING_LISTS.reduce((sum, l) => sum + l.growth30d, 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <TqmsKpiTile label="Lists" value={String(OA_MAILING_LISTS.length)} />
        <TqmsKpiTile label="Subscribers" value={total.toLocaleString()} />
        <TqmsKpiTile label="30d growth" value={`+${growth}`} hint="Net new contacts" />
      </div>
      <TqmsSection title="Mailing lists" subtitle="Segmented audiences for OnwardAir outreach.">
        <div className="space-y-3">
          {OA_MAILING_LISTS.map((list) => (
            <div
              key={list.id}
              className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-white/45" />
                  <p className="text-sm font-semibold text-white">{list.name}</p>
                  <TqmsStatusPill className={statusClass(list.status)}>{list.status}</TqmsStatusPill>
                </div>
                <p className="mt-1 text-[12px] text-white/45">{list.segment}</p>
                <p className="mt-1 text-[11px] text-white/35">
                  Last campaign · {list.lastCampaign}
                </p>
              </div>
              <div className="shrink-0 text-left sm:text-right">
                <p className="text-sm font-semibold text-white">
                  {list.subscribers.toLocaleString()}
                </p>
                <p
                  className={cn(
                    "text-[12px]",
                    list.growth30d > 0 ? "text-emerald-300/80" : "text-white/40",
                  )}
                >
                  {list.growth30d > 0 ? `+${list.growth30d}` : "0"} / 30d
                </p>
              </div>
            </div>
          ))}
        </div>
      </TqmsSection>
    </div>
  );
}

const PAGE_META: Record<
  OnwardAirMarketingPage,
  { title: string; blurb: string; icon: typeof Mail }
> = {
  dashboard: {
    title: "Dashboard",
    blurb: "Marketing & Events at a glance — campaigns, audiences, and upcoming programmes.",
    icon: LayoutDashboard,
  },
  newsletter: {
    title: "Digital Newsletter",
    blurb: "Campaign drafts, schedules, and engagement for OnwardAir audiences.",
    icon: Mail,
  },
  events: {
    title: "External Events",
    blurb: "Industry conferences and partner summits OnwardAir attends.",
    icon: CalendarDays,
  },
  "event-management": {
    title: "Event Management",
    blurb: "OnwardAir-hosted programmes — capacity, budget, and delivery stage.",
    icon: ClipboardCheck,
  },
  "mailing-list": {
    title: "Mailing List Management",
    blurb: "Subscriber segments for investors, cities, media, and advisors.",
    icon: Users,
  },
};

export default function OnwardAirMarketingEventsWorkspace({
  page,
}: {
  page: OnwardAirMarketingPage;
}) {
  const meta = PAGE_META[page];
  const Icon = meta.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-400/25 bg-rose-500/10">
          <Icon className="h-4 w-4 text-rose-200" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-200/70">
            Marketing & Events
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">{meta.title}</h2>
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-white/50">{meta.blurb}</p>
        </div>
      </div>

      {page === "dashboard" ? <DashboardPage /> : null}
      {page === "newsletter" ? <NewsletterPage /> : null}
      {page === "events" ? <ExternalEventsPage /> : null}
      {page === "event-management" ? <EventManagementPage /> : null}
      {page === "mailing-list" ? <MailingListPage /> : null}
    </div>
  );
}
