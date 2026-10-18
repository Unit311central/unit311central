import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import type { AssistantToolExecutionContext } from "@/lib/ai-operating-assistant/tool-result";

/** EA must be opened with Content Studio as the active module view. */
export const MOTION_STUDIO_EA_ACTIVE_VIEW = "content-studio";

const MOTION_STUDIO_TOOL = "demo.motionStudio.generate";

export function isDemoWorkspaceSlug(slug: string | null | undefined): boolean {
  return String(slug ?? "").trim().toLowerCase() === DEMO_WORKSPACE_SLUG;
}

export function isMotionStudioEaActiveView(activeView: string | null | undefined): boolean {
  return String(activeView ?? "").trim().toLowerCase() === MOTION_STUDIO_EA_ACTIVE_VIEW;
}

export function canUseMotionStudioInBusinessContext(
  business: Pick<AssistantBusinessContext, "workspace" | "page">,
): boolean {
  return isDemoWorkspaceSlug(business.workspace.slug) && isMotionStudioEaActiveView(business.page.activeView);
}

export function motionStudioAccessDeniedMessage(
  business: Pick<AssistantBusinessContext, "workspace" | "page">,
): string {
  if (!isDemoWorkspaceSlug(business.workspace.slug)) {
    return "Motion Studio is available on the demo workspace only (demo.unit311central.com). Switch to the demo host to generate animated explainers.";
  }
  if (!isMotionStudioEaActiveView(business.page.activeView)) {
    return "Motion Studio belongs to Content Studio. Open Content Studio and use the assistant there to create animations — it is not available from the global Executive Assistant or other modules.";
  }
  return "Motion Studio is not available in this context.";
}

export function assertMotionStudioAccess(ctx: AssistantToolExecutionContext): void {
  if (!canUseMotionStudioInBusinessContext(ctx.business)) {
    throw new Error(motionStudioAccessDeniedMessage(ctx.business));
  }
}

/** Hide Motion Studio from demo pack tool lists unless EA is in Content Studio. */
export function filterMotionStudioToolDefinitions<T extends { name: string }>(
  tools: readonly T[],
  activeView?: string | null,
): T[] {
  if (isMotionStudioEaActiveView(activeView)) return [...tools];
  return tools.filter((tool) => tool.name !== MOTION_STUDIO_TOOL);
}
