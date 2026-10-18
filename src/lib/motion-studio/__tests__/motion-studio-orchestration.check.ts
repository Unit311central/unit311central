/**
 * Motion Studio orchestration priority — resolveOrchestrationRoute must win over investigation/semantic.
 * Run: node --require ./scripts/test-server-only-hook.cjs --import tsx src/lib/motion-studio/__tests__/motion-studio-orchestration.check.ts
 */
import assert from "node:assert/strict";

import { resolveOrchestrationRoute } from "@/lib/ai-operating-assistant/action-orchestration";
import { MOTION_STUDIO_TOOL_NAME } from "@/lib/motion-studio/motion-studio-tool";
import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";

const ANIMATION_PROMPT =
  "Create a 30-second animated walkthrough explaining how Unit311Central manages a sales opportunity, from initial contact through deal closure.";

const SALES_EXPLAIN_PROMPT =
  "Explain in writing how Northstar manages a sales opportunity from initial contact through deal closure for the board.";

const MARGIN_PROMPT = "Why did margin fall?";

function demoBusiness(activeView: string, slug = DEMO_WORKSPACE_SLUG) {
  return {
    user: { id: "u1", username: "demo", displayName: "Demo", userType: "internal" as const },
    organisation: { id: "o1", name: "Demo" },
    workspace: { id: "w1", name: "Demo", slug },
    page: { activeView, label: activeView },
    selection: {},
    permissions: {
      roleView: "admin" as const,
      canAccessFinancials: true,
      canAccessUsers: true,
      canAccessStrategy: true,
      canAccessHr: true,
      roles: [] as string[],
      departments: [] as string[],
      allowedViews: null,
      readOnlyMode: false,
    },
    generatedAt: new Date().toISOString(),
  };
}

async function main() {
  const contentStudio = demoBusiness("content-studio");
  const globalEa = demoBusiness("executive-assistant");
  const wrongWorkspace = demoBusiness("content-studio", "unit311");

  const motionRoute = await resolveOrchestrationRoute(ANIMATION_PROMPT, [], contentStudio);
  assert.equal(motionRoute.kind, "tool");
  assert.equal(motionRoute.intent?.tool, MOTION_STUDIO_TOOL_NAME);
  assert.equal(motionRoute.intent?.reason, "motion_studio");
  assert.equal(motionRoute.skipSynthesis, true);

  const salesRoute = await resolveOrchestrationRoute(SALES_EXPLAIN_PROMPT, [], contentStudio);
  assert.notEqual(
    salesRoute.kind === "tool" && salesRoute.intent?.tool === MOTION_STUDIO_TOOL_NAME,
    true,
    "plain sales explanation must not route to Motion Studio",
  );

  const deniedView = await resolveOrchestrationRoute(ANIMATION_PROMPT, [], globalEa);
  assert.equal(deniedView.kind, "capability_answer");
  assert.match(String(deniedView.message ?? ""), /Content Studio/i);

  const deniedWorkspace = await resolveOrchestrationRoute(ANIMATION_PROMPT, [], wrongWorkspace);
  assert.equal(deniedWorkspace.kind, "capability_answer");
  assert.match(String(deniedWorkspace.message ?? ""), /demo workspace/i);

  const marginRoute = await resolveOrchestrationRoute(MARGIN_PROMPT, [], contentStudio);
  if (marginRoute.kind === "tool") {
    assert.notEqual(marginRoute.intent.tool, MOTION_STUDIO_TOOL_NAME);
  }
  assert.ok(
    marginRoute.kind === "tool" ||
      marginRoute.kind === "evidence_gpt" ||
      marginRoute.kind === "semantic_answer" ||
      marginRoute.kind === "capability_answer",
    `expected normal EA route for margin question, got ${marginRoute.kind}`,
  );

  console.log("motion-studio-orchestration.check: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
