/**
 * Run a single Northstar EA test question (orchestration + tool execution).
 */

import "server-only";

import { runEaAcceptanceCase } from "@/lib/ea-acceptance/execute-case";
import type { EaAcceptanceCheck } from "@/lib/ea-acceptance/types";
import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import type { NorthstarEaTestQuestion } from "@/lib/demo/ea-module-test-bank";

export type NorthstarEaQuestionResult = {
  id: string;
  prompt: string;
  moduleLabel: string;
  subModuleLabel?: string;
  status: "pass" | "fail";
  routeKind: string;
  capabilityId?: string;
  tool?: string;
  deterministic?: boolean;
  gptRequired?: boolean;
  summary?: string;
  checks?: EaAcceptanceCheck[];
  durationMs: number;
  error?: string;
};

export async function runNorthstarEaTestQuestion(
  question: NorthstarEaTestQuestion,
  business: AssistantBusinessContext,
): Promise<NorthstarEaQuestionResult> {
  const result = await runEaAcceptanceCase(
    {
      id: question.id,
      prompt: question.prompt,
      kind: question.kind,
      expectTool: question.expectTool,
      moduleLabel: question.moduleLabel,
      subModuleLabel: question.subModuleLabel,
      viewId: question.viewId,
    },
    business,
  );

  return {
    id: result.id,
    prompt: result.prompt,
    moduleLabel: question.moduleLabel,
    subModuleLabel: question.subModuleLabel,
    status: result.status,
    routeKind: result.routeKind,
    capabilityId: result.capabilityId,
    tool: result.tool,
    deterministic: result.deterministic,
    gptRequired: result.gptRequired,
    summary: result.summary,
    checks: result.checks,
    durationMs: result.durationMs,
    error: result.error,
  };
}
