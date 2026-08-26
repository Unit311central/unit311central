import { isAbhiSlug } from "@/lib/abhi-surface";
import { buildAbhiMarketingSeedState } from "@/lib/abhi-marketing-store";
import {
  SAEC_EXTERNAL_EVENTS,
  SAEC_MANAGED_EVENTS,
  SAEC_MARKETING_MAILING_LISTS,
  SAEC_MARKETING_NEWSLETTERS,
} from "@/lib/saec/marketing-seed-data";
import { isSaecSlug } from "@/lib/saec-surface";
import {
  ensureMarketingEventsTables,
  withMarketingEventsTables,
} from "@/lib/marketing/ensure-marketing-tables-runtime";
import { isOnwardAirSlug } from "@/lib/onwardair-surface";
import {
  OA_EXTERNAL_EVENTS,
  OA_MAILING_LISTS,
  OA_MANAGED_EVENTS,
  OA_NEWSLETTERS,
} from "@/lib/onwardair/marketing-events-data";
import { buildJourneyStoriesSeedState } from "@/lib/talanton/journey-stories-store";
import { buildTalantonMarketingStoriesSeedState } from "@/lib/talanton/marketing-stories-store";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  return createSupabaseServerClient();
}

async function workspaceHasMarketingRows(workspaceId: string): Promise<boolean> {
  return withMarketingEventsTables(async () => {
    const supabase = requireSupabase();
    const { count, error } = await supabase
      .from("marketing_contacts")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId);
    if (error) throw new Error(error.message);
    return (count ?? 0) > 0;
  });
}

export async function seedMarketingWorkspaceIfEmpty(workspaceId: string, slug: string) {
  await ensureMarketingEventsTables();
  if (await workspaceHasMarketingRows(workspaceId)) return;

  if (isAbhiSlug(slug)) {
    await seedAbhiWorkspace(workspaceId);
    return;
  }
  if (isTalantonImpactSlug(slug)) {
    await seedTalantonWorkspace(workspaceId);
    return;
  }
  if (isOnwardAirSlug(slug)) {
    await seedOnwardAirWorkspace(workspaceId);
    return;
  }
  if (isSaecSlug(slug)) {
    await seedSaecWorkspace(workspaceId);
  }
}

async function seedAbhiWorkspace(workspaceId: string) {
  const seed = buildAbhiMarketingSeedState();
  const supabase = requireSupabase();

  const contacts = seed.members.map((member) => ({
    id: member.id,
    workspace_id: workspaceId,
    name: member.companyName,
    email: member.contactEmail,
    organisation: member.companyName,
    segment: "Member",
    status: "active",
    extension_data: { abhiMember: true },
  }));

  const newsletters = seed.newsletters.map((row) => ({
    id: row.id,
    workspace_id: workspaceId,
    title: row.title,
    subject: row.subject,
    html_body: row.htmlBody,
    status: row.status,
    recipient_mode: row.recipientMode,
    recipient_ids: row.recipientMemberIds,
    manual_emails: row.manualEmails,
    scheduled_at: row.scheduledAt,
    sent_at: row.sentAt,
    channels: row.channels,
    metrics: row.metrics,
    content_sources: {},
    extension_data: { imageDataUrls: row.imageDataUrls },
  }));

  const campaigns = seed.mailingCampaigns.map((row) => ({
    id: row.id,
    workspace_id: workspaceId,
    subject: row.subject,
    body: row.body,
    status: row.status,
    recipient_mode: row.recipientMode,
    recipient_ids: row.recipientMemberIds,
    manual_emails: row.manualEmails,
    scheduled_at: row.scheduledAt,
    sent_at: row.sentAt,
    extension_data: {},
  }));

  const events = seed.events.map((row) => ({
    id: row.id,
    workspace_id: workspaceId,
    name: row.name,
    start_date: row.startDate,
    end_date: row.endDate,
    city: row.city,
    country: row.country,
    website: row.website,
    owner_label: row.ownerName,
    owner_id: row.ownerId,
    status: "Confirmed",
    notes: row.notes,
    member_ids: row.memberIds,
    calendar_synced: row.calendarSynced,
    extension_data: { year: row.year },
  }));

  await supabase.from("marketing_contacts").upsert(contacts);
  await supabase.from("marketing_newsletters").upsert(newsletters);
  await supabase.from("marketing_campaigns").upsert(campaigns);
  await supabase.from("marketing_external_events").upsert(events);

  await supabase.from("marketing_abhi_extensions").upsert([
    {
      id: `abhi-ext-working-groups-root`,
      workspace_id: workspaceId,
      extension_kind: "working-groups",
      entity_id: null,
      payload: { workingGroups: seed.workingGroups },
    },
    {
      id: `abhi-ext-accelerators-root`,
      workspace_id: workspaceId,
      extension_kind: "accelerators",
      entity_id: null,
      payload: { acceleratorCohorts: seed.acceleratorCohorts },
    },
  ]);
}

