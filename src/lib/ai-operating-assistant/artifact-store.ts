/**
 * Durable assistant artifacts — memory cache + Supabase Storage + base64 fallback.
 */

import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/server";

export type AssistantStoredArtifact = {
  id: string;
  kind: "pdf";
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

export async function persistArtifactToStorage(
  record: AssistantStoredArtifact,
): Promise<AssistantStoredArtifact> {
  if (!isSupabaseServiceRoleConfigured()) return record;
  try {
    const supabase = createSupabaseServiceRoleClient();
    const path = `${record.userId}/${record.id}.pdf`;
    await supabase.storage.createBucket(BUCKET, { public: false }).catch(() => undefined);
    const { error } = await supabase.storage.from(BUCKET).upload(path, record.bytes, {
      contentType: record.mimeType,
      upsert: true,
    });
    if (error) return record;
    const updated = { ...record, storagePath: path };
    artifacts.set(record.id, updated);
    return updated;
  } catch {
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

export async function loadArtifactBytes(
  id: string,
  userId: string,
): Promise<AssistantStoredArtifact | null> {
  const cached = getAssistantArtifact(id, userId);
  if (cached) return cached;

  if (!isSupabaseServiceRoleConfigured()) return null;
  try {
    const supabase = createSupabaseServiceRoleClient();
    const path = `${userId}/${id}.pdf`;
    const { data, error } = await supabase.storage.from(BUCKET).download(path);
    if (error || !data) return null;
    const buffer = Buffer.from(await data.arrayBuffer());
    return putAssistantArtifact({
      id,
      kind: "pdf",
      title: "Employee Directory",
      filename: `unit311-employee-directory.pdf`,
      mimeType: "application/pdf",
      bytes: buffer,
      userId,
      storagePath: path,
    });
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
}) {
  const bytes = Buffer.from(input.contentBase64, "base64");
  return putAssistantArtifact({
    id: input.id,
    kind: "pdf",
    title: input.title,
    filename: input.filename,
    mimeType: "application/pdf",
    bytes,
    userId: input.userId,
  });
}
