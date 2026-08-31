import "server-only";

import {
  clearSaecDiscoveryDraftForOwner,
  getSaecDiscoveryDraftsForInternal,
} from "@/lib/saec-discovery/drafts-service";
import {
  discoveryResponsesAreBlank,
  normalizeDiscoveryResponses,
} from "@/lib/saec-discovery/config";
import type {
  SaecDiscoveryFeedbackSnapshot,
  SaecDiscoveryState,
  SaecDiscoverySubmissionRecord,
  SaecDiscoverySubmissionStatus,
} from "@/lib/saec-discovery/types";
import { notifySaecDiscoverySubmitted } from "@/lib/saec-discovery/submit-notify";
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

const SUBMISSION_SELECT =
  "id, workspace_id, status, responses, metadata, submitted_by_email, submitted_at, created_at, updated_at, workspaces(slug, name)";

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
    .order("submitted_at", { ascending: false })
    .limit(1)
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
  ownerUserId?: string | null;
}): Promise<SaecDiscoverySubmissionRecord> {
  const supabase = requireServiceSupabase();
  const workspace = await resolveSaecWorkspaceId(supabase);
  const responses = normalizeDiscoveryResponses(input.responses);
  const now = new Date().toISOString();

  if (discoveryResponsesAreBlank(responses)) {
    throw new Error("Cannot submit an empty questionnaire.");
  }

  const payload = {
    id: randomId("saecdisc"),
    workspace_id: workspace.id,
    status: "submitted" as const,
    responses,
    metadata: {},
    submitted_by_email: input.submittedByEmail?.trim() || null,
    submitted_at: now,
    updated_at: now,
    created_at: now,
  };

  const { data, error } = await supabase
    .from("saec_discovery_submissions")
    .insert(payload)
    .select(SUBMISSION_SELECT)
    .single();

  if (error) throw new Error(error.message);
  const record = mapSubmissionRow(data as DbSubmissionRow);
  if (input.ownerUserId?.trim()) {
    await clearSaecDiscoveryDraftForOwner({ ownerUserId: input.ownerUserId.trim() });
  }
  void notifySaecDiscoverySubmitted(record);
  return record;
}

export async function getSaecDiscoverySubmissionsForInternal(): Promise<SaecDiscoverySubmissionRecord[]> {
  const supabase = requireServiceSupabase();
  const workspace = await resolveSaecWorkspaceId(supabase);

  const { data, error } = await supabase
    .from("saec_discovery_submissions")
    .select(SUBMISSION_SELECT)
    .eq("workspace_id", workspace.id)
    .order("submitted_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!data?.length) return [];
  return (data as DbSubmissionRow[]).map(mapSubmissionRow);
}

/** @deprecated Prefer getSaecDiscoverySubmissionsForInternal — returns latest submission only. */
export async function getSaecDiscoverySubmissionForInternal(): Promise<SaecDiscoverySubmissionRecord | null> {
  const submissions = await getSaecDiscoverySubmissionsForInternal();
  return submissions[0] ?? null;
}

export async function getSaecDiscoveryFeedbackForInternal(): Promise<SaecDiscoveryFeedbackSnapshot> {
  const [drafts, submissions] = await Promise.all([
    getSaecDiscoveryDraftsForInternal(),
    getSaecDiscoverySubmissionsForInternal(),
  ]);
  return { drafts, submissions };
}
