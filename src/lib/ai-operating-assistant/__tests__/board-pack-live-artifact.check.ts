/**
 * Board pack live-chat artifact contract — routing, artifactId, PDF substance.
 * Run: node --require ./scripts/test-server-only-hook.cjs --import tsx src/lib/ai-operating-assistant/__tests__/board-pack-live-artifact.check.ts
 */
import assert from "node:assert/strict";

import { registerAllActionModules } from "@/lib/ai-operating-assistant/actions/register-all-modules";
import { resolveOrchestrationRoute } from "@/lib/ai-operating-assistant/action-orchestration";
import { extractArtifactsFromToolResult } from "@/lib/ai-operating-assistant/assistant-runtime";
import { cardsFromBoardPackSuccess } from "@/lib/ai-operating-assistant/execution-card-adapters";
import { executeAssistantTool } from "@/lib/ai-operating-assistant/tool-service";
import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { classifyExecutiveTask } from "@/lib/central-application-model/executive-task";

const PROMPT = "Create me a board pack PDF with a button to view it.";

function demoBusiness() {
  return {
    user: { id: "u-demo", username: "ceo@demo.com", displayName: "CEO", userType: "internal" },
    organisation: { id: "org-demo", name: "Northstar Demo" },
    workspace: { id: "ws-demo", name: "Demo", slug: DEMO_WORKSPACE_SLUG },
    page: { activeView: "executive-assistant", label: "EA" },
    selection: {},
    permissions: {
      roleView: "executive" as const,
      canAccessFinancials: true,
      canAccessUsers: true,
      canAccessStrategy: true,
      canAccessHr: true,
    },
    generatedAt: new Date().toISOString(),
  };
}

async function main() {
  registerAllActionModules();
  const business = demoBusiness();

  assert.equal(classifyExecutiveTask(PROMPT), null, "board pack must not use executive-task handler");

  const route = await resolveOrchestrationRoute(PROMPT, [], business);
  assert.equal(route.kind, "tool");
  assert.equal(route.intent?.tool, "boardpack.generate");

  process.env.EA_SKIP_BOARDPACK_STAGES = "1";
  const first = await executeAssistantTool(route.intent!.tool, route.intent!.args ?? {}, business);
  assert.equal(first.status, "ok");
  assert.equal(first.summary?.executed, true, "first turn should auto-pick next board meeting");
  assert.ok(first.summary?.artifactId, "artifact on first turn");

  const artifactId = String(first.summary?.artifactId ?? "");
  assert.match(artifactId, /^art_/);

  const extracted = extractArtifactsFromToolResult(first, "boardpack.generate", business.user.id);
  assert.equal(extracted.artifacts.length >= 1, true);
  assert.equal(extracted.artifacts[0]!.id, artifactId);
  assert.match(extracted.artifacts[0]!.openUrl, new RegExp(artifactId));
  assert.match(extracted.artifacts[0]!.openUrl, /disposition=inline/);

  const cards = cardsFromBoardPackSuccess({
    packName: String(first.summary?.packName ?? "Board Pack"),
    meetingDate: String(first.summary?.meetingDate ?? "2026-03-20"),
    status: String(first.summary?.status ?? "Draft"),
    folderPath: String(first.summary?.folderPath ?? ""),
    boardDeckHref: String(first.summary?.boardDeckHref ?? "/dashboard?view=board-pack"),
    pdfOpenUrl: String(first.summary?.pdfOpenUrl ?? ""),
    pdfDownloadUrl: String(first.summary?.pdfDownloadUrl ?? ""),
    pptxDownloadUrl: String(first.summary?.pptxDownloadUrl ?? ""),
  });
  const preview = cards[0]?.actions?.find((a) => a.label === "View PDF");
  assert.ok(preview, "UI must expose View PDF action");
  assert.match(String(preview?.href), new RegExp(artifactId));

  const pdfItem = (first.items ?? []).find((i) => i.kind === "pdf" || String(i.filename ?? "").endsWith(".pdf"));
  assert.ok(pdfItem?.contentBase64, "PDF bytes required");
  const pdfBytes = Buffer.from(String(pdfItem.contentBase64), "base64");
  assert.ok(pdfBytes.length > 50_000, `substantive PDF (${pdfBytes.length} bytes)`);
  const pdfText = pdfBytes.toString("latin1");
  assert.match(pdfText, /Executive Summary/i);
  assert.match(pdfText, /Risk Register/i);
  assert.match(pdfText, /Strategic Discussion/i);
  assert.doesNotMatch(pdfText, /Included: none/i);
  delete process.env.EA_SKIP_BOARDPACK_STAGES;

  console.log("PASS board-pack-live-artifact — route, artifactId, preview action, substantive PDF");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
