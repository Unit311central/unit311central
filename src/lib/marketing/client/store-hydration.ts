import type { MarketingBundleResponse } from "@/lib/marketing/client/marketing-api";

/**
 * Maps central marketing API bundle into legacy ABHI store shape.
 * Working groups / accelerators remain ABHI extension payloads.
 */
export function mapBundleToAbhiMarketingState(bundle: MarketingBundleResponse) {
  return {
    members: bundle.contacts.map((row) => ({
      id: String(row.id),
      companyName: String(row.organisation ?? row.name ?? ""),
      contactEmail: String(row.email ?? ""),
    })),
    newsletters: bundle.newsletters.map((row) => ({
      id: String(row.id),
      title: String(row.title ?? ""),
      subject: String(row.subject ?? ""),
      htmlBody: String(row.htmlBody ?? ""),
      status: row.status as "draft" | "scheduled" | "sent",
      scheduledAt: (row.scheduledAt as string | null) ?? null,
      sentAt: (row.sentAt as string | null) ?? null,
      recipientMode: row.recipientMode as "all" | "selected" | "manual",
      recipientMemberIds: (row.recipientIds as string[]) ?? [],
      manualEmails: (row.manualEmails as string[]) ?? [],
      channels: (row.channels as { email: boolean; linkedin: boolean; twitter: boolean }) ?? {
        email: true,
        linkedin: false,
        twitter: false,
      },
      imageDataUrls:
        ((row as { extensionData?: { imageDataUrls?: string[] } }).extensionData
          ?.imageDataUrls as string[]) ?? [],
      metrics: (row.metrics as {
        openRate: number;
        clickRate: number;
        responseRate: number;
        clientsAcquired: number;
      }) ?? {
        openRate: 0,
        clickRate: 0,
        responseRate: 0,
        clientsAcquired: 0,
      },
      createdAt: String(row.createdAt ?? new Date().toISOString()),
      updatedAt: String(row.updatedAt ?? new Date().toISOString()),
    })),
    mailingCampaigns: bundle.campaigns.map((row) => {
      const ext = row.extensionData ?? {};
      return {
        id: String(row.id),
        name: String(ext.name ?? row.subject ?? ""),
        purpose: String(ext.purpose ?? ""),
        listName: String(ext.listName ?? ""),
        lastSent: (ext.lastSent as string | null) ?? (row.sentAt as string | null) ?? null,
        subject: String(row.subject ?? ""),
        body: String(row.body ?? ""),
        status: row.status as "draft" | "scheduled" | "sent",
        recipientMode: row.recipientMode as "all" | "selected" | "manual",
        recipientMemberIds: (row.recipientIds as string[]) ?? [],
        manualEmails: (row.manualEmails as string[]) ?? [],
        scheduledAt: (row.scheduledAt as string | null) ?? null,
        sentAt: (row.sentAt as string | null) ?? null,
        createdAt: String(row.createdAt ?? new Date().toISOString()),
      };
    }),
    events: bundle.externalEvents.map((row) => ({
      id: String(row.id),
      name: String(row.name ?? ""),
      startDate: String(row.startDate ?? ""),
      endDate: String(row.endDate ?? ""),
      year: Number((row as { extensionData?: { year?: number } }).extensionData?.year ?? 2026),
      city: String(row.city ?? ""),
      country: String(row.country ?? ""),
      website: String(row.website ?? ""),
      memberIds: (row.memberIds as string[]) ?? [],
      notes: String(row.notes ?? ""),
      ownerId: String((row as { ownerId?: string }).ownerId ?? ""),
      ownerName: String(row.owner ?? ""),
      calendarSynced: Boolean(row.calendarSynced),
      createdAt: String((row as { createdAt?: string }).createdAt ?? new Date().toISOString()),
    })),
    workingGroups: bundle.abhiExtensions.workingGroups as never[],
    acceleratorCohorts: bundle.abhiExtensions.acceleratorCohorts as never[],
  };
}

