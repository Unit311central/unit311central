import "server-only";

import {
  discoveryResponsesAreBlank,
  normalizeDiscoveryResponses,
} from "@/lib/saec-discovery/config";
import type { SaecDiscoveryDraftRecord, SaecDiscoveryState } from "@/lib/saec-discovery/types";
import { SAEC_SLUG } from "@/lib/saec-surface";
import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/server";

type DbDraftRow = {
  id: string;
  workspace_id: string;
  platform_user_id: string;
  owner_email: string | null;
  responses: SaecDiscoveryState | null;
  last_saved_at: string;
  created_at: string;
  updated_at: string;
  workspaces: { slug: string; name: string } | { slug: string; name: string }[] | null;
};

const DRAFT_SELECT =
  "id, workspace_id, platform_user_id, owner_email, responses, last_saved_at, created_at, updated_at, workspaces(slug, name)";

function randomId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function requireServiceSupabase() {
  if (!isSupabaseServiceRoleConfigured()) {
    throw new Error(
      "SAEC Discovery draft persistence requires SUPABASE_SERVICE_ROLE_KEY (RLS has no open policies).",
    );
  }
  return createSupabaseServiceRoleClient();
}

function mapDraftRow(row: DbDraftRow): SaecDiscoveryDraftRecord {
  const workspace = Array.isArray(row.workspaces) ? row.workspaces[0] : row.workspaces;
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    workspaceSlug: workspace?.slug ?? SAEC_SLUG,
    workspaceName: workspace?.name ?? "SAEC",
    platformUserId: row.platform_user_id,
    ownerEmail: row.owner_email,
    status: "draft",
    responses: normalizeDiscoveryResponses(row.responses),
    lastSavedAt: row.last_saved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function resolveSaecWorkspaceId(supabase: ReturnType<typeof createSupabaseServiceRoleClient>) {
  const { data, error } = await supabase
    .from("workspaces")
    .select("id, slug, name")
    .eq("slug", SAEC_SLUG)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.id) throw new Error("SAEC workspace is not provisioned.");
  return data;
}

export async function getSaecDiscoveryDraftForUser(input: {
  platformUserId: string;
}): Promise<SaecDiscoveryDraftRecord | null> {
  const supabase = requireServiceSupabase();
  const workspace = await resolveSaecWorkspaceId(supabase);
  const platformUserId = input.platformUserId.trim();
  if (!platformUserId) return null;

  const { data, error } = await supabase
    .from("saec_discovery_drafts")
    .select(DRAFT_SELECT)
    .eq("workspace_id", workspace.id)
    .eq("platform_user_id", platformUserId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapDraftRow(data as DbDraftRow);
}

export async function upsertSaecDiscoveryDraft(input: {
  platformUserId: string;
  ownerEmail?: string | null;
  responses: unknown;
}): Promise<SaecDiscoveryDraftRecord | null> {
  const supabase = requireServiceSupabase();
  const workspace = await resolveSaecWorkspaceId(supabase);
  const platformUserId = input.platformUserId.trim();
  if (!platformUserId) {
    throw new Error("platformUserId is required.");
  }

  const responses = normalizeDiscoveryResponses(input.responses);
  if (discoveryResponsesAreBlank(responses)) {
    await clearSaecDiscoveryDraft(platformUserId);
    return null;
  }

  const now = new Date().toISOString();
  const { data: existing, error: existingError } = await supabase
    .from("saec_discovery_drafts")
    .select("id, created_at")
    .eq("workspace_id", workspace.id)
    .eq("platform_user_id", platformUserId)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  const payload = {
    id: existing?.id ?? randomId("saecdraft"),
    workspace_id: workspace.id,
    platform_user_id: platformUserId,
    owner_email: input.ownerEmail?.trim() || null,
    responses,
    last_saved_at: now,
    updated_at: now,
    created_at: existing?.created_at ?? now,
  };

  const { data, error } = await supabase
    .from("saec_discovery_drafts")
    .upsert(payload, { onConflict: "workspace_id,platform_user_id" })
    .select(DRAFT_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return mapDraftRow(data as DbDraftRow);
}

export async function clearSaecDiscoveryDraft(platformUserId: string): Promise<void> {
  const supabase = requireServiceSupabase();
  const workspace = await resolveSaecWorkspaceId(supabase);
  const trimmed = platformUserId.trim();
  if (!trimmed) return;

  const { error } = await supabase
    .from("saec_discovery_drafts")
    .delete()
    .eq("workspace_id", workspace.id)
    .eq("platform_user_id", trimmed);

  if (error) throw new Error(error.message);
}

export async function getSaecDiscoveryDraftsForInternal(): Promise<SaecDiscoveryDraftRecord[]> {
  const supabase = requireServiceSupabase();
  const workspace = await resolveSaecWorkspaceId(supabase);

  const { data, error } = await supabase
    .from("saec_discovery_drafts")
    .select(DRAFT_SELECT)
    .eq("workspace_id", workspace.id)
    .order("last_saved_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!data?.length) return [];
  return (data as DbDraftRow[]).map(mapDraftRow);
}
