import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/server";
import { isTalantonImpactSlug, TALANTON_IMPACT_SLUG } from "@/lib/talanton-surface";
import type { TiBoardMember } from "@/lib/talanton/board-portal-data";
import {
  seedBoardMembersFromFixtures,
  seedRisksFromFixtures,
  TALANTON_GOVERNANCE_MEETING_SEED,
} from "@/lib/talanton/governance-seed-data";
import type { GovernanceMeeting } from "@/lib/talanton/governance-types";
import type { TiRiskRegisterEntry } from "@/lib/talanton/risk-register-store";
import { computeTiRiskRating } from "@/lib/talanton/risk-register-store";
import {
  WorkspaceAccessError,
  requireCurrentWorkspace,
  type CurrentWorkspace,
} from "@/lib/workspace-context";

function db() {
  if (!isSupabaseServiceRoleConfigured()) {
    throw new Error("Workspace governance requires SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createSupabaseServiceRoleClient();
}

export async function requireTalantonGovernanceWorkspace(): Promise<CurrentWorkspace> {
  const workspace = await requireCurrentWorkspace();
  if (!isTalantonImpactSlug(workspace.slug)) {
    throw new WorkspaceAccessError(
      "Board governance persistence is only available for Talanton Impact workspace.",
      403,
    );
  }
  return workspace;
}

function mapMeetingRow(row: Record<string, unknown>): GovernanceMeeting {
  return {
    id: String(row.id),
    meetingDate: String(row.meeting_date ?? "").slice(0, 10),
    meetingType: row.meeting_type as GovernanceMeeting["meetingType"],
    title: String(row.title ?? ""),
    status: row.status as GovernanceMeeting["status"],
    attendees: (row.attendees as GovernanceMeeting["attendees"]) ?? [],
    minutes: String(row.minutes ?? ""),
    decisions: (row.decisions as GovernanceMeeting["decisions"]) ?? [],
    actions: (row.actions as GovernanceMeeting["actions"]) ?? [],
    archived: Boolean(row.archived),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

function meetingToRow(workspaceId: string, meeting: GovernanceMeeting) {
  return {
    id: meeting.id,
    workspace_id: workspaceId,
    meeting_date: meeting.meetingDate.slice(0, 10),
    meeting_type: meeting.meetingType,
    title: meeting.title,
    status: meeting.status,
    attendees: meeting.attendees,
    minutes: meeting.minutes,
    decisions: meeting.decisions,
    actions: meeting.actions,
    archived: meeting.archived,
    created_at: meeting.createdAt,
    updated_at: meeting.updatedAt,
  };
}

function mapRiskRow(row: Record<string, unknown>): TiRiskRegisterEntry {
  return {
    id: String(row.id),
    description: String(row.description ?? ""),
    owner: String(row.owner ?? "Unassigned"),
    impact: row.impact as TiRiskRegisterEntry["impact"],
    likelihood: row.likelihood as TiRiskRegisterEntry["likelihood"],
    rating: Number(row.rating ?? 0),
    mitigation: String(row.mitigation ?? ""),
    status: String(row.status ?? "Open"),
    dateAdded: String(row.date_added ?? "").slice(0, 10),
    reviewDate: String(row.review_date ?? "").slice(0, 10),
    boardPackId: String(row.board_pack_id ?? ""),
    boardPackLabel: String(row.board_pack_label ?? ""),
    archived: Boolean(row.archived),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

function riskToRow(workspaceId: string, risk: TiRiskRegisterEntry) {
  return {
    id: risk.id,
    workspace_id: workspaceId,
    description: risk.description,
    owner: risk.owner,
    impact: risk.impact,
    likelihood: risk.likelihood,
    rating: risk.rating,
    mitigation: risk.mitigation,
    status: risk.status,
    date_added: risk.dateAdded.slice(0, 10),
    review_date: risk.reviewDate.slice(0, 10),
    board_pack_id: risk.boardPackId,
    board_pack_label: risk.boardPackLabel,
    archived: risk.archived,
    created_at: risk.createdAt,
    updated_at: risk.updatedAt,
  };
}

function mapMemberRow(row: Record<string, unknown>): TiBoardMember {
  return {
    id: String(row.id),
    firstName: String(row.first_name ?? ""),
    lastName: String(row.last_name ?? ""),
    name: String(row.display_name ?? ""),
    role: String(row.role ?? ""),
    email: String(row.email ?? ""),
    committees: Array.isArray(row.committees) ? (row.committees as string[]) : [],
  };
}

function memberToRow(workspaceId: string, member: TiBoardMember, sortOrder: number) {
  return {
    id: member.id,
    workspace_id: workspaceId,
    first_name: member.firstName,
    last_name: member.lastName,
    display_name: member.name,
    role: member.role,
    email: member.email,
    committees: member.committees ?? [],
    sort_order: sortOrder,
    updated_at: new Date().toISOString(),
  };
}

async function importAlreadyDone(workspaceId: string, importKey: string) {
  const supabase = db();
  const { data } = await supabase
    .from("workspace_governance_import_log")
    .select("import_key")
    .eq("workspace_id", workspaceId)
    .eq("import_key", importKey)
    .maybeSingle();
  return Boolean(data?.import_key);
}

async function markImportDone(workspaceId: string, importKey: string) {
  const supabase = db();
  const { error } = await supabase.from("workspace_governance_import_log").upsert(
    { workspace_id: workspaceId, import_key: importKey, imported_at: new Date().toISOString() },
    { onConflict: "workspace_id,import_key" },
  );
  if (error) throw new Error(`import log: ${error.message}`);
}

export async function listGovernanceMeetings(workspaceId: string): Promise<GovernanceMeeting[]> {
  const supabase = db();
  const { data, error } = await supabase
    .from("workspace_governance_meetings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("meeting_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapMeetingRow(row as Record<string, unknown>));
}

async function seedMeetingsIfEmpty(workspaceId: string, workspaceSlug: string) {
  const existing = await listGovernanceMeetings(workspaceId);
  if (existing.length > 0) return existing;
  if (workspaceSlug !== TALANTON_IMPACT_SLUG) return existing;

  const supabase = db();
  for (const meeting of TALANTON_GOVERNANCE_MEETING_SEED) {
    const { error } = await supabase
      .from("workspace_governance_meetings")
      .upsert(meetingToRow(workspaceId, meeting), { onConflict: "workspace_id,id" });
    if (error) throw new Error(`seed meetings: ${error.message}`);
  }
  return listGovernanceMeetings(workspaceId);
}

export async function ensureGovernanceMeetings(args: {
  workspaceId: string;
  workspaceSlug: string;
}): Promise<GovernanceMeeting[]> {
  return seedMeetingsIfEmpty(args.workspaceId, args.workspaceSlug);
}

export async function upsertGovernanceMeeting(
  workspaceId: string,
  meeting: GovernanceMeeting,
): Promise<GovernanceMeeting> {
  const supabase = db();
  const row = meetingToRow(workspaceId, {
    ...meeting,
    updatedAt: new Date().toISOString(),
  });
  const { data, error } = await supabase
    .from("workspace_governance_meetings")
    .upsert(row, { onConflict: "workspace_id,id" })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapMeetingRow(data as Record<string, unknown>);
}

export async function deleteGovernanceMeeting(workspaceId: string, meetingId: string) {
  const supabase = db();
  const { error } = await supabase
    .from("workspace_governance_meetings")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", meetingId);
  if (error) throw new Error(error.message);
}

export async function listGovernanceRisks(workspaceId: string): Promise<TiRiskRegisterEntry[]> {
  const supabase = db();
  const { data, error } = await supabase
    .from("workspace_governance_risks")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("date_added", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapRiskRow(row as Record<string, unknown>));
}

async function seedRisksIfEmpty(workspaceId: string, workspaceSlug: string) {
  const existing = await listGovernanceRisks(workspaceId);
  if (existing.length > 0) return existing;
  if (workspaceSlug !== TALANTON_IMPACT_SLUG) return existing;

  const supabase = db();
  for (const risk of seedRisksFromFixtures()) {
    const { error } = await supabase
      .from("workspace_governance_risks")
      .upsert(riskToRow(workspaceId, risk), { onConflict: "workspace_id,id" });
    if (error) throw new Error(`seed risks: ${error.message}`);
  }
  return listGovernanceRisks(workspaceId);
}

export async function ensureGovernanceRisks(args: {
  workspaceId: string;
  workspaceSlug: string;
}): Promise<TiRiskRegisterEntry[]> {
  return seedRisksIfEmpty(args.workspaceId, args.workspaceSlug);
}

export async function upsertGovernanceRisk(
  workspaceId: string,
  input: Partial<TiRiskRegisterEntry> & { description: string },
): Promise<TiRiskRegisterEntry> {
  const existing = input.id
    ? (await listGovernanceRisks(workspaceId)).find((r) => r.id === input.id)
    : undefined;
  const impact = (input.impact ?? existing?.impact ?? "M") as TiRiskRegisterEntry["impact"];
  const likelihood = (input.likelihood ?? existing?.likelihood ?? "M") as TiRiskRegisterEntry["likelihood"];
  const dateAdded = input.dateAdded ?? existing?.dateAdded ?? new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();
  const id =
    input.id?.trim() ||
    existing?.id ||
    `TI-R${String((await listGovernanceRisks(workspaceId)).length + 1).padStart(2, "0")}`;

  const risk: TiRiskRegisterEntry = {
    id,
    description: input.description.trim(),
    owner: String(input.owner ?? existing?.owner ?? "").trim() || "Unassigned",
    impact,
    likelihood,
    rating: input.rating ?? computeTiRiskRating(impact, likelihood),
    mitigation: String(input.mitigation ?? existing?.mitigation ?? "").trim(),
    status: String(input.status ?? existing?.status ?? "Open").trim() || "Open",
    dateAdded,
    reviewDate: String(input.reviewDate ?? existing?.reviewDate ?? dateAdded).slice(0, 10),
    boardPackId: String(input.boardPackId ?? existing?.boardPackId ?? "").trim(),
    boardPackLabel: String(input.boardPackLabel ?? existing?.boardPackLabel ?? "").trim(),
    archived: input.archived ?? existing?.archived ?? false,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const supabase = db();
  const { data, error } = await supabase
    .from("workspace_governance_risks")
    .upsert(riskToRow(workspaceId, risk), { onConflict: "workspace_id,id" })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapRiskRow(data as Record<string, unknown>);
}

export async function deleteGovernanceRisk(workspaceId: string, riskId: string) {
  const supabase = db();
  const { error } = await supabase
    .from("workspace_governance_risks")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", riskId);
  if (error) throw new Error(error.message);
}

export async function listBoardMembers(workspaceId: string): Promise<TiBoardMember[]> {
  const supabase = db();
  const { data, error } = await supabase
    .from("workspace_board_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("sort_order", { ascending: true })
    .order("display_name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapMemberRow(row as Record<string, unknown>));
}

async function seedMembersIfEmpty(workspaceId: string, workspaceSlug: string) {
  const existing = await listBoardMembers(workspaceId);
  if (existing.length > 0) return existing;
  if (workspaceSlug !== TALANTON_IMPACT_SLUG) return existing;

  const supabase = db();
  for (const { member, sortOrder } of seedBoardMembersFromFixtures()) {
    const { error } = await supabase.from("workspace_board_members").upsert(
      {
        ...memberToRow(workspaceId, member, sortOrder),
        created_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,id" },
    );
    if (error) throw new Error(`seed board members: ${error.message}`);
  }
  return listBoardMembers(workspaceId);
}

export async function ensureBoardMembers(args: {
  workspaceId: string;
  workspaceSlug: string;
}): Promise<TiBoardMember[]> {
  return seedMembersIfEmpty(args.workspaceId, args.workspaceSlug);
}

export async function upsertBoardMember(
  workspaceId: string,
  member: TiBoardMember,
  sortOrder?: number,
): Promise<TiBoardMember> {
  const supabase = db();
  const members = await listBoardMembers(workspaceId);
  const existingIndex = members.findIndex((m) => m.id === member.id);
  const order =
    sortOrder ?? (existingIndex >= 0 ? (existingIndex + 1) * 10 : (members.length + 1) * 10);
  const row: Record<string, unknown> = {
    ...memberToRow(workspaceId, member, order),
  };
  if (existingIndex < 0) {
    row.created_at = new Date().toISOString();
  }
  const { data, error } = await supabase
    .from("workspace_board_members")
    .upsert(row, { onConflict: "workspace_id,id" })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapMemberRow(data as Record<string, unknown>);
}

export async function deleteBoardMember(workspaceId: string, memberId: string) {
  const supabase = db();
  const { error } = await supabase
    .from("workspace_board_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", memberId);
  if (error) throw new Error(error.message);
}

export type LocalGovernanceMigrationPayload = {
  importKey: string;
  meetings?: GovernanceMeeting[];
  risks?: TiRiskRegisterEntry[];
  members?: TiBoardMember[];
};

export async function migrateLocalGovernanceData(
  workspaceId: string,
  payload: LocalGovernanceMigrationPayload,
): Promise<{ imported: boolean; reason?: string }> {
  if (await importAlreadyDone(workspaceId, payload.importKey)) {
    return { imported: false, reason: "already_imported" };
  }

  const supabase = db();

  if (payload.meetings?.length) {
    const existingIds = new Set((await listGovernanceMeetings(workspaceId)).map((m) => m.id));
    for (const meeting of payload.meetings) {
      if (existingIds.has(meeting.id)) continue;
      const { error } = await supabase
        .from("workspace_governance_meetings")
        .insert(meetingToRow(workspaceId, meeting));
      if (error) throw new Error(`migrate meeting ${meeting.id}: ${error.message}`);
    }
  }

  if (payload.risks?.length) {
    const existingIds = new Set((await listGovernanceRisks(workspaceId)).map((r) => r.id));
    for (const risk of payload.risks) {
      if (existingIds.has(risk.id)) continue;
      const { error } = await supabase
        .from("workspace_governance_risks")
        .insert(riskToRow(workspaceId, risk));
      if (error) throw new Error(`migrate risk ${risk.id}: ${error.message}`);
    }
  }

  if (payload.members?.length) {
    const existingIds = new Set((await listBoardMembers(workspaceId)).map((m) => m.id));
    let order = (await listBoardMembers(workspaceId)).length;
    for (const member of payload.members) {
      if (existingIds.has(member.id)) continue;
      order += 1;
      const { error } = await supabase.from("workspace_board_members").insert({
        ...memberToRow(workspaceId, member, order * 10),
        created_at: new Date().toISOString(),
      });
      if (error) throw new Error(`migrate member ${member.id}: ${error.message}`);
    }
  }

  await markImportDone(workspaceId, payload.importKey);
  return { imported: true };
}