async function seedTalantonWorkspace(workspaceId: string) {
  const seed = buildTalantonMarketingStoriesSeedState();
  const journeySeed = buildJourneyStoriesSeedState();
  const supabase = requireSupabase();

  const contacts = seed.contacts.map((row) => ({
    id: row.id,
    workspace_id: workspaceId,
    name: row.name,
    email: row.email,
    organisation: row.organisation,
    segment: row.segment,
    status: "active",
    extension_data: {},
  }));

  const newsletters = seed.newsletters.map((row) => ({
    id: row.id,
    workspace_id: workspaceId,
    title: row.title,
    subject: row.subject,
    html_body: row.htmlBody,
    status: row.status,
    recipient_mode: row.recipientMode,
    recipient_ids: row.recipientContactIds,
    manual_emails: row.manualEmails,
    scheduled_at: row.scheduledAt,
    sent_at: row.sentAt,
    channels: { email: true },
    metrics: {},
    content_sources: {
      portfolioStoryIds: row.selectedStoryIds,
      journeyStoryIds: row.selectedJourneyStoryIds ?? [],
    },
    extension_data: {},
  }));

  const campaigns = seed.campaigns.map((row) => ({
    id: row.id,
    workspace_id: workspaceId,
    subject: row.subject,
    body: row.body,
    status: row.status,
    recipient_mode: row.recipientMode,
    recipient_ids: row.recipientContactIds,
    manual_emails: row.manualEmails,
    scheduled_at: row.scheduledAt,
    sent_at: row.sentAt,
    extension_data: {},
  }));

  const portfolioStories = seed.stories.map((row) => ({
    id: row.id,
    workspace_id: workspaceId,
    story_kind: "portfolio",
    title: row.title,
    summary: row.summary,
    body: row.fullStory,
    status: row.status,
    extension_data: {
      companyId: row.companyId,
      companyName: row.companyName,
      country: row.country,
      impactCategory: row.impactCategory,
      photos: row.photos,
      videos: row.videos,
      attachments: row.attachments,
      submittedBy: row.submittedBy,
      submissionDate: row.submissionDate,
    },
  }));

  const journeyStories = journeySeed.stories.map((row) => ({
    id: row.id,
    workspace_id: workspaceId,
    story_kind: "journey",
    title: row.title,
    summary: row.generated?.executiveSummary ?? row.purpose,
    body: row.generated?.journeyStory ?? row.purpose,
    status: row.status,
    extension_data: row,
  }));

  const media = seed.media.map((row) => ({
    id: row.id,
    workspace_id: workspaceId,
    name: row.name,
    media_type: row.mediaType.toLowerCase(),
    caption: row.caption,
    source_id: row.sourceCompanyId,
    source_label: row.sourceCompanyName,
    story_id: row.storyId,
    journey_story_id: row.journeyStoryId ?? null,
    url: null,
    extension_data: {
      storyTitle: row.storyTitle,
      country: row.country,
      author: row.author,
    },
    uploaded_at: row.uploadDate,
  }));

  await supabase.from("marketing_contacts").upsert(contacts);
  await supabase.from("marketing_newsletters").upsert(newsletters);
  await supabase.from("marketing_campaigns").upsert(campaigns);
  await supabase.from("marketing_stories").upsert([...portfolioStories, ...journeyStories]);
  await supabase.from("marketing_media_assets").upsert(media);
}

