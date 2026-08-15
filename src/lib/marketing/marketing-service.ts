import { randomUUID } from "node:crypto";

import {
  mapCampaign,
  mapContact,
  mapExternalEvent,
  mapManagedEvent,
  mapMediaAsset,
  mapNewsletter,
  mapStory,
  type DbMarketingCampaign,
  type DbMarketingContact,
  type DbMarketingExternalEvent,
  type DbMarketingManagedEvent,
  type DbMarketingMediaAsset,
  type DbMarketingNewsletter,
  type DbMarketingStory,
  type MarketingStoryRecord,
} from "@/lib/marketing/mappers";
import {
  resolveMarketingWorkspaceId,
  resolveMarketingWorkspaceSlug,
  type MarketingWorkspaceScope,
} from "@/lib/marketing/marketing-workspace";
import type {
  Campaign,
  ExternalEvent,
  MailingContact,
  ManagedEvent,
  MarketingDashboardKpis,
  MediaAsset,
  Newsletter,
} from "@/lib/marketing/types";
import {
  ensureMarketingEventsTables,
  withMarketingEventsTables,
} from "@/lib/marketing/ensure-marketing-tables-runtime";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

function requireMarketingSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.");
  }
  return createSupabaseServerClient();
}

function nowIso() {
  return new Date().toISOString();
}

export async function listMarketingContacts(
  scope?: MarketingWorkspaceScope,
): Promise<MailingContact[]> {
  const workspaceId = await resolveMarketingWorkspaceId(scope);
  return withMarketingEventsTables(async () => {
    const supabase = requireMarketingSupabase();
    const { data, error } = await supabase
      .from("marketing_contacts")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return ((data ?? []) as DbMarketingContact[]).map(mapContact);
  });
}

export async function upsertMarketingContact(
  input: Omit<MailingContact, "createdAt" | "updatedAt"> & { id?: string },
  scope?: MarketingWorkspaceScope,
): Promise<MailingContact> {
  const workspaceId = await resolveMarketingWorkspaceId(scope);
  const id = input.id?.trim() || `mkt-contact-${randomUUID()}`;
  const payload = {
    id,
    workspace_id: workspaceId,
    name: input.name.trim(),
    email: input.email.trim(),
    organisation: input.organisation ?? null,
    segment: input.segment ?? null,
    status: input.status ?? "active",
    extension_data: {},
    updated_at: nowIso(),
  };
  await ensureMarketingEventsTables();
  return withMarketingEventsTables(async () => {
    const supabase = requireMarketingSupabase();
    const { data, error } = await supabase
      .from("marketing_contacts")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapContact(data as DbMarketingContact);
  });
}

export async function deleteMarketingContact(id: string, scope?: MarketingWorkspaceScope) {
  const workspaceId = await resolveMarketingWorkspaceId(scope);
  return withMarketingEventsTables(async () => {
    const supabase = requireMarketingSupabase();
    const { error } = await supabase
      .from("marketing_contacts")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("id", id);
    if (error) throw new Error(error.message);
  });
}

export async function listMarketingNewsletters(
  scope?: MarketingWorkspaceScope,
): Promise<Newsletter[]> {
  const workspaceId = await resolveMarketingWorkspaceId(scope);
  return withMarketingEventsTables(async () => {
    const supabase = requireMarketingSupabase();
    const { data, error } = await supabase
      .from("marketing_newsletters")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as DbMarketingNewsletter[]).map(mapNewsletter);
  });
}

export async function upsertMarketingNewsletter(
  input: Partial<Newsletter> & Pick<Newsletter, "title">,
  scope?: MarketingWorkspaceScope,
  extras?: {
    contentSources?: Record<string, unknown>;
    extensionData?: Record<string, unknown>;
  },
): Promise<Newsletter> {
  const workspaceId = await resolveMarketingWorkspaceId(scope);
  const id = input.id?.trim() || `mkt-nl-${randomUUID()}`;
  const payload = {
    id,
    workspace_id: workspaceId,
    title: input.title.trim(),
    subject: input.subject?.trim() ?? "",
    html_body: input.htmlBody ?? "",
    status: input.status ?? "draft",
    recipient_mode: input.recipientMode ?? "all",
    recipient_ids: input.recipientIds ?? [],
    manual_emails: input.manualEmails ?? [],
    scheduled_at: input.scheduledAt ?? null,
    sent_at: input.sentAt ?? null,
    channels: input.channels ?? { email: true },
    metrics: input.metrics ?? {},
    content_sources: extras?.contentSources ?? {},
    extension_data: extras?.extensionData ?? {},
    updated_at: nowIso(),
  };
  await ensureMarketingEventsTables();
  return withMarketingEventsTables(async () => {
    const supabase = requireMarketingSupabase();
    const { data, error } = await supabase
      .from("marketing_newsletters")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapNewsletter(data as DbMarketingNewsletter);
  });
}

