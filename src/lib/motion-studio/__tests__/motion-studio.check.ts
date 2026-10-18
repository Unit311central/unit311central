import assert from "node:assert/strict";

import { ensureEaClientWorkspacePacksRegistered } from "@/lib/ai-operating-assistant/workspace-packs/client-bootstrap";
import { resolveEaSuggestedPromptsFromPack } from "@/lib/ai-operating-assistant/workspace-packs/registry-client";
import { demoWorkspacePack } from "@/lib/ai-operating-assistant/workspace-packs/demo-pack";
import { MOTION_STUDIO_TOOL_DEFINITION, MOTION_STUDIO_TOOL_NAME } from "../motion-studio-tool";
import { isMotionStudioRequest } from "../intent";
import { buildMotionSpecFromPrompt, isSalesOpportunityPrompt } from "../pick-template";
import { assertSceneTimeline, validateMotionStudioSpec } from "../validate";
import { generateMotionStudioTool } from "../motion-studio-tool";
import { canUseMotionStudioInBusinessContext, filterMotionStudioToolDefinitions } from "../access";

const SAMPLE =
  "Create a 30-second animated walkthrough explaining how Unit311Central manages a sales opportunity, from initial contact through deal closure.";

assert.equal(isMotionStudioRequest(SAMPLE), true);
assert.equal(isSalesOpportunityPrompt(SAMPLE), true);

const spec = buildMotionSpecFromPrompt(SAMPLE);
assert.equal(spec.durationMs, 30_000);
assert.equal(spec.scenes.length, 5);
assert.equal(spec.fictional, true);
for (const scene of spec.scenes) {
  assert.ok(scene.elements.length >= 2);
  assert.ok(scene.endMs > scene.startMs);
}
assertSceneTimeline(spec);

const bad = { version: 1, title: "x", durationMs: 30_000, aspectRatio: "16:9", fictional: true, promptEcho: "x", scenes: [] };
assert.throws(() => validateMotionStudioSpec(bad));

function demoBusiness(activeView: string) {
  return {
    user: { id: "u1", username: "demo", displayName: "Demo", userType: "internal" as const },
    organisation: { id: "o1", name: "Demo" },
    workspace: { id: "w1", name: "Demo", slug: "demo" },
    page: { activeView, label: activeView },
    selection: {},
    permissions: {
      roleView: "admin",
      canAccessFinancials: true,
      canAccessUsers: true,
      canAccessStrategy: true,
      canAccessHr: true,
    },
    generatedAt: new Date().toISOString(),
  };
}

const contentStudioCtx = { business: demoBusiness("content-studio") };
const globalEaCtx = { business: demoBusiness("executive-assistant") };

async function main() {
  ensureEaClientWorkspacePacksRegistered();
  const contentStudioPrompts = resolveEaSuggestedPromptsFromPack(demoWorkspacePack, "content-studio", {
    label: "Content Studio",
    suggestedPrompts: [],
  }).suggestedPrompts;
  assert.ok(
    contentStudioPrompts.some((p) => /30-second animated walkthrough/i.test(p)),
    "Content Studio EA should surface Motion Studio sample prompt",
  );

  assert.equal(canUseMotionStudioInBusinessContext(contentStudioCtx.business), true);
  assert.equal(canUseMotionStudioInBusinessContext(globalEaCtx.business), false);

  const ok = await generateMotionStudioTool({ prompt: SAMPLE }, contentStudioCtx);
  assert.equal(ok.status, "ok");
  assert.ok((ok.summary as { motionSpec?: unknown })?.motionSpec);

  const wrongView = await generateMotionStudioTool({ prompt: SAMPLE }, globalEaCtx);
  assert.equal(wrongView.status, "error");

  const denied = await generateMotionStudioTool({ prompt: SAMPLE }, {
    business: { ...contentStudioCtx.business, workspace: { ...contentStudioCtx.business.workspace, slug: "unit311" } },
  });
  assert.equal(denied.status, "error");

  const motionResolver = demoWorkspacePack.intentResolvers?.[0];
  assert.ok(motionResolver);

  const contentStudioRoute = await motionResolver({
    message: SAMPLE,
    business: contentStudioCtx.business,
    history: [],
  });
  assert.equal(contentStudioRoute?.kind, "tool");
  assert.equal(
    contentStudioRoute && contentStudioRoute.kind === "tool" ? contentStudioRoute.intent.tool : null,
    MOTION_STUDIO_TOOL_NAME,
  );

  const globalEaRoute = await motionResolver({
    message: SAMPLE,
    business: globalEaCtx.business,
    history: [],
  });
  assert.equal(globalEaRoute?.kind, "capability_answer");

  const stubPackTools = [{ name: "northstar.getOrgHealth" }, MOTION_STUDIO_TOOL_DEFINITION];
  const toolsInContentStudio = filterMotionStudioToolDefinitions(stubPackTools, "content-studio").map(
    (t) => t.name,
  );
  assert.ok(toolsInContentStudio.includes(MOTION_STUDIO_TOOL_NAME));

  const toolsOnGlobalEa = filterMotionStudioToolDefinitions(stubPackTools, "executive-assistant").map(
    (t) => t.name,
  );
  assert.ok(!toolsOnGlobalEa.includes(MOTION_STUDIO_TOOL_NAME));

  console.log("motion-studio.check: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
