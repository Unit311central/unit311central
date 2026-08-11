/**
 * Executive assistant artifact durability — memory cache + optional Supabase round-trip.
 * Run: npm run test:ea-artifacts
 */
import assert from "node:assert/strict";

import {
  createArtifactId,
  getAssistantArtifact,
  hydrateArtifactFromMessagePayload,
  loadArtifactBytes,
  persistArtifactToStorage,
  putAssistantArtifact,
} from "../artifact-store";
import { isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";

async function main() {
  const userId = "user-artifact-test";
  const bytes = Buffer.from("%PDF-1.4 artifact-test");
  const id = createArtifactId();

  const stored = putAssistantArtifact({
    id,
    kind: "pdf",
    title: "Board Pack",
    filename: "Board Pack.pdf",
    mimeType: "application/pdf",
    bytes,
    userId,
  });

  assert.ok(stored.contentBase64, "putAssistantArtifact should retain base64");
  assert.equal(getAssistantArtifact(id, userId)?.bytes.toString(), bytes.toString());

  const hydrated = hydrateArtifactFromMessagePayload({
    id,
    title: "Board Pack",
    filename: "Board Pack.pdf",
    userId,
    contentBase64: stored.contentBase64!,
  });
  assert.equal(hydrated.bytes.toString(), bytes.toString());
  assert.equal(getAssistantArtifact(id, userId)?.filename, "Board Pack.pdf");

  if (isSupabaseServiceRoleConfigured()) {
    const uploadId = createArtifactId();
    const uploadRecord = putAssistantArtifact({
      id: uploadId,
      kind: "pdf",
      title: "Storage Round Trip",
      filename: "storage-roundtrip.pdf",
      mimeType: "application/pdf",
      bytes: Buffer.from("%PDF-storage-roundtrip"),
      userId,
    });
    await persistArtifactToStorage(uploadRecord);
    getAssistantArtifact(uploadId, userId);
    const loaded = await loadArtifactBytes(uploadId, userId);
    assert.ok(loaded, "loadArtifactBytes should recover uploaded artifact");
    assert.equal(loaded?.bytes.toString(), "%PDF-storage-roundtrip");
    console.log("Supabase artifact storage round-trip passed.");
  } else {
    console.log("Skipped Supabase storage round-trip (SUPABASE_SERVICE_ROLE_KEY not configured).");
  }

  console.log("All executive assistant artifact persistence checks passed.\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
