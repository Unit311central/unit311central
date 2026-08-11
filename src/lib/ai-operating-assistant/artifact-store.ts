/**
 * Durable assistant artifacts — memory cache + Supabase Storage + base64 fallback.
 */

import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/server";
import { ensureAssistantArtifactStorage } from "@/lib/internal-db-migrations";

let artifactStorageReady: Promise<boolean> | null = null;

async function ensureArtifactStorageReady() {
  if (!artifactStorageReady) {
    artifactStorageReady = ensureAssistantArtifactStorage().catch((error) => {
      artifactStorageReady = null;
      console.error("[artifact-store] assistant artifact storage migration failed", error);
      return false;
    });
  }
  return artifactStorageReady;
}

export type AssistantStoredArtifact = {
  id: string;
  kind: "pdf" | "pptx" | "file";
  title: string;
  filename: string;
  mimeType: string;
  bytes: Buffer;
  createdAt: string;
  userId: string;
  meta?: Record<string, unknown>;
  storagePath?: string | null;
  contentBase64?: string;
};

const artifacts = new Map<string, AssistantStoredArtifact>();
const MAX_ARTIFACTS = 40;
const BUCKET = "assistant-artifacts";

export function createArtifactId() {
  return `art_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function putAssistantArtifact(
  input: Omit<AssistantStoredArtifact, "createdAt" | "contentBase64"> & {
    createdAt?: string;
  },
): AssistantStoredArtifact {
  const contentBase64 = input.bytes.toString("base64");
  const record: AssistantStoredArtifact = {
    ...input,
    createdAt: input.createdAt ?? new Date().toISOString(),
    contentBase64,
  };
  artifacts.set(record.id, record);
  if (artifacts.size > MAX_ARTIFACTS) {
    const oldest = [...artifacts.entries()].sort((a, b) =>
      a[1].createdAt.localeCompare(b[1].createdAt),
    )[0];
    if (oldest) artifacts.delete(oldest[0]);
  }
  return record;
}

async function upsertArtifactRecord(record: AssistantStoredArtifact, storagePath: string) {
  if (!isSupabaseServiceRoleConfigured()) return;
  try {
    const supabase = createSupabaseServiceRoleClient();
    await supabase.from("assistant_artifact_records").upsert(
      {
        id: record.id,
        user_id: record.userId,
        storage_path: storagePath,
        filename: record.filename,
        mime_type: record.mimeType,
        kind: record.kind,
        created_at: record.createdAt,
      },
      { onConflict: "id" },
    );
  } catch (error) {
    console.error("[artifact-store] failed to index artifact record", record.id, error);
  }
}

export async function persistArtifactToStorage(
  record: AssistantStoredArtifact,
): Promise<AssistantStoredArtifact> {
  if (!isSupabaseServiceRoleConfigured()) return record;
  try {
    const supabase = createSupabaseServiceRoleClient();
    const ext =
      record.kind === "pptx"
        ? "pptx"
        : record.mimeType.includes("pdf")
          ? "pdf"
          : "bin";
    const path = `${record.userId}/${record.id}.${ext}`;
    await supabase.storage.createBucket(BUCKET, { public: false }).catch(() => undefined);
    const { error } = await supabase.storage.from(BUCKET).upload(path, record.bytes, {
      contentType: record.mimeType,
      upsert: true,
    });
    if (error) {
      console.error("[artifact-store] upload failed", record.id, error.message);
      return record;
    }
    const updated = { ...record, storagePath: path };
    artifacts.set(record.id, updated);
    await upsertArtifactRecord(updated, path);
    return updated;
  } catch (error) {
    console.error("[artifact-store] persist failed", record.id, error);
    return record;
  }
}

export function getAssistantArtifact(id: string, userId?: string) {
  const record = artifacts.get(id);
  if (!record) return null;
  if (userId && record.userId !== userId) return null;
  return record;
}

export function getLatestArtifactForUser(userId: string) {
  const owned = [...artifacts.values()]
    .filter((entry) => entry.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return owned[0] ?? null;
}

async function downloadArtifactAtPath(
  id: string,
  userId: string,
  path: string,
  kind: "pdf" | "pptx" | "file",
  filename: string,
  mimeType: string,
) {
  if (!isSupabaseServiceRoleConfigured()) return null;
  try {
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase.storage.from(BUCKET).download(path);
    if (error || !data) return null;
    const buffer = Buffer.from(await data.arrayBuffer());
    return putAssistantArtifact({
      id,
      kind,
      title: filename,
      filename,
      mimeType,
      bytes: buffer,
      userId,
      storagePath: path,
    });
  } catch {
    return null;
  }
}

export async function loadArtifactBytes(
  id: string,
  userId: string,
): Promise<AssistantStoredArtifact | null> {
  const cached = getAssistantArtifact(id, userId);
  if (cached) return cached;

  if (!isSupabaseServiceRoleConfigured()) return null;
  try {
    const supabase = createSupabaseServiceRoleClient();
    const { data: record } = await supabase
      .from("assistant_artifact_records")
      .select("storage_path, filename, mime_type, kind")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (record?.storage_path) {
      const fromIndex = await downloadArtifactAtPath(
        id,
        userId,
        record.storage_path,
        record.kind as "pdf" | "pptx" | "file",
        record.filename,
        record.mime_type,
      );
      if (fromIndex) return fromIndex;
    }

    const candidates = [
      {
        path: `${userId}/${id}.pdf`,
        kind: "pdf" as const,
        mimeType: "application/pdf",
        filename: "document.pdf",
      },
      {
        path: `${userId}/${id}.pptx`,
        kind: "pptx" as const,
        mimeType:
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        filename: "document.pptx",
      },
    ];
    for (const candidate of candidates) {
      const loaded = await downloadArtifactAtPath(
        id,
        userId,
        candidate.path,
        candidate.kind,
        candidate.filename,
        candidate.mimeType,
      );
      if (loaded) return loaded;
    }
    return null;
  } catch {
    return null;
  }
}

/** Recover artifact from a chat message payload (base64 fallback). */
export function hydrateArtifactFromMessagePayload(input: {
  id: string;
  title: string;
  filename: string;
  userId: string;
  contentBase64: string;
  kind?: "pdf" | "pptx" | "file";
  mimeType?: string;
}) {
  const bytes = Buffer.from(input.contentBase64, "base64");
  const kind = input.kind ?? (input.filename.endsWith(".pptx") ? "pptx" : "pdf");
  const mimeType =
    input.mimeType ??
    (kind === "pptx"
      ? "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      : "application/pdf");
  return putAssistantArtifact({
    id: input.id,
    kind,
    title: input.title,
    filename: input.filename,
    mimeType,
    bytes,
    userId: input.userId,
  });
}
