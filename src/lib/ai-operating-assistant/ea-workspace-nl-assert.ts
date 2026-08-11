import { resolveOrchestrationRoute } from "./action-orchestration";
import {
  answerPlatformQuestion,
  searchApplicationCatalogue,
} from "./application-catalogue";
import type { EaWorkspaceNlCase } from "./ea-workspace-nl-cases";
import type { AssistantBusinessContext } from "./types";

export async function assertWorkspaceNlCase(
  row: EaWorkspaceNlCase,
  business: AssistantBusinessContext,
): Promise<void> {
  const options = { workspaceSlug: business.workspace.slug };
  const answered = answerPlatformQuestion(row.prompt, options);
  const hits = searchApplicationCatalogue(row.prompt, 5, options);
  const route = await resolveOrchestrationRoute(row.prompt, [], business);
  const okRoute =
    route.kind === "platform_answer" ||
    route.kind === "tool" ||
    route.kind === "capability_answer";
  const okCatalogue =
    answered != null ||
    hits.some((hit) => {
      if (row.kind === "module") {
        return (
          hit.entry.module.displayName === row.targetLabel ||
          hit.entry.module.label === row.targetLabel
        );
      }
      if (hit.entry.kind === "page") return hit.entry.page.label === row.targetLabel;
      if (hit.entry.kind === "application") {
        return hit.entry.application.label === row.targetLabel;
      }
      return hit.entry.module.displayName === row.targetLabel;
    });
  if (!okRoute && !okCatalogue) {
    throw new Error(`no catalogue or orchestration answer for ${row.prompt}`);
  }
}
