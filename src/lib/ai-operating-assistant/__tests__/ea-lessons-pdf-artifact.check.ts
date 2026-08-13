/**
 * Regression: Talanton lessons PDF must surface Open/Download artifacts in EA chat.
 */
import assert from "node:assert/strict";
import { extractArtifactsFromToolResult } from "@/lib/ai-operating-assistant/assistant-runtime";
import { generateTalantonStoriesLessonsPdfTool } from "@/lib/ai-operating-assistant/talanton-executive-tools";
import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";

function talantonBusiness(): AssistantBusinessContext {
  return {
    user: {
      id: "u-test",
      username: "harry@talantonimpact.com",
      displayName: "Harry Turner",
      userType: "operator",
    },
    organisation: { id: "org-ti", name: "Talanton Impact" },
    workspace: { id: "ws-ti", name: "Talanton Impact", slug: "talantonimpact" },
    page: { activeView: "executive-assistant", label: "Executive Assistant" },
    selection: {},
    permissions: {
      roleView: "executive",
      canAccessFinancials: true,
      canAccessUsers: true,
      canAccessStrategy: true,
      canAccessHr: true,
    },
    generatedAt: new Date().toISOString(),
  };
}

const PROMPT =
  "Review the field stories and identify the three most important lessons or recurring themes that management should be aware of as a pdf";

async function main() {
  const toolResult = await generateTalantonStoriesLessonsPdfTool(
    {
      companyIds: "all",
      storyTypes: "both",
      statusFilter: "include_review",
      categories: "all",
      outputFormat: "pdf",
      question: PROMPT,
    },
    { business: talantonBusiness() },
  );

  assert.equal(toolResult.status, "ok");
  assert.ok(toolResult.summary?.artifactId, "tool must return artifactId");
  assert.ok(toolResult.summary?.openUrl, "tool must return openUrl");
  assert.ok(toolResult.summary?.downloadUrl, "tool must return downloadUrl");

  const extracted = extractArtifactsFromToolResult(
    toolResult,
    "talanton.generateStoriesLessonsPdf",
  );

  assert.equal(extracted.errorText, null);
  assert.ok(extracted.successText?.includes("PDF report generated"), "prose preserved");
  assert.equal(extracted.artifacts.length, 1, "must expose one PDF artifact to the UI");
  const artifact = extracted.artifacts[0]!;
  assert.match(artifact.id, /^art_/);
  assert.match(artifact.openUrl, /disposition=inline/);
  assert.match(artifact.downloadUrl, /disposition=attachment/);
  assert.ok(artifact.filename.endsWith(".pdf"));

  console.log("PASS ea-lessons-pdf-artifact — UI artifact extraction for lessons PDF");
}

main().catch((err) => {
  console.error("FAIL ea-lessons-pdf-artifact", err);
  process.exit(1);
});