export async function deleteMarketingNewsletter(id: string, scope?: MarketingWorkspaceScope) {
  const workspaceId = await resolveMarketingWorkspaceId(scope);
  return withMarketingEventsTables(async () => {
    const supabase = requireMarketingSupabase();
    const { error } = await supabase
      .from("marketing_newsletters")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("id", id);
    if (error) throw new Error(error.message);
  });
}

export async function listMarketingCampaigns(
  scope?: MarketingWorkspaceScope,
): Promise<Campaign[]> {
  const workspaceId = await resolveMarketingWorkspaceId(scope);
  return withMarketingEventsTables(async () => {
    const supabase = requireMarketingSupabase();
    const { data, error } = await supabase
      .from("marketing_campaigns")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as DbMarketingCampaign[]).map(mapCampaign);
  });
}

export async function upsertMarketingCampaign(
  input: Partial<Campaign> & Pick<Campaign, "subject">,
  scope?: MarketingWorkspaceScope,
): Promise<Campaign> {
  const workspaceId = await resolveMarketingWorkspaceId(scope);
  const id = input.id?.trim() || `mkt-camp-${randomUUID()}`;
  const payload = {
    id,
    workspace_id: workspaceId,
    subject: input.subject.trim(),
    body: input.body ?? "",
    status: input.status ?? "draft",
    recipient_mode: input.recipientMode ?? "all",
    recipient_ids: input.recipientIds ?? [],
    manual_emails: input.manualEmails ?? [],
    scheduled_at: input.scheduledAt ?? null,
    sent_at: input.sentAt ?? null,
    extension_data: {},
    updated_at: nowIso(),
  };
  await ensureMarketingEventsTables();
  return withMarketingEventsTables(async () => {
    const supabase = requireMarketingSupabase();
    const { data, error } = await supabase
      .from("marketing_campaigns")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapCampaign(data as DbMarketingCampaign);
  });
}

export async function deleteMarketingCampaign(id: string, scope?: MarketingWorkspaceScope) {
  const workspaceId = await resolveMarketingWorkspaceId(scope);
  return withMarketingEventsTables(async () => {
    const supabase = requireMarketingSupabase();
    const { error } = await supabase
      .from("marketing_campaigns")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("id", id);
    if (error) throw new Error(error.message);
  });
}

export async function listMarketingExternalEvents(
  scope?: MarketingWorkspaceScope,
): Promise<ExternalEvent[]> {
  const workspaceId = await resolveMarketingWorkspaceId(scope);
  return withMarketingEventsTables(async () => {
    const supabase = requireMarketingSupabase();
    const { data, error } = await supabase
      .from("marketing_external_events")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("start_date", { ascending: true });
    if (error) throw new Error(error.message);
    return ((data ?? []) as DbMarketingExternalEvent[]).map(mapExternalEvent);
  });
}

export async function upsertMarketingExternalEvent(
  input: Partial<ExternalEvent> & Pick<ExternalEvent, "name" | "startDate" | "endDate">,
  scope?: MarketingWorkspaceScope,
  extensionData?: Record<string, unknown>,
): Promise<ExternalEvent> {
  const workspaceId = await resolveMarketingWorkspaceId(scope);
  const id = input.id?.trim() || `mkt-ext-${randomUUID()}`;
  const payload = {
    id,
    workspace_id: workspaceId,
    name: input.name.trim(),
    start_date: input.startDate,
    end_date: input.endDate,
    city: input.city ?? "",
    country: input.country ?? "",
    website: input.website ?? null,
    owner_label: input.owner ?? null,
    owner_id: null,
    status: input.status ?? "Planning",
    notes: input.notes ?? null,
    member_ids: input.memberIds ?? [],
    calendar_synced: input.calendarSynced ?? false,
    extension_data: extensionData ?? {},
    updated_at: nowIso(),
  };
  await ensureMarketingEventsTables();
  return withMarketingEventsTables(async () => {
    const supabase = requireMarketingSupabase();
    const { data, error } = await supabase
      .from("marketing_external_events")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapExternalEvent(data as DbMarketingExternalEvent);
  });
}

export async function deleteMarketingExternalEvent(id: string, scope?: MarketingWorkspaceScope) {
  const workspaceId = await resolveMarketingWorkspaceId(scope);
  return withMarketingEventsTables(async () => {
    const supabase = requireMarketingSupabase();
    const { error } = await supabase
      .from("marketing_external_events")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("id", id);
    if (error) throw new Error(error.message);
  });
}

