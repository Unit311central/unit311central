/**
 * Executive assistant artifact durability — memory cache + hydration.
 * Run: npm run test:ea-artifacts
 */
import assert from "node:assert/strict";

import {
  createArtifactId,
  getAssistantArtifact,
  hydrateArtifactFromMessagePayload,
  putAssistantArtifact,
} from "../artifact-store";

function main() {
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

  console.log("All executive assistant artifact persistence checks passed.\n");
}

main();
