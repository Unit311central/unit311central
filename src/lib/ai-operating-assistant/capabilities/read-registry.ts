/**
 * Central read capability registry.
 */

import { CENTRAL_READ_CAPABILITIES, matchesCashCapability, matchesScopedPdfCapability } from "./definitions";
import type {
  EaReadCapabilityDefinition,
  EaReadCapabilityDenied,
  EaReadCapabilityMatch,
} from "./types";
import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import { detectCrossWorkspaceDataProbe, normalizeEaMessage } from "./message-normalize";

const registry = new Map<string, EaReadCapabilityDefinition>();

let bootstrapped = false;

export function ensureReadCapabilitiesRegistered(): void {
  if (bootstrapped) return;
  for (const cap of CENTRAL_READ_CAPABILITIES) {
    registry.set(cap.id, cap);
  }
  bootstrapped = true;
}

export function registerReadCapability(definition: EaReadCapabilityDefinition): void {
  registry.set(definition.id, definition);
}

export function listReadCapabilities(): EaReadCapabilityDefinition[] {
  ensureReadCapabilitiesRegistered();
  return [...registry.values()];
}

export function getReadCapability(id: string): EaReadCapabilityDefinition | null {
  ensureReadCapabilitiesRegistered();
  return registry.get(id) ?? null;
}

function capabilityAppliesToWorkspace(
  cap: EaReadCapabilityDefinition,
  slug: string | null | undefined,
): boolean {
  if (cap.workspaces === "*") return true;
  const normalized = String(slug ?? "").trim().toLowerCase();
  return cap.workspaces.some((s) => s.toLowerCase() === normalized);
}

function userHasCapabilityPermission(
  business: AssistantBusinessContext,
  cap: EaReadCapabilityDefinition,
): boolean {
  for (const perm of cap.permissions) {
    if (perm === "authenticated") continue;
    if (!business.permissions[perm]) return false;
  }
  return true;
}

function scoreCapabilityMatch(
  normalized: string,
  raw: string,
  cap: EaReadCapabilityDefinition,
): number {
  if (cap.exclude?.some((p) => p.test(raw) || p.test(normalized))) return 0;

  if (cap.id === "reports.scopedPdf.generate" && matchesScopedPdfCapability(raw)) {
    return 100;
  }
  if (cap.id === "financials.cashPosition.read" && matchesCashCapability(raw)) {
    if (matchesScopedPdfCapability(raw)) return 0;
    return 100;
  }

  let score = 0;
  for (const alias of cap.aliases) {
    if (alias.test(raw) || alias.test(normalized)) {
      score = Math.max(score, 80);
    }
  }
  return score;
}

export function resolveReadCapability(
  message: string,
  business: AssistantBusinessContext,
): EaReadCapabilityMatch | EaReadCapabilityDenied | null {
  ensureReadCapabilitiesRegistered();
  const raw = message.trim();
  if (!raw) return null;

  const foreignSlug = detectCrossWorkspaceDataProbe(raw, business.workspace.slug);
  if (foreignSlug) {
    return {
      denied: true,
      reason: "cross_workspace",
      message: `I can only access data for your current workspace. I can't retrieve ${foreignSlug} data from here.`,
    };
  }

  const normalized = normalizeEaMessage(raw);
  let best: EaReadCapabilityMatch | null = null;

  for (const cap of listReadCapabilities()) {
    if (!capabilityAppliesToWorkspace(cap, business.workspace.slug)) continue;
    const score = scoreCapabilityMatch(normalized, raw, cap);
    if (score <= 0) continue;
    if (!best || score > best.score) {
      best = { capability: cap, score };
    }
  }

  if (!best || best.score < 70) return null;

  if (!userHasCapabilityPermission(business, best.capability)) {
    return {
      denied: true,
      reason: "permission",
      message: `You don't have permission to access ${best.capability.module} data.`,
    };
  }

  return best;
}

export function resetReadCapabilitiesForTests(): void {
  registry.clear();
  bootstrapped = false;
}
