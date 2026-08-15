/**
 * Client pack UI helpers — no server registry imports.
 */

import type { ExecutiveAssistantPageContext } from "@/lib/executive-assistant-ui";

import { ensureEaClientWorkspacePacksRegistered } from "./client-bootstrap";
import {
  getEaClientWorkspacePackForSlug,
  listEaClientWorkspacePacks,
  resolveEaSuggestedPromptsFromPack,
} from "./registry-client";
import type { EaWorkspacePack } from "./types";

export function resolveEaPackForBrowser(): EaWorkspacePack | null {
  if (typeof window === "undefined") return null;
  ensureEaClientWorkspacePacksRegistered();
  for (const pack of listEaClientWorkspacePacks()) {
    if (pack.matchesBrowserSurface?.()) return pack;
  }
  return null;
}

export function collectEaClientOrgStatePayload(): Record<string, unknown> {
  const pack = resolveEaPackForBrowser();
  if (!pack?.orgState?.collectClientState || !pack.orgState.matchesBrowserSurface?.()) {
    return {};
  }
  const state = pack.orgState.collectClientState();
  if (!state) return {};
  return { [pack.orgState.requestField]: state };
}

export function resolveEaExecutiveAssistantContext(
  activeView: string | null | undefined,
  baseContext: ExecutiveAssistantPageContext,
  workspaceSlug?: string | null,
): ExecutiveAssistantPageContext {
  ensureEaClientWorkspacePacksRegistered();
  const pack =
    (workspaceSlug ? getEaClientWorkspacePackForSlug(workspaceSlug) : null) ??
    resolveEaPackForBrowser();
  if (!pack) return baseContext;
  return resolveEaSuggestedPromptsFromPack(pack, activeView, baseContext);
}

export function workspacePackSupportsBoardPack(slug?: string | null): boolean {
  ensureEaClientWorkspacePacksRegistered();
  const pack = slug ? getEaClientWorkspacePackForSlug(slug) : resolveEaPackForBrowser();
  return Boolean(pack?.clientSupportsBoardPack);
}
