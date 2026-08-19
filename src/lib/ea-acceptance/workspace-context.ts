import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { ABHI_SLUG } from "@/lib/abhi-surface";
import { ONWARDAIR_SLUG } from "@/lib/onwardair-surface";
import { TALANTON_IMPACT_SLUG } from "@/lib/talanton-surface";
import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";

export const EA_ACCEPTANCE_WORKSPACES = [
  DEMO_WORKSPACE_SLUG,
  ONWARDAIR_SLUG,
  ABHI_SLUG,
  TALANTON_IMPACT_SLUG,
] as const;

export type EaAcceptanceWorkspaceSlug = (typeof EA_ACCEPTANCE_WORKSPACES)[number];

function baseBusiness(
  slug: string,
  name: string,
  orgName: string,
): AssistantBusinessContext {
  return {
    user: {
      id: `u-${slug}`,
      username: `ea-acceptance@${slug}`,
      displayName: "EA Acceptance",
      userType: "operator",
    },
    organisation: { id: `org-${slug}`, name: orgName },
    workspace: { id: `ws-${slug}`, name, slug },
    page: { activeView: "executive-assistant", label: "Executive Assistant" },
    selection: {},
    permissions: {
      roleView: "executive",
      canAccessFinancials: true,
      canAccessUsers: true,
      canAccessStrategy: true,
      canAccessHr: true,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function businessContextForWorkspace(slug: string): AssistantBusinessContext {
  const normalized = slug.trim().toLowerCase();
  if (normalized === DEMO_WORKSPACE_SLUG || normalized === "demo") {
    return baseBusiness(DEMO_WORKSPACE_SLUG, "Demo", "Northstar Industrial Technologies");
  }
  if (normalized === ONWARDAIR_SLUG || normalized.includes("onwardair")) {
    return baseBusiness(ONWARDAIR_SLUG, "OnwardAir", "OnwardAir");
  }
  if (normalized === ABHI_SLUG || normalized === "abhi") {
    return baseBusiness(ABHI_SLUG, "ABHI", "ABHI");
  }
  if (normalized === TALANTON_IMPACT_SLUG || normalized.includes("talanton")) {
    return baseBusiness(TALANTON_IMPACT_SLUG, "Talanton Impact", "Talanton Impact");
  }
  return baseBusiness(normalized, normalized, normalized);
}
