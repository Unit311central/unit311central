import type {
  Campaign,
  ExternalEvent,
  MailingContact,
  ManagedEvent,
  MediaAsset,
  MarketingDashboardKpis,
  Newsletter,
} from "@/lib/marketing/types";

export type DbMarketingContact = {
  id: string;
  workspace_id: string;
  name: string;
  email: string;
  organisation: string | null;
  segment: string | null;
  status: string;
  extension_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type DbMarketingNewsletter = {
  id: string;
  workspace_id: string;
  title: string;
  subject: string;
  html_body: string;
  status: string;
  recipient_mode: string;
  recipient_ids: string[];
  manual_emails: string[];
  scheduled_at: string | null;
  sent_at: string | null;
  channels: Record<string, unknown>;
  metrics: Record<string, unknown>;
  content_sources: Record<string, unknown>;
  extension_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type DbMarketingCampaign = {
  id: string;
  workspace_id: string;
  subject: string;
  body: string;
  status: string;
  recipient_mode: string;
  recipient_ids: string[];
  manual_emails: string[];
  scheduled_at: string | null;
  sent_at: string | null;
  extension_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type DbMarketingExternalEvent = {
  id: string;
  workspace_id: string;
  name: string;
  start_date: string;
  end_date: string;
  city: string;
  country: string;
  website: string | null;
  owner_label: string | null;
  owner_id: string | null;
  status: string;
  notes: string | null;
  member_ids: string[];
  calendar_synced: boolean;
  extension_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type DbMarketingManagedEvent = {
  id: string;
  workspace_id: string;
  name: string;
  venue: string;
  city: string | null;
  event_date: string;
  capacity: number;
  registered: number;
  budget_label: string | null;
  stage: string;
  owner_label: string | null;
  status: string;
  extension_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type DbMarketingMediaAsset = {
  id: string;
  workspace_id: string;
  name: string;
  media_type: string;
  caption: string | null;
  source_id: string | null;
  source_label: string | null;
  story_id: string | null;
  journey_story_id: string | null;
  url: string | null;
  extension_data: Record<string, unknown>;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
};

export type DbMarketingStory = {
  id: string;
  workspace_id: string;
  story_kind: string;
  title: string;
  summary: string;
  body: string;
  status: string;
  extension_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type MarketingStoryRecord = {
  id: string;
  storyKind: "portfolio" | "journey" | "generic";
  title: string;
  summary: string;
  body: string;
  status: string;
  extensionData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export function mapContact(row: DbMarketingContact): MailingContact {
  const ext = (row.extension_data as Record<string, unknown> | null) ?? {};
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    organisation: row.organisation,
    segment: row.segment,
    status: (row.status as MailingContact["status"]) ?? "active",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    extensionData: {
      subscribers: typeof ext.subscribers === "number" ? ext.subscribers : undefined,
      growth30d: typeof ext.growth30d === "number" ? ext.growth30d : undefined,
      lastCampaign: typeof ext.lastCampaign === "string" ? ext.lastCampaign : undefined,
      role: typeof ext.role === "string" ? ext.role : undefined,
      city: typeof ext.city === "string" ? ext.city : undefined,
      readOnly: ext.readOnly === true,
    },
  };
}

export function mapNewsletter(row: DbMarketingNewsletter): Newsletter {
  const channels = row.channels as Newsletter["channels"];
  const metrics = row.metrics as Newsletter["metrics"];
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    htmlBody: row.html_body,
    status: row.status as Newsletter["status"],
    scheduledAt: row.scheduled_at,
    sentAt: row.sent_at,
    recipientMode: row.recipient_mode as Newsletter["recipientMode"],
    recipientIds: row.recipient_ids ?? [],
    manualEmails: row.manual_emails ?? [],
    channels,
    metrics,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCampaign(row: DbMarketingCampaign): Campaign {
  return {
    id: row.id,
    subject: row.subject,
    body: row.body,
    status: row.status as Campaign["status"],
    recipientMode: row.recipient_mode as Campaign["recipientMode"],
    recipientIds: row.recipient_ids ?? [],
    manualEmails: row.manual_emails ?? [],
    scheduledAt: row.scheduled_at,
    sentAt: row.sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapExternalEvent(row: DbMarketingExternalEvent): ExternalEvent {
  return {
    id: row.id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    city: row.city,
    country: row.country,
    website: row.website,
    owner: row.owner_label,
    status: row.status,
    notes: row.notes,
    memberIds: row.member_ids ?? [],
    calendarSynced: row.calendar_synced,
  };
}

export function mapManagedEvent(row: DbMarketingManagedEvent): ManagedEvent {
  return {
    id: row.id,
    name: row.name,
    venue: row.venue,
    city: row.city,
    date: row.event_date,
    capacity: row.capacity,
    registered: row.registered,
    budgetLabel: row.budget_label,
    stage: row.stage,
    owner: row.owner_label,
    status: row.status,
  };
}

export function mapMediaAsset(row: DbMarketingMediaAsset): MediaAsset {
  return {
    id: row.id,
    name: row.name,
    mediaType: row.media_type as MediaAsset["mediaType"],
    caption: row.caption,
    sourceId: row.source_id,
    sourceLabel: row.source_label,
    uploadedAt: row.uploaded_at,
    url: row.url,
  };
}

export function mapStory(row: DbMarketingStory): MarketingStoryRecord {
  return {
    id: row.id,
    storyKind: row.story_kind as MarketingStoryRecord["storyKind"],
    title: row.title,
    summary: row.summary,
    body: row.body,
    status: row.status,
    extensionData: row.extension_data ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
