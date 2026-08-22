import {
  QA_MODULE_LEVEL_ELEMENT,
  QA_PAGE_LEVEL_ELEMENT,
  QA_TASK_SCOPES,
  QA_WORKSPACE_LEVEL_ELEMENT,
  type QaTaskScope,
} from "@/lib/qa-workspace/constants";
import type {
  QaElementContext,
  QaPageContext,
  QaTaskCaptureContext,
  QaWorkspaceTaskInput,
} from "@/lib/qa-workspace/types";

export function isQaTaskScope(value: string | null | undefined): value is QaTaskScope {
  return QA_TASK_SCOPES.includes(value as QaTaskScope);
}

export function formatQaTaskScopeLabel(scope: QaTaskScope): string {
  return scope.charAt(0).toUpperCase() + scope.slice(1);
}

export function buildElementCapture(
  pageContext: QaPageContext,
  elementContext: QaElementContext,
): QaTaskCaptureContext {
  return {
    scope: "element",
    moduleLabel: pageContext.moduleLabel,
    moduleId: pageContext.moduleId,
    pageLabel: pageContext.pageLabel,
    pageViewId: pageContext.pageViewId,
    routePath: pageContext.routePath,
    elementLabel: elementContext.elementLabel,
    elementType: elementContext.elementType,
    elementId: elementContext.elementId,
  };
}

export function buildPageCapture(pageContext: QaPageContext): QaTaskCaptureContext {
  return {
    scope: "page",
    moduleLabel: pageContext.moduleLabel,
    moduleId: pageContext.moduleId,
    pageLabel: pageContext.pageLabel,
    pageViewId: pageContext.pageViewId,
    routePath: pageContext.routePath,
    elementLabel: QA_PAGE_LEVEL_ELEMENT,
    elementType: "page",
    elementId: pageContext.pageViewId,
  };
}

export function buildModuleCapture(pageContext: QaPageContext): QaTaskCaptureContext {
  return {
    scope: "module",
    moduleLabel: pageContext.moduleLabel,
    moduleId: pageContext.moduleId,
    pageLabel: QA_MODULE_LEVEL_ELEMENT,
    pageViewId: null,
    routePath: null,
    elementLabel: QA_MODULE_LEVEL_ELEMENT,
    elementType: "module",
    elementId: pageContext.moduleId,
  };
}

export function buildWorkspaceCapture(pageContext: QaPageContext): QaTaskCaptureContext {
  return {
    scope: "workspace",
    moduleLabel: "Workspace",
    moduleId: null,
    pageLabel: QA_WORKSPACE_LEVEL_ELEMENT,
    pageViewId: null,
    routePath: null,
    elementLabel: QA_WORKSPACE_LEVEL_ELEMENT,
    elementType: "workspace",
    elementId: null,
  };
}

export function captureContextToTaskInput(
  capture: QaTaskCaptureContext,
  description: string,
): QaWorkspaceTaskInput {
  return {
    scope: capture.scope,
    moduleLabel: capture.moduleLabel,
    moduleId: capture.moduleId,
    pageLabel: capture.pageLabel,
    pageViewId: capture.pageViewId,
    routePath: capture.routePath,
    elementLabel: capture.elementLabel,
    elementType: capture.elementType,
    elementId: capture.elementId,
    description,
  };
}

export function validateQaWorkspaceTaskInput(input: QaWorkspaceTaskInput): string | null {
  if (!isQaTaskScope(input.scope)) {
    return "Scope must be workspace, module, page, or element.";
  }
  if (!input.description?.trim()) {
    return "Description is required.";
  }

  switch (input.scope) {
    case "workspace":
      return null;
    case "module":
      if (!input.moduleLabel?.trim()) return "Module is required for module-scoped tasks.";
      return null;
    case "page":
      if (!input.moduleLabel?.trim() || !input.pageLabel?.trim()) {
        return "Module and page are required for page-scoped tasks.";
      }
      return null;
    case "element":
      if (!input.moduleLabel?.trim() || !input.pageLabel?.trim() || !input.elementLabel?.trim()) {
        return "Module, page, and element are required for element-scoped tasks.";
      }
      return null;
    default:
      return "Invalid scope.";
  }
}

export function inferScopeFromLegacyTask(input: {
  elementLabel?: string | null;
  elementType?: string | null;
  scope?: string | null;
}): QaTaskScope {
  if (isQaTaskScope(input.scope)) return input.scope;
  if (input.elementLabel === QA_PAGE_LEVEL_ELEMENT || input.elementType === "page") return "page";
  if (input.elementLabel === QA_MODULE_LEVEL_ELEMENT || input.elementType === "module") {
    return "module";
  }
  if (input.elementLabel === QA_WORKSPACE_LEVEL_ELEMENT || input.elementType === "workspace") {
    return "workspace";
  }
  return "element";
}
