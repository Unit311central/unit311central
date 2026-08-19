import {
  businessContextForWorkspace,
  EA_ACCEPTANCE_WORKSPACES,
} from "./workspace-context";
import { runEaAcceptanceCase } from "./execute-case";
import { buildMandatoryAcceptanceScenarios } from "./scenarios";
import type { EaAcceptanceCaseResult } from "./types";

export type EaAcceptanceSuiteReport = {
  suite: "ea-acceptance";
  version: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  passed: number;
  failed: number;
  total: number;
  ok: boolean;
  workspaces: Array<{
    slug: string;
    passed: number;
    failed: number;
    cases: EaAcceptanceCaseResult[];
  }>;
};

const SUITE_VERSION = "ea-acceptance-v1";

export async function runEaAcceptanceSuite(input?: {
  workspaceSlugs?: string[];
  executeTools?: boolean;
}): Promise<EaAcceptanceSuiteReport> {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const slugs = input?.workspaceSlugs?.length
    ? input.workspaceSlugs
    : [...EA_ACCEPTANCE_WORKSPACES];
  const executeTools =
    input?.executeTools ?? process.env.EA_ACCEPTANCE_LIVE === "1";

  const workspaces: EaAcceptanceSuiteReport["workspaces"] = [];
  let passed = 0;
  let failed = 0;

  for (const slug of slugs) {
    const business = businessContextForWorkspace(slug);
    const scenarios = buildMandatoryAcceptanceScenarios(slug);
    const cases: EaAcceptanceCaseResult[] = [];

    for (const scenario of scenarios) {
      const result = await runEaAcceptanceCase(
        {
          id: scenario.id,
          prompt: scenario.prompt,
          kind: scenario.kind,
          expectCapabilityId: scenario.expectCapabilityId,
          expectTool: scenario.expectTool,
          expectDeterministic: scenario.expectDeterministic,
          moduleLabel: scenario.moduleLabel,
        },
        business,
        { executeTools },
      );
      cases.push(result);
      if (result.status === "pass") passed += 1;
      else failed += 1;
    }

    workspaces.push({
      slug,
      passed: cases.filter((row) => row.status === "pass").length,
      failed: cases.filter((row) => row.status === "fail").length,
      cases,
    });
  }

  const finishedAt = new Date().toISOString();
  return {
    suite: "ea-acceptance",
    version: SUITE_VERSION,
    startedAt,
    finishedAt,
    durationMs: Date.now() - t0,
    passed,
    failed,
    total: passed + failed,
    ok: failed === 0,
    workspaces,
  };
}
