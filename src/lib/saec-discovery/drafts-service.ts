import "server-only";

import { normalizeDiscoveryResponses } from "@/lib/saec-discovery/config";
import type { SaecDiscoveryDraftRecord, SaecDiscoveryState } from "@/lib/saec-discovery/types";
import { SAEC_SLUG } from "@/lib/saec-surface";
import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/server";

type DbDraftRow = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  owner_email: string | null;
  responses: SaecDiscoveryState | null;
  last_saved_at: string;
  created_at: string;
  updated_at: string;
  workspaces: { slug: string; name: string } | { slug: string; name: string }[] | null;
};

const DRAFT_SELECT =
  "id, workspace_id, owner_user_id, owner_email, responses, last_saved_at, created_at, updated_at, workspaces(slug, name)";

function randomId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function requireServiceSupabase() {
  if (!isSupabaseServiceRoleConfigured()) {
    throw new Error(
      "SAEC Discovery persistence requires SUPABASE_SERVICE_ROLE_KEY (RLS has no open policies).",
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
    ownerUserId: row.owner_user_id,
    ownerEmail: row.owner_email,
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

function draftHasContent(responses: SaecDiscoveryState): boolean {
  return Object.values(responses).some((section) =>
    Object.values(section?.responses ?? {}).some((value) => value.trim().length > 0),
  );
}

export async function getSaecDiscoveryDraftForOwner(input: {
  ownerUserId: string;
}): Promise<SaecDiscoveryDraftRecord | null> {
  const supabase = requireServiceSupabase();
  const workspace = await resolveSaecWorkspaceId(supabase);

  const { data, error } = await supabase
    .from("saec_discovery_drafts")
    .select(DRAFT_SELECT)
    .eq("workspace_id", workspace.id)
    .eq("owner_user_id", input.ownerUserId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapDraftRow(data as DbDraftRow);
}

export async function upsertSaecDiscoveryDraft(input: {
  ownerUserId: string;
  ownerEmail?: string | null;
  responses: unknown;
}): Promise<SaecDiscoveryDraftRecord | null> {
  const supabase = requireServiceSupabase();
  const workspace = await resolveSaecWorkspaceId(supabase);
  const responses = normalizeDiscoveryResponses(input.responses);
  const now = new Date().toISOString();

  if (!draftHasContent(responses)) {
    await clearSaecDiscoveryDraftForOwner({ ownerUserId: input.ownerUserId });
    return null;
  }

  const existing = await getSaecDiscoveryDraftForOwner({ ownerUserId: input.ownerUserId });
  const payload = {
    id: existing?.id ?? randomId("saecdraft"),
    workspace_id: workspace.id,
    owner_user_id: input.ownerUserId,
    owner_email: input.ownerEmail?.trim() || existing?.ownerEmail || null,
    responses,
    last_saved_at: now,
    updated_at: now,
    ...(existing ? {} : { created_at: now }),
  };

  const { data, error } = await supabase
    .from("saec_discovery_drafts")
    .upsert(payload, { onConflict: "workspace_id,owner_user_id" })
    .select(DRAFT_SELECT)
    .single();

  if (error) throw new Error(error.message);
  return mapDraftRow(data as DbDraftRow);
}

export async function clearSaecDiscoveryDraftForOwner(input: {
  ownerUserId: string;
}): Promise<void> {
  const supabase = requireServiceSupabase();
  const workspace = await resolveSaecWorkspaceId(supabase);

  const { error } = await supabase
    .from("saec_discovery_drafts")
    .delete()
    .eq("workspace_id", workspace.id)
    .eq("owner_user_id", input.ownerUserId);

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

export async function deleteSaecDiscoveryDraftForInternal(id: string): Promise<void> {
  const supabase = requireServiceSupabase();
  const workspace = await resolveSaecWorkspaceId(supabase);

  const { error } = await supabase
    .from("saec_discovery_drafts")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspace.id);

  if (error) throw new Error(error.message);
}
