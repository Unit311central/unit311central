import type { MotionElement, MotionScene, MotionStudioSpec } from "@/lib/motion-studio/types";

export type InstructionalAnimationStep = {
  id: string;
  heading: string;
  body: string;
  narration?: string;
};

export type InstructionalAnimationContent = {
  type: "instructional_animation";
  title?: string;
  synopsis?: string;
  steps: InstructionalAnimationStep[];
  spec: MotionStudioSpec;
};

const MS_PER_STEP = 5200;

function pickAnimationKind(
  steps: InstructionalAnimationStep[],
): "pipeline" | "workflow" | "cards" {
  const blob = steps.map((s) => `${s.heading} ${s.body}`).join(" ").toLowerCase();
  if (/\b(step|stage|phase|workflow|process|escalat|timeline|sequence)\b/.test(blob)) {
    return "pipeline";
  }
  if (/\b(compare|versus|vs\.|difference|before|after)\b/.test(blob) && steps.length >= 2) {
    return "workflow";
  }
  return "cards";
}

function sceneElementsForStep(
  step: InstructionalAnimationStep,
  index: number,
  total: number,
  kind: "pipeline" | "workflow" | "cards",
  allSteps: InstructionalAnimationStep[],
): MotionElement[] {
  const elements: MotionElement[] = [
    { type: "caption", text: `Step ${index + 1} of ${total}`, emphasis: "normal" },
    { type: "title", text: step.heading, subtitle: step.narration || step.body.slice(0, 120) },
  ];

  if (kind === "pipeline" && index === 0) {
    elements.push({
      type: "pipeline",
      stages: allSteps.map((s) => s.heading.slice(0, 42)),
      activeIndex: 0,
      valueLabel: step.heading,
    });
  } else if (kind === "pipeline") {
    elements.push({
      type: "pipeline",
      stages: allSteps.map((s) => s.heading.slice(0, 42)),
      activeIndex: index,
      valueLabel: step.body.slice(0, 160),
    });
  } else if (kind === "workflow" && index > 0) {
    const prev = allSteps[index - 1]!;
    elements.push({
      type: "workflow_link",
      from: prev.heading.slice(0, 48),
      to: step.heading.slice(0, 48),
      note: step.body.slice(0, 100),
    });
  }

  elements.push({
    type: "card",
    title: step.heading,
    body: step.body,
    tone: index === total - 1 ? "success" : "accent",
  });

  if (step.body.length > 80) {
    elements.push({
      type: "metric",
      label: "Key point",
      value: `${index + 1}/${total}`,
      hint: step.body.slice(0, 200),
    });
  }

  return elements;
}

/** Build a Motion Studio spec from instructional steps (framer-motion player — no external providers). */
export function buildInstructionalAnimationSpec(input: {
  title: string;
  steps: InstructionalAnimationStep[];
  promptEcho?: string;
}): MotionStudioSpec {
  const steps = input.steps.filter((s) => s.heading.trim() && s.body.trim());
  if (!steps.length) {
    throw new Error("Instructional animation requires at least one step.");
  }

  const kind = pickAnimationKind(steps);
  const durationMs = Math.max(12_000, steps.length * MS_PER_STEP);
  const slice = Math.floor(durationMs / steps.length);

  const scenes: MotionScene[] = steps.map((step, index) => ({
    id: step.id || `step_${index + 1}`,
    title: step.heading,
    startMs: index * slice,
    endMs: index === steps.length - 1 ? durationMs : (index + 1) * slice,
    narration: step.narration || step.body,
    elements: sceneElementsForStep(step, index, steps.length, kind, steps),
  }));

  return {
    version: 1,
    title: input.title,
    durationMs,
    aspectRatio: "16:9",
    fictional: false,
    promptEcho: input.promptEcho || input.title,
    scenes,
  };
}

export function buildInstructionalAnimationContent(input: {
  title: string;
  synopsis?: string;
  steps: InstructionalAnimationStep[];
  promptEcho?: string;
}): InstructionalAnimationContent {
  const spec = buildInstructionalAnimationSpec(input);
  return {
    type: "instructional_animation",
    title: input.title,
    synopsis: input.synopsis,
    steps: input.steps,
    spec,
  };
}

export function isInstructionalAnimationComplete(
  content: unknown,
): content is InstructionalAnimationContent {
  if (!content || typeof content !== "object") return false;
  const c = content as InstructionalAnimationContent;
  return (
    c.type === "instructional_animation" &&
    Array.isArray(c.steps) &&
    c.steps.length >= 1 &&
    Boolean(c.spec?.scenes?.length)
  );
}
