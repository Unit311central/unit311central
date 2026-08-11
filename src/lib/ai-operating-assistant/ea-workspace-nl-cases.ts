import type { InternalNavSection } from "@/lib/internal-operations-data";
import {
  getAbhiNavSections,
  getOnwardAirNavSections,
  getTalantonImpactNavSections,
} from "@/lib/internal-role-views";
import { isAbhiWorkspaceSlug } from "@/lib/abhi-financials";
import { isOnwardAirWorkspaceSlug } from "@/lib/onwardair-financials";
import { isTalantonWorkspaceSlug } from "@/lib/talanton-financials";

import { listPlatformModules } from "./application-catalogue";

export type EaWorkspaceNlCase = {
  id: string;
  prompt: string;
  targetLabel: string;
  kind: "module" | "page";
};

export type EaWorkspaceNlSuite = {
  workspaceSlug: string;
  moduleCases: EaWorkspaceNlCase[];
  pageCases: EaWorkspaceNlCase[];
};

function navSectionsForWorkspaceSlug(workspaceSlug: string): readonly InternalNavSection[] {
  if (isAbhiWorkspaceSlug(workspaceSlug)) return getAbhiNavSections();
  if (isOnwardAirWorkspaceSlug(workspaceSlug)) return getOnwardAirNavSections();
  if (isTalantonWorkspaceSlug(workspaceSlug)) return getTalantonImpactNavSections();
  return [];
}

export function collectWorkspaceCataloguePages(workspaceSlug: string): Array<{
  module: string;
  label: string;
}> {
  const pages: Array<{ module: string; label: string }> = [];
  for (const section of navSectionsForWorkspaceSlug(workspaceSlug)) {
    if (section.kind === "pin" || !section.label) continue;
    for (const item of section.items) {
      const walk = (
        label: string,
        children?: readonly { label: string; children?: readonly { label: string }[] }[],
      ) => {
        if (!children?.length) {
          pages.push({ module: section.label!, label });
          return;
        }
        for (const child of children) {
          if (child.children?.length) {
            for (const grand of child.children) {
              pages.push({ module: section.label!, label: grand.label });
            }
          } else {
            pages.push({ module: section.label!, label: child.label });
          }
        }
      };
      walk(item.label, item.children);
    }
  }
  return pages;
}

export function buildWorkspaceNlSuite(workspaceSlug: string): EaWorkspaceNlSuite {
  const modules = listPlatformModules({ workspaceSlug });
  const moduleCases: EaWorkspaceNlCase[] = [];

  for (const module of modules) {
    const label = module.displayName;
    const slug = module.id;
    moduleCases.push({
      id: `${slug}-tell-me`,
      prompt: `Tell me about ${label}`,
      targetLabel: label,
      kind: "module",
    });
    moduleCases.push({
      id: `${slug}-what-can-i-do`,
      prompt: `What can I do in ${label}?`,
      targetLabel: label,
      kind: "module",
    });
    moduleCases.push({
      id: `${slug}-apps-under`,
      prompt: `What applications are under ${label}?`,
      targetLabel: label,
      kind: "module",
    });
  }

  const pageCases: EaWorkspaceNlCase[] = [];
  for (const page of collectWorkspaceCataloguePages(workspaceSlug)) {
    const id = `${page.module}-${page.label}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    pageCases.push({
      id: `${id}-where`,
      prompt: `Where is ${page.label}?`,
      targetLabel: page.label,
      kind: "page",
    });
    pageCases.push({
      id: `${id}-tell-me`,
      prompt: `Tell me about ${page.label}`,
      targetLabel: page.label,
      kind: "page",
    });
    pageCases.push({
      id: `${id}-open`,
      prompt: `How do I open ${page.label}?`,
      targetLabel: page.label,
      kind: "page",
    });
  }

  return { workspaceSlug, moduleCases, pageCases };
}
