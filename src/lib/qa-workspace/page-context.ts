import {
  getInternalNavBreadcrumb,
  resolveInternalViewTitles,
  type InternalOperationsView,
} from "@/lib/internal-operations-data";
import type { QaPageContext } from "@/lib/qa-workspace/types";

function slugifyModuleId(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Resolve human-readable module/page labels from the active internal view. */
export function resolveQaPageContext(input: {
  activeView: InternalOperationsView;
  pathname?: string;
  search?: string;
}): QaPageContext {
  const breadcrumb = getInternalNavBreadcrumb(input.activeView);
  const titles = resolveInternalViewTitles(input.activeView);
  const moduleLabel = breadcrumb[0] ?? titles.subtitle ?? "Workspace";
  const pageLabel =
    breadcrumb.length > 1
      ? breadcrumb[breadcrumb.length - 1]!
      : titles.title ?? input.activeView;

  const routePath = `${input.pathname ?? "/dashboard"}${input.search ?? ""}`;

  return {
    moduleLabel,
    moduleId: slugifyModuleId(moduleLabel),
    pageLabel,
    pageViewId: input.activeView,
    routePath,
  };
}
