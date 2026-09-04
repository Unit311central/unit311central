import { isBrowserAbhiSurface } from "@/lib/abhi-surface";
import { isBrowserGreenDesertSurface } from "@/lib/greendesert-surface";
import { isBrowserCustomerWorkspaceSurface } from "@/lib/customer-workspace-surface";
import { isBrowserDemoSurface } from "@/lib/demo-enterprise";
import { isBrowserOnwardAirSurface } from "@/lib/onwardair-surface";
import { isBrowserTalantonImpactSurface } from "@/lib/talanton-surface";
import type { SocialWorkspacePackId } from "@/lib/marketing/permissions";

/** Resolve the active social workspace pack (mirrors Marketing workspace keys). */
export function resolveSocialWorkspacePackId(): SocialWorkspacePackId {
  if (typeof window === "undefined") return "internal";
  if (isBrowserAbhiSurface()) return "abhi";
  if (isBrowserGreenDesertSurface()) return "greendesert";
  if (isBrowserTalantonImpactSurface()) return "talanton";
  if (isBrowserOnwardAirSurface()) return "onwardair";
  if (isBrowserDemoSurface()) return "demo";
  if (isBrowserCustomerWorkspaceSurface()) return "customer";
  return "internal";
}