export function mapBundleToTalantonMarketingStoriesState(bundle: MarketingBundleResponse) {
  return {
    stories: bundle.portfolioStories.map((row) => {
      const ext = (row.extensionData as Record<string, unknown>) ?? {};
      return {
        id: String(row.id),
        title: String(row.title ?? ""),
        summary: String(row.summary ?? ""),
        fullStory: String(row.body ?? ""),
        companyId: String(ext.companyId ?? ""),
        companyName: String(ext.companyName ?? ""),
        country: String(ext.country ?? ""),
        submissionDate: String(ext.submissionDate ?? ""),
        status: row.status as never,
        impactCategory: ext.impactCategory as never,
        photos: (ext.photos as never[]) ?? [],
        videos: (ext.videos as never[]) ?? [],
        attachments: (ext.attachments as never[]) ?? [],
        submittedBy: String(ext.submittedBy ?? ""),
        updatedAt: String(row.updatedAt ?? new Date().toISOString()),
      };
    }),
    media: bundle.media.map((row) => ({
      id: String(row.id),
      name: String(row.name ?? ""),
      mediaType: String(row.mediaType ?? "Image").replace(/^./, (c) => c.toUpperCase()) as never,
      sourceCompanyId: String(row.sourceId ?? ""),
      sourceCompanyName: String(row.sourceLabel ?? ""),
      uploadDate: String(row.uploadedAt ?? new Date().toISOString()),
      caption: String(row.caption ?? ""),
      storyId: (row as { storyId?: string | null }).storyId ?? null,
      storyTitle:
        ((row as { extensionData?: { storyTitle?: string } }).extensionData?.storyTitle as
          | string
          | null) ?? null,
      journeyStoryId: (row as { journeyStoryId?: string | null }).journeyStoryId ?? null,
      journeyTitle: null,
      country: ((row as { extensionData?: { country?: string } }).extensionData?.country as
        | string
        | null) ?? null,
      author: ((row as { extensionData?: { author?: string } }).extensionData?.author as
        | string
        | null) ?? null,
    })),
    newsletters: bundle.newsletters.map((row) => {
      const sources = (row as { contentSources?: Record<string, string[]> }).contentSources ?? {};
      return {
        id: String(row.id),
        title: String(row.title ?? ""),
        subject: String(row.subject ?? ""),
        htmlBody: String(row.htmlBody ?? ""),
        status: row.status as "draft" | "scheduled" | "sent",
        selectedStoryIds: sources.portfolioStoryIds ?? [],
        selectedJourneyStoryIds: sources.journeyStoryIds ?? [],
        recipientMode: row.recipientMode as "all" | "selected" | "manual",
        recipientContactIds: (row.recipientIds as string[]) ?? [],
        manualEmails: (row.manualEmails as string[]) ?? [],
        scheduledAt: (row.scheduledAt as string | null) ?? null,
        sentAt: (row.sentAt as string | null) ?? null,
        createdAt: String(row.createdAt ?? new Date().toISOString()),
        updatedAt: String(row.updatedAt ?? new Date().toISOString()),
      };
    }),
    contacts: bundle.contacts.map((row) => ({
      id: String(row.id),
      name: String(row.name ?? ""),
      organisation: String(row.organisation ?? ""),
      email: String(row.email ?? ""),
      segment: (row.segment as never) ?? "Partner",
    })),
    campaigns: bundle.campaigns.map((row) => ({
      id: String(row.id),
      subject: String(row.subject ?? ""),
      body: String(row.body ?? ""),
      status: row.status as "draft" | "scheduled" | "sent",
      recipientMode: row.recipientMode as "all" | "selected" | "manual",
      recipientContactIds: (row.recipientIds as string[]) ?? [],
      manualEmails: (row.manualEmails as string[]) ?? [],
      scheduledAt: (row.scheduledAt as string | null) ?? null,
      sentAt: (row.sentAt as string | null) ?? null,
      createdAt: String(row.createdAt ?? new Date().toISOString()),
    })),
  };
}

export function mapBundleToJourneyStoriesState(bundle: MarketingBundleResponse) {
  return {
    stories: bundle.journeyStories.map((row) => {
      const ext = (row.extensionData as Record<string, unknown>) ?? row;
      return ext as never;
    }),
  };
}
