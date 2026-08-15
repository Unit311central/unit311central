import type { Campaign, ExternalEvent, ManagedEvent, Newsletter } from "@/lib/marketing/types";
import type {
  OaExternalEvent,
  OaMailingList,
  OaManagedEvent,
  OaNewsletter,
} from "@/lib/onwardair/marketing-events-data";

/** Prefer central API bundle rows; fall back to workspace fixture seeds when central is empty. */
export function resolveCentralOrFixture<T>(central: T[] | undefined, fixture: readonly T[]): T[] {
  if (central && central.length > 0) return central;
  return [...fixture];
}

export function newsletterDisplayRows(
  central: Newsletter[] | undefined,
  fixture: readonly OaNewsletter[],
) {
  if (central && central.length > 0) {
    return central.map((row) => ({
      id: row.id,
      title: row.title,
      subject: row.subject,
      status: row.status,
      scheduledAt: row.scheduledAt,
      sentAt: row.sentAt,
      audience:
        (row as { extensionData?: { audience?: string } }).extensionData?.audience ??
        "Central mailing list",
      openRate: row.metrics?.openRate ?? null,
      clickRate: row.metrics?.clickRate ?? null,
      preview: row.htmlBody?.replace(/<[^>]+>/g, " ").slice(0, 140) || row.subject,
    }));
  }
  return fixture.map((row) => ({ ...row }));
}

export function externalEventDisplayRows(
  central: ExternalEvent[] | undefined,
  fixture: readonly OaExternalEvent[],
) {
  if (central && central.length > 0) {
    return central.map((row) => ({
      id: row.id,
      name: row.name,
      startDate: row.startDate,
      endDate: row.endDate,
      city: row.city,
      country: row.country,
      website: row.website,
      owner: row.owner,
      status: row.status,
      notes: row.notes,
    }));
  }
  return fixture.map((row) => ({ ...row }));
}

export function managedEventDisplayRows(
  central: ManagedEvent[] | undefined,
  fixture: readonly OaManagedEvent[],
) {
  if (central && central.length > 0) {
    return central.map((row) => ({
      id: row.id,
      name: row.name,
      date: row.date,
      venue: row.venue,
      capacity: row.capacity,
      registered: row.registered,
      budgetUsd:
        Number((row as { extensionData?: { budgetUsd?: number } }).extensionData?.budgetUsd) || 0,
      stage: row.status,
      owner: row.owner,
    }));
  }
  return fixture.map((row) => ({ ...row }));
}

export function mailingListDisplayRows(
  centralContacts: { id: string; name: string; segment?: string | null; status?: string }[] | undefined,
  centralCampaigns: Campaign[] | undefined,
  fixture: readonly OaMailingList[],
) {
  if (centralContacts && centralContacts.length > 0) {
    const bySegment = new Map<string, number>();
    for (const contact of centralContacts) {
      const key = contact.segment?.trim() || "General";
      bySegment.set(key, (bySegment.get(key) ?? 0) + 1);
    }
    return [...bySegment.entries()].map(([segment, subscribers], index) => ({
      id: `oa-list-${index}`,
      name: segment,
      segment,
      subscribers,
      growth30d: 0,
      lastCampaign: centralCampaigns?.[0]?.subject ?? "—",
      status: "Active" as const,
    }));
  }
  return fixture.map((row) => ({ ...row }));
}
