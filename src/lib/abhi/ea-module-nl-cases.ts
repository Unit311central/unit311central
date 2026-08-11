import { listPlatformModules } from "@/lib/ai-operating-assistant/application-catalogue";

export type AbhiModuleNlCase = {
  id: string;
  prompt: string;
  moduleLabel: string;
};

/** Natural-language prompts that should resolve to each ABHI workspace module. */
export function buildAbhiModuleNlCases(): AbhiModuleNlCase[] {
  const modules = listPlatformModules({ workspaceSlug: "abhi" });
  const cases: AbhiModuleNlCase[] = [];

  for (const module of modules) {
    const label = module.displayName;
    const slug = module.id;
    cases.push({
      id: `${slug}-tell-me`,
      prompt: `Tell me about ${label}`,
      moduleLabel: label,
    });
    cases.push({
      id: `${slug}-what-can-i-do`,
      prompt: `What can I do in ${label}?`,
      moduleLabel: label,
    });
    cases.push({
      id: `${slug}-apps-under`,
      prompt: `What applications are under ${label}?`,
      moduleLabel: label,
    });
  }

  return cases;
}