export async function listMarketingManagedEvents(
  scope?: MarketingWorkspaceScope,
): Promise<ManagedEvent[]> {
  const workspaceId = await resolveMarketingWorkspaceId(scope);
  return withMarketingEventsTables(async () => {
    const supabase = requireMarketingSupabase();
    const { data, error } = await supabase
      .from("marketing_managed_events")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("event_date", { ascending: true });
    if (error) throw new Error(error.message);
    return ((data ?? []) as DbMarketingManagedEvent[]).map(mapManagedEvent);
  });
}

export async function upsertMarketingManagedEvent(
  input: Partial<ManagedEvent> & Pick<ManagedEvent, "name" | "date">,
  scope?: MarketingWorkspaceScope,
  extensionData?: Record<string, unknown>,
): Promise<ManagedEvent> {
  const workspaceId = await resolveMarketingWorkspaceId(scope);
  const id = input.id?.trim() || `mkt-mgmt-${randomUUID()}`;
  const payload = {
    id,
    workspace_id: workspaceId,
    name: input.name.trim(),
    venue: input.venue ?? "",
    city: input.city ?? null,
    event_date: input.date,
    capacity: input.capacity ?? 0,
    registered: input.registered ?? 0,
    budget_label: input.budgetLabel ?? null,
    stage: input.stage ?? "Concept",
    owner_label: input.owner ?? null,
    status: input.status ?? "Planning",
    extension_data: extensionData ?? {},
    updated_at: nowIso(),
  };
  await ensureMarketingEventsTables();
  return withMarketingEventsTables(async () => {
    const supabase = requireMarketingSupabase();
    const { data, error } = await supabase
      .from("marketing_managed_events")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapManagedEvent(data as DbMarketingManagedEvent);
  });
}

export async function deleteMarketingManagedEvent(id: string, scope?: MarketingWorkspaceScope) {
  const workspaceId = await resolveMarketingWorkspaceId(scope);
  return withMarketingEventsTables(async () => {
    const supabase = requireMarketingSupabase();
    const { error } = await supabase
      .from("marketing_managed_events")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("id", id);
    if (error) throw new Error(error.message);
  });
}

export async function listMarketingMediaAssets(
  scope?: MarketingWorkspaceScope,
): Promise<MediaAsset[]> {
  const workspaceId = await resolveMarketingWorkspaceId(scope);
  return withMarketingEventsTables(async () => {
    const supabase = requireMarketingSupabase();
    const { data, error } = await supabase
      .from("marketing_media_assets")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("uploaded_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as DbMarketingMediaAsset[]).map(mapMediaAsset);
  });
}

export async function upsertMarketingMediaAsset(
  input: Partial<MediaAsset> & Pick<MediaAsset, "name">,
  scope?: MarketingWorkspaceScope,
  extensionData?: Record<string, unknown>,
): Promise<MediaAsset> {
  const workspaceId = await resolveMarketingWorkspaceId(scope);
  const id = input.id?.trim() || `mkt-media-${randomUUID()}`;
  const payload = {
    id,
    workspace_id: workspaceId,
    name: input.name.trim(),
    media_type: input.mediaType ?? "image",
    caption: input.caption ?? null,
    source_id: input.sourceId ?? null,
    source_label: input.sourceLabel ?? null,
    story_id: (extensionData?.storyId as string | null) ?? null,
    journey_story_id: (extensionData?.journeyStoryId as string | null) ?? null,
    url: input.url ?? null,
    extension_data: extensionData ?? {},
    uploaded_at: input.uploadedAt ?? nowIso(),
    updated_at: nowIso(),
  };
  await ensureMarketingEventsTables();
  return withMarketingEventsTables(async () => {
    const supabase = requireMarketingSupabase();
    const { data, error } = await supabase
      .from("marketing_media_assets")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapMediaAsset(data as DbMarketingMediaAsset);
  });
}

export async function deleteMarketingMediaAsset(id: string, scope?: MarketingWorkspaceScope) {
  const workspaceId = await resolveMarketingWorkspaceId(scope);
  return withMarketingEventsTables(async () => {
    const supabase = requireMarketingSupabase();
    const { error } = await supabase
      .from("marketing_media_assets")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("id", id);
    if (error) throw new Error(error.message);
  });
}

export async function listMarketingStories(
  scope?: MarketingWorkspaceScope,
  storyKind?: MarketingStoryRecord["storyKind"],
): Promise<MarketingStoryRecord[]> {
  const workspaceId = await resolveMarketingWorkspaceId(scope);
  return withMarketingEventsTables(async () => {
    const supabase = requireMarketingSupabase();
    let query = supabase.from("marketing_stories").select("*").eq("workspace_id", workspaceId);
    if (storyKind) query = query.eq("story_kind", storyKind);
    const { data, error } = await query.order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as DbMarketingStory[]).map(mapStory);
  });
}

