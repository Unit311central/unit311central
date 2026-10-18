import assert from "node:assert/strict";

import { isMotionStudioRequest } from "../intent";
import { buildMotionSpecFromPrompt, isSalesOpportunityPrompt } from "../pick-template";
import { assertSceneTimeline, validateMotionStudioSpec } from "../validate";
import { generateMotionStudioTool } from "../motion-studio-tool";

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

const demoCtx = {
  business: {
    user: { id: "u1", username: "demo", displayName: "Demo", userType: "internal" },
    organisation: { id: "o1", name: "Demo" },
    workspace: { id: "w1", name: "Demo", slug: "demo" },
    page: { activeView: "executive-assistant", label: "EA" },
    selection: {},
    permissions: {
      roleView: "admin",
      canAccessFinancials: true,
      canAccessUsers: true,
      canAccessStrategy: true,
      canAccessHr: true,
    },
    generatedAt: new Date().toISOString(),
  },
};

async function main() {
  const ok = await generateMotionStudioTool({ prompt: SAMPLE }, demoCtx);
  assert.equal(ok.status, "ok");
  assert.ok((ok.summary as { motionSpec?: unknown })?.motionSpec);

  const denied = await generateMotionStudioTool({ prompt: SAMPLE }, {
    business: { ...demoCtx.business, workspace: { ...demoCtx.business.workspace, slug: "unit311" } },
  });
  assert.equal(denied.status, "error");

  console.log("motion-studio.check: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
