/**
 * Short-lived in-memory store for assistant-generated artifacts (PDFs).
 * Survives within a single Node process for download/email during the session.
 */

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
};

const artifacts = new Map<string, AssistantStoredArtifact>();
const MAX_ARTIFACTS = 40;

export function putAssistantArtifact(
  input: Omit<AssistantStoredArtifact, "createdAt"> & { createdAt?: string },
): AssistantStoredArtifact {
  const record: AssistantStoredArtifact = {
    ...input,
    createdAt: input.createdAt ?? new Date().toISOString(),
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

export function createArtifactId() {
  return `art_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
