import {
  ensureIntelligencePacksBootstrapped,
  getIntelligencePackBySlug,
  listIntelligencePacks,
  matchIntelligenceDomainByView,
} from "@/lib/intelligence/registry";
import type { IntelligenceDomainDefinition } from "@/lib/intelligence/types";

let viewIndexBootstrapped = false;
const intelligenceViewIds = new Set<string>();

function ensureIntelligenceViewIndex(): void {
  if (viewIndexBootstrapped) return;
  ensureIntelligencePacksBootstrapped();
  for (const pack of listIntelligencePacks()) {
    for (const registration of pack.uiViews ?? []) {
      intelligenceViewIds.add(registration.viewId);
    }
    for (const domain of pack.domains) {
      for (const viewId of domain.navViews ?? []) {
        intelligenceViewIds.add(viewId);
      }
    }
  }
  viewIndexBootstrapped = true;
}

/** True when the dashboard view is registered on an intelligence workspace pack. */
export function isIntelligenceOperationsView(view: string | null | undefined): boolean {
  const id = String(view ?? "").trim();
  if (!id) return false;
  ensureIntelligenceViewIndex();
  return intelligenceViewIds.has(id);
}

export function resolveIntelligenceDomainForView(
  workspaceSlug: string | null | undefined,
  activeView: string | null | undefined,
): IntelligenceDomainDefinition | null {
  return matchIntelligenceDomainByView(workspaceSlug, activeView);
}

export function listIntelligenceDomainsForWorkspaceUi(
  workspaceSlug: string | null | undefined,
): readonly IntelligenceDomainDefinition[] {
  const pack = getIntelligencePackBySlug(workspaceSlug);
  return pack?.domains ?? [];
}

/** Test-only — rebuild view index after registry clear. */
export function resetIntelligenceViewIndexForTests(): void {
  intelligenceViewIds.clear();
  viewIndexBootstrapped = false;
}
