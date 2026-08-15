"use client";

import { useMemo } from "react";
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

import { MarketingDashboardShell } from "@/components/marketing/workspaces/MarketingDashboardShell";
import { CentralMarketingShell } from "@/components/marketing/workspaces/CentralMarketingShell";
import {
  externalEventDisplayRows,
  mailingListDisplayRows,
  managedEventDisplayRows,
  newsletterDisplayRows,
} from "@/lib/marketing/client/onwardair-marketing-display";
import { useMarketingData } from "@/lib/marketing/client/use-marketing-data";
import type { MarketingDashboardKpis } from "@/lib/marketing/types";
import {
  OA_EXTERNAL_EVENTS,
  OA_MAILING_LISTS,
  OA_MANAGED_EVENTS,
  OA_NEWSLETTERS,
} from "@/lib/onwardair/marketing-events-data";
import {
  TqmsKpiTile,
  TqmsSection,
  TqmsStatusPill,
} from "@/components/testflighthub/tqms-ui";
import { cn } from "@/lib/utils";

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

function buildOaFixtureKpis(): MarketingDashboardKpis {
  const subscribers = OA_MAILING_LISTS.reduce((sum, l) => sum + l.subscribers, 0);
  const growth = OA_MAILING_LISTS.reduce((sum, l) => sum + l.growth30d, 0);
  const registered = OA_MANAGED_EVENTS.reduce((sum, e) => sum + e.registered, 0);
  const capacity = OA_MANAGED_EVENTS.reduce((sum, e) => sum + e.capacity, 0);
  const sentNewsletters = OA_NEWSLETTERS.filter((n) => n.status === "sent");
  const avgOpen =
    sentNewsletters.length > 0
      ? sentNewsletters.reduce((sum, n) => sum + (n.openRate ?? 0), 0) / sentNewsletters.length
      : null;

  return {
    newsletterOpenRate: avgOpen,
    sentNewsletterCount: sentNewsletters.length,
    mailingSubscribers: subscribers,
    mailingGrowth30d: growth,
    externalEventsConfirmed: OA_EXTERNAL_EVENTS.filter((e) => e.status === "Confirmed").length,
    externalEventsTotal: OA_EXTERNAL_EVENTS.length,
    managedEventRegistered: registered,
    managedEventCapacity: capacity,
    managedEventCount: OA_MANAGED_EVENTS.length,
  };
}

function useOaMarketingBundle() {
  const { bundle, loading } = useMarketingData();
  const newsletters = useMemo(
    () => newsletterDisplayRows(bundle?.newsletters, OA_NEWSLETTERS),
    [bundle?.newsletters],
  );
  const externalEvents = useMemo(
    () => externalEventDisplayRows(bundle?.externalEvents, OA_EXTERNAL_EVENTS),
    [bundle?.externalEvents],
  );
  const managedEvents = useMemo(
    () => managedEventDisplayRows(bundle?.managedEvents, OA_MANAGED_EVENTS),
    [bundle?.managedEvents],
  );
  const mailingLists = useMemo(
    () => mailingListDisplayRows(bundle?.contacts, bundle?.campaigns, OA_MAILING_LISTS),
    [bundle?.contacts, bundle?.campaigns],
  );
  const kpis = bundle?.kpis ?? buildOaFixtureKpis();
  const dataSource = bundle?.newsletters?.length ? "central" : "fixture";
  return { bundle, loading, newsletters, externalEvents, managedEvents, mailingLists, kpis, dataSource };
}

function DashboardPage() {
  const { kpis, newsletters, dataSource } = useOaMarketingBundle();
  const recentNewsletterTitle =
    newsletters.find((row) => row.status === "sent")?.title ?? null;

  return (
    <MarketingDashboardShell
      moduleLabel="OnwardAir Marketing & Events"
      title="Marketing dashboard"
      description={
        dataSource === "central"
          ? "Aviation brand marketing pipeline — central Marketing & Events service."
          : "Aviation brand marketing pipeline — workspace fixture fallback until central seed loads."
      }
      kpis={kpis}
      recentNewsletterTitle={recentNewsletterTitle}
      readOnly
    />
  );
}

