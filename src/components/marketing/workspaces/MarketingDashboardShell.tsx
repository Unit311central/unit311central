"use client";

import {
  WorkspaceKpiTile,
  WorkspaceModuleHeader,
  WorkspaceSection,
} from "@/components/workspace-ui";
import type { MarketingDashboardKpis, ExternalEvent, ManagedEvent } from "@/lib/marketing/types";

export function MarketingDashboardShell({
  moduleLabel,
  brandLabel,
  title,
  description,
  kpis,
  recentNewsletterTitle,
  upcomingExternalEvents = [],
  liveManagedEvents = [],
  readOnly = false,
}: {
  moduleLabel?: string;
  brandLabel?: string;
  title: string;
  description: string;
  kpis: MarketingDashboardKpis;
  recentNewsletterTitle?: string | null;
  upcomingExternalEvents?: ExternalEvent[];
  liveManagedEvents?: ManagedEvent[];
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-5">
      <WorkspaceModuleHeader
        moduleLabel={moduleLabel}
        title={title}
        description={description}
        brandLabel={brandLabel}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <WorkspaceKpiTile
          label="Newsletter open rate"
          value={kpis.newsletterOpenRate != null ? `${kpis.newsletterOpenRate.toFixed(1)}%` : "—"}
          hint={`${kpis.sentNewsletterCount} sent campaigns`}
        />
        <WorkspaceKpiTile
          label="Mailing subscribers"
          value={kpis.mailingSubscribers.toLocaleString()}
          hint={`+${kpis.mailingGrowth30d} last 30 days`}
        />
        <WorkspaceKpiTile
          label="External events"
          value={String(kpis.externalEventsConfirmed)}
          hint={`${kpis.externalEventsTotal} on the calendar`}
        />
        <WorkspaceKpiTile
          label="Hosted event fill"
          value={`${kpis.managedEventRegistered}/${kpis.managedEventCapacity}`}
          hint={`${kpis.managedEventCount} programmes`}
        />
      </div>

      {recentNewsletterTitle ? (
        <WorkspaceSection
          title="Recent newsletter"
          subtitle={readOnly ? "Workspace fixture provider (read-only)" : "Latest sent or scheduled issue"}
        >
          <p className="text-sm text-white/70">{recentNewsletterTitle}</p>
        </WorkspaceSection>
      ) : null}

      {upcomingExternalEvents.length > 0 ? (
        <WorkspaceSection title="Upcoming external events">
          <ul className="space-y-2 text-sm text-white/70">
            {upcomingExternalEvents.slice(0, 5).map((event) => (
              <li key={event.id}>
                {event.name} — {event.city}, {event.country}
              </li>
            ))}
          </ul>
        </WorkspaceSection>
      ) : null}

      {liveManagedEvents.length > 0 ? (
        <WorkspaceSection title="Live / booking programmes">
          <ul className="space-y-2 text-sm text-white/70">
            {liveManagedEvents.slice(0, 5).map((event) => (
              <li key={event.id}>
                {event.name} — {event.registered}/{event.capacity} registered
              </li>
            ))}
          </ul>
        </WorkspaceSection>
      ) : null}
    </div>
  );
}
