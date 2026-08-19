/**
 * EA execution path telemetry — deterministic vs GPT-Terra.
 */

import { eaStage } from "@/lib/ai-operating-assistant/ea-forensic-trace";

export type EaExecutionPath = "deterministic" | "gpt_terra" | "hybrid";

export type EaExecutionTelemetryEvent = {
  path: EaExecutionPath;
  capabilityId?: string | null;
  tool?: string | null;
  module?: string | null;
  workspaceSlug?: string | null;
  workspaceId?: string | null;
  userId?: string | null;
  escalationReason?: string | null;
  responseType?: "text" | "kpi" | "chart" | "table" | "pdf" | "action" | "clarification";
  gptCallCount?: number;
  at: string;
};

const recentEvents: EaExecutionTelemetryEvent[] = [];
const MAX_RECENT = 200;

export function recordEaExecutionTelemetry(event: Omit<EaExecutionTelemetryEvent, "at">): void {
  const row: EaExecutionTelemetryEvent = { ...event, at: new Date().toISOString() };
  recentEvents.push(row);
  if (recentEvents.length > MAX_RECENT) recentEvents.shift();

  eaStage("EA execution telemetry", {
    path: row.path,
    capabilityId: row.capabilityId ?? null,
    tool: row.tool ?? null,
    module: row.module ?? null,
    workspaceSlug: row.workspaceSlug ?? null,
    escalationReason: row.escalationReason ?? null,
    responseType: row.responseType ?? null,
    gptCallCount: row.gptCallCount ?? 0,
  });
}

export function getRecentEaExecutionTelemetry(): readonly EaExecutionTelemetryEvent[] {
  return recentEvents;
}

export function resetEaExecutionTelemetryForTests(): void {
  recentEvents.length = 0;
}
