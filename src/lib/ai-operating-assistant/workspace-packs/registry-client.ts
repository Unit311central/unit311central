/**
 * Client-safe workspace pack registry accessors.
 */

import type { ExecutiveAssistantPageContext } from "@/lib/executive-assistant-ui";

import { ensureEaClientWorkspacePacksRegistered } from "./client-bootstrap";
import type { EaWorkspacePack } from "./types";

const packs: EaWorkspacePack[] = [];

export function registerEaClientWorkspacePack(pack: EaWorkspacePack): void {
  if (packs.some((existing) => existing.id === pack.id)) {
    return;
  }
  packs.push(pack);
}

export function listEaClientWorkspacePacks(): readonly EaWorkspacePack[] {
  return packs;
}

export function getEaClientWorkspacePackForSlug(
  slug: string | null | undefined,
): EaWorkspacePack | null {
  const normalized = slug?.trim().toLowerCase() ?? "";
  if (!normalized) return null;
  const specific = packs.find(
    (pack) => pack.id !== "generic" && pack.matchesSlug(normalized),
  );
  if (specific) return specific;
  return packs.find((pack) => pack.id === "generic") ?? null;
}

export function resolveEaSuggestedPromptsFromPack(
  pack: EaWorkspacePack,
  activeView: string | null | undefined,
  base: ExecutiveAssistantPageContext,
): ExecutiveAssistantPageContext {
  if (!activeView) {
    if (pack.defaultSuggestedPrompts?.length) {
      return {
        label: base.label,
        suggestedPrompts: [...pack.defaultSuggestedPrompts],
      };
    }
    return base;
  }

  const override = pack.suggestedPromptsByView?.[activeView];
  if (override) {
    if (Array.isArray(override)) {
      return { ...base, suggestedPrompts: [...override] };
    }
    return { ...base, ...override };
  }

  if (
    pack.suggestedPromptsByView &&
    (activeView === "home" || activeView === "executive-assistant") &&
    pack.suggestedPromptsByView.home
  ) {
    const home = pack.suggestedPromptsByView.home;
    if (Array.isArray(home)) return { ...base, suggestedPrompts: [...home] };
    return { ...base, ...home };
  }

  return base;
}

export function ensureEaClientPacksFromRegistry(): void {
  ensureEaClientWorkspacePacksRegistered();
}
