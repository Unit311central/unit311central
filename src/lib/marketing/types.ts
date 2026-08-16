/**
 * Central Marketing & Events domain types (Phase 0).
 * Data-layer implementations remain workspace-specific until Phase 2+.
 */

export type MarketingRecordStatus = "draft" | "scheduled" | "sent" | "archived";

export type MarketingRecipientMode = "all" | "selected" | "manual";

export type SocialPlatformId = "linkedin" | "instagram" | "twitter" | "x" | "other";

export type SocialPostMode = "create" | "schedule" | "published";

/** Digital newsletter issue. */
export type Newsletter = {
  id: string;
  title: string;
  subject: string;
  htmlBody: string;
  status: MarketingRecordStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  recipientMode: MarketingRecipientMode;
  recipientIds: string[];
  manualEmails: string[];
  channels?: {
    email: boolean;
    linkedin: boolean;
    twitter: boolean;
  };
  metrics?: {
    openRate: number | null;
    clickRate: number | null;
    responseRate?: number | null;
  };
  createdAt: string;
  updatedAt: string;
};

/** Outbound campaign (one-shot or recurring). */
export type Campaign = {
  id: string;
  subject: string;
  body: string;
  status: MarketingRecordStatus;
  recipientMode: MarketingRecipientMode;
  recipientIds: string[];
  manualEmails: string[];
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  extensionData?: Record<string, unknown>;
};

/** Mailing list contact / subscriber. */
export type MailingContact = {
  id: string;
  name: string;
  email: string;
  organisation?: string | null;
  segment?: string | null;
  status?: "active" | "paused" | "unsubscribed";
  createdAt?: string;
  updatedAt?: string;
};

/** Trade show / external event the organisation attends. */
export type ExternalEvent = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  city: string;
  country: string;
  website?: string | null;
  owner?: string | null;
  status: string;
  notes?: string | null;
  memberIds?: string[];
  calendarSynced?: boolean;
};

/** Owned / managed event (conference, webinar, member day). */
export type ManagedEvent = {
  id: string;
  name: string;
  venue: string;
  city?: string | null;
  date: string;
  capacity: number;
  registered: number;
  budgetLabel?: string | null;
  stage: string;
  owner?: string | null;
  status?: string;
};

/** Social post draft or published item. */
export type SocialPost = {
  id: string;
  platform: SocialPlatformId;
  body: string;
  mode: SocialPostMode;
  scheduledAt: string | null;
  publishedAt: string | null;
  imageDataUrls?: string[];
  metrics?: {
    impressions?: number | null;
    reactions?: number | null;
    comments?: number | null;
    reposts?: number | null;
  };
};

/** Shared story/content record — workspace extensions store specialist fields in extensionData. */
export type MarketingStoryKind = "portfolio" | "journey" | "generic";

export type MarketingStoryContent = {
  id: string;
  storyKind: MarketingStoryKind;
  title: string;
  summary: string;
  body: string;
  status: string;
  extensionData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type NewsletterContentSources = {
  portfolioStoryIds?: string[];
  journeyStoryIds?: string[];
};

/** Workspace extension hook for newsletter content pickers. */
export type NewsletterWorkspaceExtension = {
  contentSources?: NewsletterContentSources;
  channels?: Newsletter["channels"];
  imageDataUrls?: string[];
  extensionData?: Record<string, unknown>;
};

/** Workspace KPI provider for the central marketing dashboard shell. */
export type MarketingDashboardProvider = {
  kpis: MarketingDashboardKpis;
  recentNewsletterTitle?: string | null;
  upcomingExternalEvents?: ExternalEvent[];
  liveManagedEvents?: ManagedEvent[];
};

export type MarketingDashboardKpis = {
  newsletterOpenRate: number | null;
  sentNewsletterCount: number;
  mailingSubscribers: number;
  mailingGrowth30d: number;
  externalEventsConfirmed: number;
  externalEventsTotal: number;
  managedEventRegistered: number;
  managedEventCapacity: number;
  managedEventCount: number;
};

/** Shared media asset reference (library / story attachment). */
export type MediaAsset = {
  id: string;
  name: string;
  mediaType: "image" | "video" | "document" | "other";
  caption?: string | null;
  sourceId?: string | null;
  sourceLabel?: string | null;
  uploadedAt?: string | null;
  url?: string | null;
};
