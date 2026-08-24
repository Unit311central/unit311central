import type {
  TechnicalFileCategory,
  TechnicalFileStatus,
} from "@/lib/engineering-technical-files/file-types";
import {
  classifyTechnicalFile,
  getFileExtension,
  inferCategoryFromKind,
  TECHNICAL_FILES_MAX_BYTES,
  TECHNICAL_FILES_STORAGE_PREFIX,
} from "@/lib/engineering-technical-files/file-types";
import type {
  EngineeringMaster,
  TechnicalFileDetail,
  TechnicalFileEvent,
  TechnicalFileListItem,
  TechnicalFileRelationship,
  TechnicalFileUploadPrepareResult,
  TechnicalFileVersion,
} from "@/lib/engineering-technical-files/types";
import { INTERNAL_FILES_BUCKET } from "@/lib/internal-files-data";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export type TechnicalFileActor = { userId?: string | null; displayName: string };
export type TechnicalFileWorkspaceScope = { workspaceId?: string };

function db() {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  return createTenancyServerClient();
}

async function workspaceId(scope?: TechnicalFileWorkspaceScope) {
  if (scope?.workspaceId?.trim()) return scope.workspaceId.trim();
  return (await requireCurrentWorkspace()).id;
}

function sanitizeFileName(name: string) {
  return name.replace(/[^\w.\-()+ ]+/g, "_").slice(0, 200);
}

function buildStoragePath(ws: string, fileId: string, versionId: string, fileName: string) {
  return `${ws}/${TECHNICAL_FILES_STORAGE_PREFIX}/${fileId}/versions/${versionId}/${sanitizeFileName(fileName)}`;
}

async function recordEvent(input: {
  workspaceId: string;
  technicalFileId?: string | null;
  versionId?: string | null;
  eventType: string;
  actor: TechnicalFileActor;
  comment?: string | null;
  payload?: Record<string, unknown>;
}) {
  await db().from("engineering_technical_file_events").insert({
    workspace_id: input.workspaceId,
    technical_file_id: input.technicalFileId ?? null,
    version_id: input.versionId ?? null,
    event_type: input.eventType,
    actor_name: input.actor.displayName,
    actor_user_id: input.actor.userId ?? null,
    comment: input.comment ?? null,
    payload: input.payload ?? {},
  });
}

