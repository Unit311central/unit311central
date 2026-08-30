import "server-only";

import {
  buildDiscoverySubmissionSnapshot,
  normalizeDiscoveryResponses,
} from "@/lib/saec-discovery/config";
import type {
  SaecDiscoveryState,
  SaecDiscoverySubmissionRecord,
  SaecDiscoverySubmissionStatus,
} from "@/lib/saec-discovery/types";
import { SAEC_SLUG } from "@/lib/saec-surface";
import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/server";

type DbSubmissionRow = {
  id: string;
  workspace_id: string;
  status: "submitted";
  responses: SaecDiscoveryState | null;
  metadata: Record<string, unknown> | null;
  submitted_by_email: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  workspaces: { slug: string; name: string } | { slug: string; name: string }[] | null;
};

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

function mapSubmissionRow(row: DbSubmissionRow): SaecDiscoverySubmissionRecord {
  const workspace = Array.isArray(row.workspaces) ? row.workspaces[0] : row.workspaces;
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    workspaceSlug: workspace?.slug ?? SAEC_SLUG,
    workspaceName: workspace?.name ?? "SAEC",
    status: row.status,
    responses: normalizeDiscoveryResponses(row.responses),
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {},
    submittedByEmail: row.submitted_by_email,
    submittedAt: row.submitted_at,
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

export async function getSaecDiscoverySubmissionStatus(): Promise<SaecDiscoverySubmissionStatus> {
  const supabase = requireServiceSupabase();
  const workspace = await resolveSaecWorkspaceId(supabase);

  const { data, error } = await supabase
    .from("saec_discovery_submissions")
    .select("submitted_at, updated_at")
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) {
    return { submitted: false, submittedAt: null, updatedAt: null };
  }

  return {
    submitted: true,
    submittedAt: data.submitted_at,
    updatedAt: data.updated_at,
  };
}

export async function submitSaecDiscoveryQuestionnaire(input: {
  responses: unknown;
  submittedByEmail?: string | null;
}): Promise<SaecDiscoverySubmissionRecord> {
  const supabase = requireServiceSupabase();
  const workspace = await resolveSaecWorkspaceId(supabase);
  const responses = normalizeDiscoveryResponses(input.responses);
  const now = new Date().toISOString();

  const { data: existing, error: existingError } = await supabase
    .from("saec_discovery_submissions")
    .select("id, created_at")
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  const payload = {
    id: existing?.id ?? randomId("saecdisc"),
    workspace_id: workspace.id,
    status: "submitted" as const,
    responses,
    metadata: {},
    submitted_by_email: input.submittedByEmail?.trim() || null,
    submitted_at: now,
    updated_at: now,
    ...(existing ? {} : { created_at: now }),
  };

  const { data, error } = await supabase
    .from("saec_discovery_submissions")
    .upsert(payload, { onConflict: "workspace_id" })
    .select(
      "id, workspace_id, status, responses, metadata, submitted_by_email, submitted_at, created_at, updated_at, workspaces(slug, name)",
    )
    .single();

  if (error) throw new Error(error.message);
  return mapSubmissionRow(data as DbSubmissionRow);
}

export async function getSaecDiscoverySubmissionForInternal(): Promise<SaecDiscoverySubmissionRecord | null> {
  const supabase = requireServiceSupabase();
  const workspace = await resolveSaecWorkspaceId(supabase);

  const { data, error } = await supabase
    .from("saec_discovery_submissions")
    .select(
      "id, workspace_id, status, responses, metadata, submitted_by_email, submitted_at, created_at, updated_at, workspaces(slug, name)",
    )
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapSubmissionRow(data as DbSubmissionRow);
}
