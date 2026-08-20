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
const FOLLOW_UP = "Use the board meeting on 20 March 2026.";

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

  const first = await executeAssistantTool(route.intent!.tool, route.intent!.args ?? {}, business);
  assert.equal(first.status, "ok");
  assert.equal(first.summary?.needsMeetingDate, true, "first turn asks for meeting date");

  const secondRoute = await resolveOrchestrationRoute(FOLLOW_UP, [{ role: "assistant", content: String(first.summary?.message), id: "a1", createdAt: new Date().toISOString() }], business);
  const second =
    secondRoute.kind === "tool" && secondRoute.intent.tool === "boardpack.generate"
      ? await executeAssistantTool(secondRoute.intent.tool, { ...secondRoute.intent.args, meetingDate: "2026-03-20" }, business)
      : await executeAssistantTool("boardpack.generate", { meetingDate: "2026-03-20", when: FOLLOW_UP }, business);

  process.env.EA_SKIP_BOARDPACK_STAGES = "1";
  assert.equal(second.status, "ok");
  assert.equal(second.summary?.executed, true);

  const artifactId = String(second.summary?.artifactId ?? "");
  assert.match(artifactId, /^art_/);

  const extracted = extractArtifactsFromToolResult(second, "boardpack.generate", business.user.id);
  assert.equal(extracted.artifacts.length >= 1, true);
  assert.equal(extracted.artifacts[0]!.id, artifactId);
  assert.match(extracted.artifacts[0]!.openUrl, new RegExp(artifactId));
  assert.match(extracted.artifacts[0]!.openUrl, /disposition=inline/);

  const cards = cardsFromBoardPackSuccess({
    packName: String(second.summary?.packName ?? "Board Pack"),
    meetingDate: String(second.summary?.meetingDate ?? "2026-03-20"),
    status: String(second.summary?.status ?? "Draft"),
    folderPath: String(second.summary?.folderPath ?? ""),
    boardDeckHref: String(second.summary?.boardDeckHref ?? "/dashboard?view=board-pack"),
    pdfOpenUrl: String(second.summary?.pdfOpenUrl ?? ""),
    pdfDownloadUrl: String(second.summary?.pdfDownloadUrl ?? ""),
    pptxDownloadUrl: String(second.summary?.pptxDownloadUrl ?? ""),
  });
  const preview = cards[0]?.actions?.find((a) => a.intent === "open");
  assert.ok(preview, "UI must expose open/preview action");
  assert.match(String(preview?.href), new RegExp(artifactId));

  const pdfItem = (second.items ?? []).find((i) => i.kind === "pdf" || String(i.filename ?? "").endsWith(".pdf"));
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
