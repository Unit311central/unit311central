/** Structured animation spec — safe to render with fixed React components only. */

export type MotionAspectRatio = "16:9";

export type MotionElement =
  | { type: "title"; text: string; subtitle?: string }
  | { type: "caption"; text: string; emphasis?: "demo" | "normal" }
  | {
      type: "card";
      title: string;
      body?: string;
      badge?: string;
      tone?: "neutral" | "accent" | "success";
    }
  | {
      type: "entity_row";
      label: string;
      value: string;
      meta?: string;
    }
  | {
      type: "pipeline";
      stages: string[];
      activeIndex: number;
      valueLabel?: string;
    }
  | { type: "metric"; label: string; value: string; hint?: string }
  | { type: "arrow"; label?: string }
  | {
      type: "workflow_link";
      from: string;
      to: string;
      note?: string;
    };

export type MotionScene = {
  id: string;
  title: string;
  startMs: number;
  endMs: number;
  narration?: string;
  elements: MotionElement[];
};

export type MotionStudioSpec = {
  version: 1;
  title: string;
  durationMs: number;
  aspectRatio: MotionAspectRatio;
  /** True when content is illustrative demo data, not live CRM. */
  fictional: boolean;
  promptEcho: string;
  scenes: MotionScene[];
};

export type MotionStudioPreviewPayload = MotionStudioSpec & {
  id: string;
};
