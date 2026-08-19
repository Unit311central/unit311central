import { resolveOrchestrationRoute } from "./action-orchestration";
import {
  answerPlatformQuestion,
  searchApplicationCatalogue,
} from "./application-catalogue";
import { isGenericCatalogueAnswer } from "@/lib/ea-acceptance/assertions";
import type { EaWorkspaceNlCase } from "./ea-workspace-nl-cases";
import type { AssistantBusinessContext } from "./types";

export async function assertWorkspaceNlCase(
  row: EaWorkspaceNlCase,
  business: AssistantBusinessContext,
): Promise<void> {
  const options = { workspaceSlug: business.workspace.slug };
  const route = await resolveOrchestrationRoute(row.prompt, [], business);

  if (row.kind === "module" || row.kind === "page") {
    const navigationOk =
      route.kind === "platform_answer" ||
      (route.kind === "tool" && route.intent.tool === "searchApplications");
    if (!navigationOk) {
      const answered = answerPlatformQuestion(row.prompt, options);
      const hits = searchApplicationCatalogue(row.prompt, 5, options);
      const catalogueHit = hits.some((hit) => {
        if (row.kind === "module") {
          return (
            hit.entry.module.displayName === row.targetLabel ||
            hit.entry.module.label === row.targetLabel
          );
        }
        if (hit.entry.kind === "page") return hit.entry.page.label === row.targetLabel;
        if (hit.entry.kind === "application") return hit.entry.application.label === row.targetLabel;
        return hit.entry.module.displayName === row.targetLabel;
      });
      if (!catalogueHit && !answered) {
        throw new Error(`no navigation or catalogue answer for ${row.prompt}`);
      }
      if (answered && isGenericCatalogueAnswer(answered.answer)) {
        throw new Error(`catalogue answer for ${row.prompt} is too generic`);
      }
      return;
    }

    if (route.kind === "platform_answer" && isGenericCatalogueAnswer(route.message)) {
      throw new Error(`platform answer for ${row.prompt} is generic catalogue copy`);
    }
    return;
  }

  throw new Error(`unsupported NL case kind ${row.kind}`);
}
