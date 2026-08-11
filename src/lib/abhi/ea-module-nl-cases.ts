export { buildWorkspaceNlSuite, type EaWorkspaceNlCase } from "@/lib/ai-operating-assistant/ea-workspace-nl-cases";

import { buildWorkspaceNlSuite } from "@/lib/ai-operating-assistant/ea-workspace-nl-cases";

export type AbhiModuleNlCase = {
  id: string;
  prompt: string;
  moduleLabel: string;
};

/** @deprecated Use buildWorkspaceNlSuite("abhi").moduleCases */
export function buildAbhiModuleNlCases(): AbhiModuleNlCase[] {
  return buildWorkspaceNlSuite("abhi").moduleCases.map((row) => ({
    id: row.id,
    prompt: row.prompt,
    moduleLabel: row.targetLabel,
  }));
}