function NewsletterPage() {
  const { newsletters } = useOaMarketingBundle();
  const sent = newsletters.filter((n) => n.status === "sent").length;
  const scheduled = newsletters.filter((n) => n.status === "scheduled").length;
  const drafts = newsletters.filter((n) => n.status === "draft").length;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <TqmsKpiTile label="Sent" value={String(sent)} hint="Last 90 days" />
        <TqmsKpiTile label="Scheduled" value={String(scheduled)} hint="Upcoming sends" />
        <TqmsKpiTile label="Drafts" value={String(drafts)} hint="In progress" />
      </div>
      <TqmsSection title="Newsletter pipeline" subtitle="OnwardAir digital newsletter campaigns.">
        <div className="divide-y divide-white/8">
          {newsletters.map((item) => (
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
  const { externalEvents } = useOaMarketingBundle();

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <TqmsKpiTile label="External events" value={String(externalEvents.length)} />
        <TqmsKpiTile
          label="Confirmed"
          value={String(externalEvents.filter((e) => e.status === "Confirmed").length)}
        />
        <TqmsKpiTile
          label="Planning"
          value={String(externalEvents.filter((e) => e.status === "Planning").length)}
        />
      </div>
      <TqmsSection
        title="Industry & partner events"
        subtitle="External conferences and summits OnwardAir is attending."
      >
        <div className="space-y-3">
          {externalEvents.map((event) => (
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
                {event.website ? (
                  <a
                    href={event.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[12px] text-sky-300/90 hover:text-sky-200"
                  >
                    Site <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
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
  const { managedEvents } = useOaMarketingBundle();
  const registered = managedEvents.reduce((sum, e) => sum + e.registered, 0);
  const capacity = managedEvents.reduce((sum, e) => sum + e.capacity, 0);
  const budget = managedEvents.reduce((sum, e) => sum + e.budgetUsd, 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <TqmsKpiTile label="Owned events" value={String(managedEvents.length)} />
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
        <div className="hidden overflow-x-auto md:block">
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
              {managedEvents.map((event) => (
                <tr key={event.id}>
                  <td className="py-3 pr-3 font-medium text-white">{event.name}</td>
                  <td className="py-3 pr-3 whitespace-nowrap">{event.date}</td>
                  <td className="py-3 pr-3 text-white/60">{event.venue}</td>
                  <td className="py-3 pr-3 whitespace-nowrap">
                    {event.registered}/{event.capacity}
                  </td>
                  <td className="py-3 pr-3">
                    <TqmsStatusPill className={statusClass(event.stage ?? "Draft")}>{event.stage}</TqmsStatusPill>
                  </td>
                  <td className="py-3">{event.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-2.5 md:hidden">
          {managedEvents.map((event) => (
            <article
              key={`${event.id}-mobile`}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 text-sm font-semibold text-white">{event.name}</p>
                <TqmsStatusPill className={statusClass(event.stage ?? "Draft")}>{event.stage}</TqmsStatusPill>
              </div>
              <p className="mt-1 text-xs text-white/55">{event.date}</p>
              <p className="mt-1 text-xs text-white/45">{event.venue}</p>
              <p className="mt-2 text-[11px] text-white/40">
                {event.registered}/{event.capacity} · {event.owner}
              </p>
            </article>
          ))}
        </div>
      </TqmsSection>
    </div>
  );
}

function MailingListPage() {
  const { mailingLists } = useOaMarketingBundle();
  const total = mailingLists.reduce((sum, l) => sum + l.subscribers, 0);
  const growth = mailingLists.reduce((sum, l) => sum + l.growth30d, 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <TqmsKpiTile label="Lists" value={String(mailingLists.length)} />
        <TqmsKpiTile label="Subscribers" value={total.toLocaleString()} />
        <TqmsKpiTile label="30d growth" value={`+${growth}`} hint="Net new contacts" />
      </div>
      <TqmsSection title="Mailing lists" subtitle="Segmented audiences for OnwardAir outreach.">
        <div className="space-y-3">
          {mailingLists.map((list) => (
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
    <CentralMarketingShell
      brandLabel="OnwardAir"
      moduleLabel="Marketing & Events"
      title={meta.title}
      description={meta.blurb}
      readOnly={page === "dashboard"}
    >
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-400/25 bg-rose-500/10">
            <Icon className="h-4 w-4 text-rose-200" strokeWidth={1.75} />
          </div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-rose-200/70">
            <Share2 className="h-3.5 w-3.5" />
            OnwardAir extension
          </div>
        </div>

        {page === "dashboard" ? <DashboardPage /> : null}
        {page === "newsletter" ? <NewsletterPage /> : null}
        {page === "events" ? <ExternalEventsPage /> : null}
        {page === "event-management" ? <EventManagementPage /> : null}
        {page === "mailing-list" ? <MailingListPage /> : null}
      </div>
    </CentralMarketingShell>
  );
}