function mapMaster(row: Record<string, unknown>): EngineeringMaster {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    title: String(row.title),
    description: String(row.description ?? ""),
    programRef: row.program_ref ? String(row.program_ref) : null,
    productRef: row.product_ref ? String(row.product_ref) : null,
    status: String(row.status),
    createdByName: String(row.created_by_name ?? ""),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapVersion(row: Record<string, unknown>): TechnicalFileVersion {
  return {
    id: String(row.id),
    technicalFileId: String(row.technical_file_id),
    revision: String(row.revision),
    versionLabel: String(row.version_label ?? ""),
    fileName: String(row.file_name),
    storagePath: String(row.storage_path),
    mimeType: row.mime_type ? String(row.mime_type) : null,
    extension: row.extension ? String(row.extension) : null,
    sizeBytes: Number(row.size_bytes ?? 0),
    isCurrent: Boolean(row.is_current),
    uploadedByName: String(row.uploaded_by_name ?? ""),
    changeNotes: String(row.change_notes ?? ""),
    createdAt: String(row.created_at),
  };
}

function mapRelationship(row: Record<string, unknown>): TechnicalFileRelationship {
  return {
    id: String(row.id),
    sourceFileId: String(row.source_file_id),
    targetType: row.target_type as TechnicalFileRelationship["targetType"],
    targetId: String(row.target_id),
    label: row.label ? String(row.label) : null,
    createdAt: String(row.created_at),
  };
}

function mapEvent(row: Record<string, unknown>): TechnicalFileEvent {
  return {
    id: String(row.id),
    eventType: String(row.event_type),
    actorName: String(row.actor_name),
    comment: row.comment ? String(row.comment) : null,
    createdAt: String(row.created_at),
    payload: (row.payload as Record<string, unknown>) ?? {},
  };
}

function mapListItem(
  row: Record<string, unknown>,
  version?: TechnicalFileVersion | null,
  masterTitle?: string | null,
): TechnicalFileListItem {
  const classified = version
    ? classifyTechnicalFile(version.fileName, version.mimeType)
    : { kind: "other" as const };
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description ?? ""),
    category: row.category as TechnicalFileCategory,
    fileKind: classified.kind,
    status: row.status as TechnicalFileStatus,
    masterId: row.master_id ? String(row.master_id) : null,
    masterTitle: masterTitle ?? null,
    programRef: row.program_ref ? String(row.program_ref) : null,
    productRef: row.product_ref ? String(row.product_ref) : null,
    partNumber: row.part_number ? String(row.part_number) : null,
    drawingNumber: row.drawing_number ? String(row.drawing_number) : null,
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    currentRevision: version?.revision ?? null,
    currentFileName: version?.fileName ?? null,
    currentExtension: version?.extension ?? null,
    currentSizeBytes: version?.sizeBytes ?? 0,
    uploadedByName: version?.uploadedByName ?? String(row.created_by_name ?? ""),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listEngineeringMasters(scope?: TechnicalFileWorkspaceScope) {
  const ws = await workspaceId(scope);
  const { data, error } = await db()
    .from("engineering_masters")
    .select("*")
    .eq("workspace_id", ws)
    .neq("status", "Archived")
    .order("title", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapMaster(row));
}

export async function createEngineeringMaster(
  input: { title: string; description?: string; programRef?: string; productRef?: string },
  actor: TechnicalFileActor,
  scope?: TechnicalFileWorkspaceScope,
) {
  const ws = await workspaceId(scope);
  const { data, error } = await db()
    .from("engineering_masters")
    .insert({
      workspace_id: ws,
      title: input.title.trim(),
      description: input.description?.trim() ?? "",
      program_ref: input.programRef?.trim() || null,
      product_ref: input.productRef?.trim() || null,
      created_by_user_id: actor.userId ?? null,
      created_by_name: actor.displayName,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapMaster(data);
}

export async function listTechnicalFiles(
  scope?: TechnicalFileWorkspaceScope,
  filters?: {
    search?: string;
    category?: string;
    status?: string;
    masterId?: string;
    programRef?: string;
    includeArchived?: boolean;
  },
) {
  const ws = await workspaceId(scope);
  let query = db()
    .from("engineering_technical_files")
    .select("*, engineering_masters(title)")
    .eq("workspace_id", ws)
    .order("updated_at", { ascending: false });

  if (!filters?.includeArchived) query = query.is("archived_at", null);
  if (filters?.category && filters.category !== "All") query = query.eq("category", filters.category);
  if (filters?.status && filters.status !== "All") query = query.eq("status", filters.status);
  if (filters?.masterId) query = query.eq("master_id", filters.masterId);
  if (filters?.programRef) query = query.eq("program_ref", filters.programRef);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const fileIds = (data ?? []).map((row) => String(row.id));
  const versionsByFile = await loadCurrentVersions(ws, fileIds);

  let items = (data ?? []).map((row) => {
    const masterJoin = row.engineering_masters as { title?: string } | null;
    return mapListItem(row, versionsByFile.get(String(row.id)), masterJoin?.title ?? null);
  });

  const q = filters?.search?.trim().toLowerCase();
  if (q) {
    items = items.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.tags.some((t) => t.toLowerCase().includes(q)) ||
        (f.partNumber?.toLowerCase().includes(q) ?? false) ||
        (f.drawingNumber?.toLowerCase().includes(q) ?? false) ||
        (f.currentFileName?.toLowerCase().includes(q) ?? false) ||
        (f.currentRevision?.toLowerCase().includes(q) ?? false),
    );
  }

  return items;
}

async function loadCurrentVersions(ws: string, fileIds: string[]) {
  const map = new Map<string, TechnicalFileVersion>();
  if (!fileIds.length) return map;
  const { data, error } = await db()
    .from("engineering_technical_file_versions")
    .select("*")
    .eq("workspace_id", ws)
    .in("technical_file_id", fileIds)
    .eq("is_current", true);
  if (error) throw new Error(error.message);
  for (const row of data ?? []) map.set(String(row.technical_file_id), mapVersion(row));
  return map;
}

export async function getTechnicalFileById(id: string, scope?: TechnicalFileWorkspaceScope) {
  const ws = await workspaceId(scope);
  const { data, error } = await db()
    .from("engineering_technical_files")
    .select("*, engineering_masters(title)")
    .eq("workspace_id", ws)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const { data: versions, error: vErr } = await db()
    .from("engineering_technical_file_versions")
    .select("*")
    .eq("workspace_id", ws)
    .eq("technical_file_id", id)
    .order("created_at", { ascending: false });
  if (vErr) throw new Error(vErr.message);

  const { data: relationships, error: rErr } = await db()
    .from("engineering_technical_file_relationships")
    .select("*")
    .eq("workspace_id", ws)
    .eq("source_file_id", id);
  if (rErr) throw new Error(rErr.message);

  const { data: events, error: eErr } = await db()
    .from("engineering_technical_file_events")
    .select("*")
    .eq("workspace_id", ws)
    .eq("technical_file_id", id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (eErr) throw new Error(eErr.message);

  const versionRows = (versions ?? []).map((row) => mapVersion(row));
  const current = versionRows.find((v) => v.isCurrent) ?? versionRows[0] ?? null;
  const masterJoin = data.engineering_masters as { title?: string } | null;
  const base = mapListItem(data, current, masterJoin?.title ?? null);

  return {
    ...base,
    notes: String(data.notes ?? ""),
    accessLevel: String(data.access_level ?? "standard"),
    archivedAt: data.archived_at ? String(data.archived_at) : null,
    versions: versionRows,
    relationships: (relationships ?? []).map((row) => mapRelationship(row)),
    events: (events ?? []).map((row) => mapEvent(row)),
  } satisfies TechnicalFileDetail;
}

export async function prepareTechnicalFileUpload(
  input: { fileName: string; sizeBytes: number; technicalFileId?: string },
  actor: TechnicalFileActor,
  scope?: TechnicalFileWorkspaceScope,
): Promise<TechnicalFileUploadPrepareResult> {
  if (input.sizeBytes <= 0 || input.sizeBytes > TECHNICAL_FILES_MAX_BYTES) {
    throw new Error(`File size must be between 1 byte and ${TECHNICAL_FILES_MAX_BYTES} bytes.`);
  }
  const ws = await workspaceId(scope);
  const fileId = input.technicalFileId ?? crypto.randomUUID();
  const versionId = crypto.randomUUID();
  const storagePath = buildStoragePath(ws, fileId, versionId, input.fileName);

  const { data, error } = await db().storage
    .from(INTERNAL_FILES_BUCKET)
    .createSignedUploadUrl(storagePath);
  if (error) throw new Error(error.message);

  return {
    signedUrl: data.signedUrl,
    token: data.token,
    storagePath,
    versionId,
  };
}

export async function createTechnicalFileWithVersion(
  input: {
    fileName: string;
    storagePath: string;
    versionId: string;
    sizeBytes: number;
    mimeType?: string | null;
    title?: string;
    description?: string;
    category?: TechnicalFileCategory;
    status?: TechnicalFileStatus;
    masterId?: string | null;
    programRef?: string | null;
    productRef?: string | null;
    partNumber?: string | null;
    drawingNumber?: string | null;
    revision?: string;
    tags?: string[];
    notes?: string;
    changeNotes?: string;
    relatedFileIds?: string[];
    sopId?: string | null;
  },
  actor: TechnicalFileActor,
  scope?: TechnicalFileWorkspaceScope,
) {
  const ws = await workspaceId(scope);
  const classified = classifyTechnicalFile(input.fileName, input.mimeType);
  const revision = (input.revision?.trim() || "A").toUpperCase();
  const title = input.title?.trim() || input.fileName.replace(/\.[^.]+$/, "");

  const { data: fileRow, error: fileErr } = await db()
    .from("engineering_technical_files")
    .insert({
      workspace_id: ws,
      title,
      description: input.description?.trim() ?? "",
      category: input.category ?? inferCategoryFromKind(classified.kind),
      file_kind: classified.kind,
      status: input.status ?? "Draft",
      master_id: input.masterId ?? null,
      program_ref: input.programRef?.trim() || null,
      product_ref: input.productRef?.trim() || null,
      part_number: input.partNumber?.trim() || null,
      drawing_number: input.drawingNumber?.trim() || null,
      tags: input.tags ?? [],
      notes: input.notes?.trim() ?? "",
      created_by_user_id: actor.userId ?? null,
      created_by_name: actor.displayName,
    })
    .select("*")
    .single();
  if (fileErr) throw new Error(fileErr.message);

  const fileId = String(fileRow.id);
  const storagePath = buildStoragePath(ws, fileId, input.versionId, input.fileName);

  const { data: versionRow, error: versionErr } = await db()
    .from("engineering_technical_file_versions")
    .insert({
      id: input.versionId,
      workspace_id: ws,
      technical_file_id: fileId,
      revision,
      version_label: revision,
      file_name: input.fileName,
      storage_path: storagePath,
      mime_type: input.mimeType ?? null,
      extension: classified.extension || getFileExtension(input.fileName) || null,
      size_bytes: input.sizeBytes,
      is_current: true,
      uploaded_by_user_id: actor.userId ?? null,
      uploaded_by_name: actor.displayName,
      change_notes: input.changeNotes?.trim() ?? "Initial upload",
    })
    .select("*")
    .single();
  if (versionErr) throw new Error(versionErr.message);

  await db()
    .from("engineering_technical_files")
    .update({ current_version_id: versionRow.id, updated_at: new Date().toISOString() })
    .eq("workspace_id", ws)
    .eq("id", fileId);

  if (input.storagePath !== storagePath) {
    const supabase = db();
    const { error: moveErr } = await supabase.storage
      .from(INTERNAL_FILES_BUCKET)
      .move(input.storagePath, storagePath);
    if (moveErr) {
      await supabase.storage.from(INTERNAL_FILES_BUCKET).copy(input.storagePath, storagePath);
    }
  }

  await syncRelationships(ws, fileId, input.relatedFileIds, input.sopId);
  await recordEvent({
    workspaceId: ws,
    technicalFileId: fileId,
    versionId: String(versionRow.id),
    eventType: "file_uploaded",
    actor,
    comment: `Uploaded ${input.fileName} (${revision})`,
  });

  const detail = await getTechnicalFileById(fileId, { workspaceId: ws });
  if (!detail) throw new Error("Failed to load created technical file.");
  return detail;
}

export async function addTechnicalFileVersion(
  fileId: string,
  input: {
    fileName: string;
    storagePath: string;
    versionId: string;
    sizeBytes: number;
    mimeType?: string | null;
    revision: string;
    changeNotes?: string;
    status?: TechnicalFileStatus;
  },
  actor: TechnicalFileActor,
  scope?: TechnicalFileWorkspaceScope,
) {
  const ws = await workspaceId(scope);
  const existing = await getTechnicalFileById(fileId, { workspaceId: ws });
  if (!existing) throw new Error("Technical file not found.");

  const classified = classifyTechnicalFile(input.fileName, input.mimeType);
  const revision = input.revision.trim().toUpperCase();
  const storagePath = buildStoragePath(ws, fileId, input.versionId, input.fileName);

  await db()
    .from("engineering_technical_file_versions")
    .update({ is_current: false })
    .eq("workspace_id", ws)
    .eq("technical_file_id", fileId)
    .eq("is_current", true);

  const { data: versionRow, error: versionErr } = await db()
    .from("engineering_technical_file_versions")
    .insert({
      id: input.versionId,
      workspace_id: ws,
      technical_file_id: fileId,
      revision,
      version_label: revision,
      file_name: input.fileName,
      storage_path: storagePath,
      mime_type: input.mimeType ?? null,
      extension: classified.extension || getFileExtension(input.fileName) || null,
      size_bytes: input.sizeBytes,
      is_current: true,
      uploaded_by_user_id: actor.userId ?? null,
      uploaded_by_name: actor.displayName,
      change_notes: input.changeNotes?.trim() ?? "",
    })
    .select("*")
    .single();
  if (versionErr) throw new Error(versionErr.message);

  if (input.storagePath !== storagePath) {
    const supabase = db();
    const { error: moveErr } = await supabase.storage
      .from(INTERNAL_FILES_BUCKET)
      .move(input.storagePath, storagePath);
    if (moveErr) {
      await supabase.storage.from(INTERNAL_FILES_BUCKET).copy(input.storagePath, storagePath);
    }
  }

  const updates: Record<string, unknown> = {
    current_version_id: versionRow.id,
    updated_at: new Date().toISOString(),
    file_kind: classified.kind,
  };
  if (input.status) updates.status = input.status;

  await db().from("engineering_technical_files").update(updates).eq("workspace_id", ws).eq("id", fileId);

  await recordEvent({
    workspaceId: ws,
    technicalFileId: fileId,
    versionId: String(versionRow.id),
    eventType: "version_uploaded",
    actor,
    comment: `New version ${revision}: ${input.fileName}`,
  });

  const detail = await getTechnicalFileById(fileId, { workspaceId: ws });
  if (!detail) throw new Error("Failed to load updated technical file.");
  return detail;
}

export async function updateTechnicalFileMetadata(
  fileId: string,
  input: Partial<{
    title: string;
    description: string;
    category: TechnicalFileCategory;
    status: TechnicalFileStatus;
    masterId: string | null;
    programRef: string | null;
    productRef: string | null;
    partNumber: string | null;
    drawingNumber: string | null;
    tags: string[];
    notes: string;
    relatedFileIds: string[];
    sopId: string | null;
  }>,
  actor: TechnicalFileActor,
  scope?: TechnicalFileWorkspaceScope,
) {
  const ws = await workspaceId(scope);
  const existing = await getTechnicalFileById(fileId, { workspaceId: ws });
  if (!existing) throw new Error("Technical file not found.");

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.description !== undefined) patch.description = input.description.trim();
  if (input.category !== undefined) patch.category = input.category;
  if (input.status !== undefined) patch.status = input.status;
  if (input.masterId !== undefined) patch.master_id = input.masterId;
  if (input.programRef !== undefined) patch.program_ref = input.programRef?.trim() || null;
  if (input.productRef !== undefined) patch.product_ref = input.productRef?.trim() || null;
  if (input.partNumber !== undefined) patch.part_number = input.partNumber?.trim() || null;
  if (input.drawingNumber !== undefined) patch.drawing_number = input.drawingNumber?.trim() || null;
  if (input.tags !== undefined) patch.tags = input.tags;
  if (input.notes !== undefined) patch.notes = input.notes.trim();

  const { error } = await db()
    .from("engineering_technical_files")
    .update(patch)
    .eq("workspace_id", ws)
    .eq("id", fileId);
  if (error) throw new Error(error.message);

  if (input.relatedFileIds !== undefined || input.sopId !== undefined) {
    await syncRelationships(ws, fileId, input.relatedFileIds, input.sopId);
  }

  await recordEvent({
    workspaceId: ws,
    technicalFileId: fileId,
    eventType: "metadata_changed",
    actor,
    payload: patch,
  });

  const detail = await getTechnicalFileById(fileId, { workspaceId: ws });
  if (!detail) throw new Error("Failed to load updated technical file.");
  return detail;
}

export async function archiveTechnicalFile(
  fileId: string,
  actor: TechnicalFileActor,
  scope?: TechnicalFileWorkspaceScope,
) {
  const ws = await workspaceId(scope);
  const existing = await getTechnicalFileById(fileId, { workspaceId: ws });
  if (!existing) throw new Error("Technical file not found.");

  const { error } = await db()
    .from("engineering_technical_files")
    .update({
      archived_at: new Date().toISOString(),
      status: "Archived",
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", ws)
    .eq("id", fileId);
  if (error) throw new Error(error.message);

  await recordEvent({
    workspaceId: ws,
    technicalFileId: fileId,
    eventType: "archived",
    actor,
  });

  return getTechnicalFileById(fileId, { workspaceId: ws });
}

export async function restoreTechnicalFileVersion(
  fileId: string,
  versionId: string,
  actor: TechnicalFileActor,
  scope?: TechnicalFileWorkspaceScope,
) {
  const ws = await workspaceId(scope);
  const existing = await getTechnicalFileById(fileId, { workspaceId: ws });
  if (!existing) throw new Error("Technical file not found.");
  const target = existing.versions.find((v) => v.id === versionId);
  if (!target) throw new Error("Version not found.");

  await db()
    .from("engineering_technical_file_versions")
    .update({ is_current: false })
    .eq("workspace_id", ws)
    .eq("technical_file_id", fileId);

  await db()
    .from("engineering_technical_file_versions")
    .update({ is_current: true })
    .eq("workspace_id", ws)
    .eq("id", versionId);

  await db()
    .from("engineering_technical_files")
    .update({ current_version_id: versionId, updated_at: new Date().toISOString() })
    .eq("workspace_id", ws)
    .eq("id", fileId);

  await recordEvent({
    workspaceId: ws,
    technicalFileId: fileId,
    versionId,
    eventType: "version_restored",
    actor,
    comment: `Restored ${target.revision} as current`,
  });

  const detail = await getTechnicalFileById(fileId, { workspaceId: ws });
  if (!detail) throw new Error("Failed to load restored technical file.");
  return detail;
}

export async function getTechnicalFileDownloadUrl(
  fileId: string,
  versionId?: string,
  scope?: TechnicalFileWorkspaceScope,
  actor?: TechnicalFileActor,
) {
  const ws = await workspaceId(scope);
  const detail = await getTechnicalFileById(fileId, { workspaceId: ws });
  if (!detail) throw new Error("Technical file not found.");

  const version = versionId
    ? detail.versions.find((v) => v.id === versionId)
    : detail.versions.find((v) => v.isCurrent);
  if (!version) throw new Error("Version not found.");

  const { data, error } = await db().storage
    .from(INTERNAL_FILES_BUCKET)
    .createSignedUrl(version.storagePath, 3600);
  if (error) throw new Error(error.message);

  if (actor) {
    await recordEvent({
      workspaceId: ws,
      technicalFileId: fileId,
      versionId: version.id,
      eventType: "file_downloaded",
      actor,
    });
  }

  return { url: data.signedUrl, fileName: version.fileName, mimeType: version.mimeType };
}

async function syncRelationships(
  ws: string,
  fileId: string,
  relatedFileIds?: string[],
  sopId?: string | null,
) {
  if (relatedFileIds !== undefined) {
    await db()
      .from("engineering_technical_file_relationships")
      .delete()
      .eq("workspace_id", ws)
      .eq("source_file_id", fileId)
      .eq("target_type", "technical_file");

    if (relatedFileIds.length) {
      await db().from("engineering_technical_file_relationships").insert(
        relatedFileIds.map((targetId) => ({
          workspace_id: ws,
          source_file_id: fileId,
          target_type: "technical_file",
          target_id: targetId,
        })),
      );
    }
  }

  if (sopId !== undefined) {
    await db()
      .from("engineering_technical_file_relationships")
      .delete()
      .eq("workspace_id", ws)
      .eq("source_file_id", fileId)
      .eq("target_type", "sop");

    if (sopId) {
      await db().from("engineering_technical_file_relationships").insert({
        workspace_id: ws,
        source_file_id: fileId,
        target_type: "sop",
        target_id: sopId,
      });
    }
  }
}