export async function upsertMarketingStory(
  input: Partial<MarketingStoryRecord> &
    Pick<MarketingStoryRecord, "title" | "storyKind">,
  scope?: MarketingWorkspaceScope,
): Promise<MarketingStoryRecord> {
  const workspaceId = await resolveMarketingWorkspaceId(scope);
  const id = input.id?.trim() || `mkt-story-${randomUUID()}`;
  const payload = {
    id,
    workspace_id: workspaceId,
    story_kind: input.storyKind,
    title: input.title.trim(),
    summary: input.summary ?? "",
    body: input.body ?? "",
    status: input.status ?? "draft",
    extension_data: input.extensionData ?? {},
    updated_at: nowIso(),
  };
  await ensureMarketingEventsTables();
  return withMarketingEventsTables(async () => {
    const supabase = requireMarketingSupabase();
    const { data, error } = await supabase
      .from("marketing_stories")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapStory(data as DbMarketingStory);
  });
}

export async function deleteMarketingStory(id: string, scope?: MarketingWorkspaceScope) {
  const workspaceId = await resolveMarketingWorkspaceId(scope);
  return withMarketingEventsTables(async () => {
    const supabase = requireMarketingSupabase();
    const { error } = await supabase
      .from("marketing_stories")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("id", id);
    if (error) throw new Error(error.message);
  });
}

export async function upsertMarketingAbhiExtension(
  extensionKind: string,
  payload: Record<string, unknown>,
  scope?: MarketingWorkspaceScope,
  entityId?: string | null,
) {
  const workspaceId = await resolveMarketingWorkspaceId(scope);
  const id = `abhi-ext-${extensionKind}-${entityId ?? "root"}`;
  await ensureMarketingEventsTables();
  return withMarketingEventsTables(async () => {
    const supabase = requireMarketingSupabase();
    const { error } = await supabase.from("marketing_abhi_extensions").upsert(
      {
        id,
        workspace_id: workspaceId,
        extension_kind: extensionKind,
        entity_id: entityId ?? null,
        payload,
        updated_at: nowIso(),
      },
      { onConflict: "id" },
    );
    if (error) throw new Error(error.message);
  });
}

export async function getMarketingAbhiExtension<T extends Record<string, unknown>>(
  extensionKind: string,
  scope?: MarketingWorkspaceScope,
  entityId?: string | null,
): Promise<T | null> {
  const workspaceId = await resolveMarketingWorkspaceId(scope);
  return withMarketingEventsTables(async () => {
    const supabase = requireMarketingSupabase();
    let query = supabase
      .from("marketing_abhi_extensions")
      .select("payload")
      .eq("workspace_id", workspaceId)
      .eq("extension_kind", extensionKind);
    if (entityId) query = query.eq("entity_id", entityId);
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(error.message);
    return (data?.payload as T | undefined) ?? null;
  });
}

export async function computeMarketingDashboardKpis(
  scope?: MarketingWorkspaceScope,
): Promise<MarketingDashboardKpis> {
  const [newsletters, contacts, externalEvents, managedEvents] = await Promise.all([
    listMarketingNewsletters(scope),
    listMarketingContacts(scope),
    listMarketingExternalEvents(scope),
    listMarketingManagedEvents(scope),
  ]);

  const sent = newsletters.filter((row) => row.status === "sent");
  const openRates = sent
    .map((row) => row.metrics?.openRate)
    .filter((value): value is number => typeof value === "number");
  const newsletterOpenRate =
    openRates.length > 0
      ? openRates.reduce((sum, value) => sum + value, 0) / openRates.length
      : null;

  const managedEventRegistered = managedEvents.reduce((sum, row) => sum + row.registered, 0);
  const managedEventCapacity = managedEvents.reduce((sum, row) => sum + row.capacity, 0);

  return {
    newsletterOpenRate,
    sentNewsletterCount: sent.length,
    mailingSubscribers: contacts.filter((row) => row.status !== "unsubscribed").length,
    mailingGrowth30d: 0,
    externalEventsConfirmed: externalEvents.filter((row) =>
      /confirmed/i.test(row.status),
    ).length,
    externalEventsTotal: externalEvents.length,
    managedEventRegistered,
    managedEventCapacity,
    managedEventCount: managedEvents.length,
  };
}

export async function ensureMarketingWorkspaceSeeded(scope?: MarketingWorkspaceScope) {
  const workspaceId = await resolveMarketingWorkspaceId(scope);
  const slug = await resolveMarketingWorkspaceSlug(scope);
  const { seedMarketingWorkspaceIfEmpty } = await import("@/lib/marketing/marketing-seed-service");
  await seedMarketingWorkspaceIfEmpty(workspaceId, slug);
}