async function seedOnwardAirWorkspace(workspaceId: string) {
  const supabase = requireSupabase();

  const newsletters = OA_NEWSLETTERS.map((row) => ({
    id: row.id,
    workspace_id: workspaceId,
    title: row.title,
    subject: row.subject,
    html_body: row.preview,
    status: row.status,
    recipient_mode: "all",
    recipient_ids: [],
    manual_emails: [],
    scheduled_at: row.scheduledAt,
    sent_at: row.sentAt,
    channels: { email: true },
    metrics: {
      openRate: row.openRate,
      clickRate: row.clickRate,
    },
    content_sources: {},
    extension_data: { audience: row.audience, readOnly: true },
  }));

  const contacts = OA_MAILING_LISTS.map((row) => ({
    id: row.id,
    workspace_id: workspaceId,
    name: row.name,
    email: `${row.id}@onwardair.fixture`,
    organisation: row.segment,
    segment: row.segment,
    status: row.status === "Active" ? "active" : "paused",
    extension_data: {
      subscribers: row.subscribers,
      growth30d: row.growth30d,
      lastCampaign: row.lastCampaign,
      readOnly: true,
    },
  }));

  const externalEvents = OA_EXTERNAL_EVENTS.map((row) => ({
    id: row.id,
    workspace_id: workspaceId,
    name: row.name,
    start_date: row.startDate,
    end_date: row.endDate,
    city: row.city,
    country: row.country,
    website: row.website,
    owner_label: row.owner,
    owner_id: null,
    status: row.status,
    notes: row.notes,
    member_ids: [],
    calendar_synced: false,
    extension_data: { readOnly: true },
  }));

  const managedEvents = OA_MANAGED_EVENTS.map((row) => ({
    id: row.id,
    workspace_id: workspaceId,
    name: row.name,
    venue: row.venue,
    city: null,
    event_date: row.date,
    capacity: row.capacity,
    registered: row.registered,
    budget_label: `USD ${row.budgetUsd.toLocaleString()}`,
    stage: row.stage,
    owner_label: row.owner,
    status: "Planning",
    extension_data: { readOnly: true, budgetUsd: row.budgetUsd },
  }));

  await supabase.from("marketing_newsletters").upsert(newsletters);
  await supabase.from("marketing_contacts").upsert(contacts);
  await supabase.from("marketing_external_events").upsert(externalEvents);
  await supabase.from("marketing_managed_events").upsert(managedEvents);
}

async function seedSaecWorkspace(workspaceId: string) {
  const supabase = requireSupabase();

  const newsletters = SAEC_MARKETING_NEWSLETTERS.map((row) => ({
    id: row.id,
    workspace_id: workspaceId,
    title: row.title,
    subject: row.subject,
    html_body: row.preview,
    status: row.status,
    recipient_mode: "all",
    recipient_ids: [],
    manual_emails: [],
    scheduled_at: row.scheduledAt,
    sent_at: row.sentAt,
    channels: { email: true },
    metrics: {
      openRate: row.openRate,
      clickRate: row.clickRate,
    },
    content_sources: {},
    extension_data: { audience: row.audience, readOnly: true },
  }));

  const contacts = SAEC_MARKETING_MAILING_LISTS.map((row) => ({
    id: row.id,
    workspace_id: workspaceId,
    name: row.name,
    email: `${row.id}@omnitransit.fixture`,
    organisation: row.segment,
    segment: row.segment,
    status: row.status === "Active" ? "active" : "paused",
    extension_data: {
      subscribers: row.subscribers,
      growth30d: row.growth30d,
      lastCampaign: row.lastCampaign,
      readOnly: true,
    },
  }));

  const externalEvents = SAEC_EXTERNAL_EVENTS.map((row) => ({
    id: row.id,
    workspace_id: workspaceId,
    name: row.name,
    start_date: row.startDate,
    end_date: row.endDate,
    city: row.city,
    country: row.country,
    website: row.website,
    owner_label: row.owner,
    owner_id: null,
    status: row.status,
    notes: row.notes,
    member_ids: [],
    calendar_synced: false,
    extension_data: { readOnly: true },
  }));

  const managedEvents = SAEC_MANAGED_EVENTS.map((row) => ({
    id: row.id,
    workspace_id: workspaceId,
    name: row.name,
    venue: row.venue,
    city: "Johannesburg",
    event_date: row.date,
    capacity: row.capacity,
    registered: row.registered,
    budget_label: `ZAR ${row.budgetZar.toLocaleString("en-ZA")}`,
    stage: row.status,
    owner_label: "Commercial team",
    status: "Planning",
    extension_data: { readOnly: true, budgetZar: row.budgetZar },
  }));

  await supabase.from("marketing_newsletters").upsert(newsletters);
  await supabase.from("marketing_contacts").upsert(contacts);
  await supabase.from("marketing_external_events").upsert(externalEvents);
  await supabase.from("marketing_managed_events").upsert(managedEvents);
}
