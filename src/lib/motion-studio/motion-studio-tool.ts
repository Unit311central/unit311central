import { toolOk, toolError } from "@/lib/ai-operating-assistant/tool-result";
import type { AssistantToolExecutionContext } from "@/lib/ai-operating-assistant/tool-result";

import { assertMotionStudioAccess } from "./access";
import { buildMotionSpecFromPrompt } from "./pick-template";
import type { MotionStudioSpec } from "./types";
import { assertSceneTimeline, validateMotionStudioSpec } from "./validate";

export const MOTION_STUDIO_TOOL_NAME = "demo.motionStudio.generate";

export const MOTION_STUDIO_TOOL_DEFINITION = {
  name: MOTION_STUDIO_TOOL_NAME,
  description:
    "Demo workspace Content Studio only. Generate a structured, playable Motion Studio animation (16:9 explainer) from a natural-language brief. Use when the user asks to create or animate a product walkthrough, sales workflow, module introduction, or similar motion-style explainer. Returns an interactive in-chat preview — not an MP4 file.",
  parameters: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: "User brief for the animation (topic, duration, style notes).",
      },
      revision: {
        type: "boolean",
        description: "True when regenerating or revising a prior animation request.",
      },
    },
    required: ["prompt"],
    additionalProperties: false,
  },
} as const;

export async function generateMotionStudioTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
) {
  try {
    assertMotionStudioAccess(ctx);
    const prompt =
      typeof args.prompt === "string" && args.prompt.trim()
        ? args.prompt.trim()
        : typeof args.topic === "string"
          ? args.topic.trim()
          : "";
    if (!prompt) {
      return toolError(MOTION_STUDIO_TOOL_NAME, "Describe the animation you want to create.");
    }

    let spec: MotionStudioSpec = buildMotionSpecFromPrompt(prompt);
    spec = validateMotionStudioSpec(spec);
    assertSceneTimeline(spec);

    const revision = args.revision === true;
    const message = revision
      ? "Updated Motion Studio preview is ready — use playback controls to review each scene."
      : "Motion Studio preview is ready — this uses illustrative demo data, not live customer records.";

    return toolOk(MOTION_STUDIO_TOOL_NAME, [], {
      source: ["motion_studio", "demo_template"],
      summary: {
        message,
        motionSpec: spec,
        durationSeconds: Math.round(spec.durationMs / 1000),
        sceneCount: spec.scenes.length,
        fictional: spec.fictional,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Could not generate animation.";
    return toolError(MOTION_STUDIO_TOOL_NAME, msg);
  }
}
