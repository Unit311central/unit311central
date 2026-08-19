/**
 * Semantic EA resolver — capability matching with workspace enablement and permissions.
 */

import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import {
  detectCrossWorkspaceDataProbe,
  normalizeEaMessage,
} from "@/lib/ai-operating-assistant/capabilities/message-normalize";
import { CENTRAL_READ_CAPABILITIES } from "@/lib/ai-operating-assistant/capabilities/definitions";
import { scoreLegacyReadCapability } from "./integrations/read-capabilities";

import { listSemanticCapabilities } from "./registry";
import { scoreSemanticOverlap } from "./semantic-text";
import type { EaSemanticCapabilityBinding, EaSemanticDenied, EaSemanticMatch } from "./types";
import { assertModulesEnabled } from "./workspace-enablement";

const MATCH_THRESHOLD = 70;

function userHasPermission(
  business: AssistantBusinessContext,
  binding: EaSemanticCapabilityBinding,
): boolean {
  for (const perm of binding.permissions) {
    if (perm === "authenticated") continue;
    if (!business.permissions[perm]) return false;
  }
  return true;
}

function workspaceAllowed(binding: EaSemanticCapabilityBinding, slug: string | null | undefined): boolean {
  if (!binding.workspaceAllowList?.length) return true;
  const normalized = String(slug ?? "").trim().toLowerCase();
  return binding.workspaceAllowList.some(
    (s) => s.toLowerCase() === normalized || normalized.includes(s.toLowerCase()),
  );
}

function scoreBinding(binding: EaSemanticCapabilityBinding, raw: string, normalized: string): number {
  const legacy = scoreLegacyReadCapability(binding.id, raw);
  if (legacy > 0) return legacy;

  let score = scoreSemanticOverlap(
    raw,
    binding.keywords,
    binding.phrases ?? [],
    binding.negativeKeywords ?? [],
  );

  if (binding.crossModule && binding.id === "cross.clients.overdueInvoicesOpenTickets.read") {
    const hasInvoices = /\boverdue\b/i.test(normalized) && /\binvoices?\b/i.test(normalized);
    const hasTickets = /\b(tickets?|support)\b/i.test(normalized);
    const hasCustomers = /\b(customers?|clients?)\b/i.test(normalized);
    if (hasInvoices && hasTickets && hasCustomers) score = Math.max(score, 98);
  }

  return score;
}

export function resolveSemanticCapability(
  message: string,
  business: AssistantBusinessContext,
): EaSemanticMatch | EaSemanticDenied | null {
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
  let best: EaSemanticMatch | null = null;

  for (const binding of listSemanticCapabilities()) {
    if (!workspaceAllowed(binding, business.workspace.slug)) continue;

    const score = scoreBinding(binding, raw, normalized);
    if (score < MATCH_THRESHOLD) continue;

    if (binding.requiredModules?.length) {
      const enabled = assertModulesEnabled(binding.requiredModules, business.workspace.slug);
      if (!enabled.ok) {
        if (score >= 80) {
          return {
            denied: true,
            reason: "module_disabled",
            message: enabled.message,
          };
        }
        continue;
      }
    }

    if (!best || score > best.score) {
      best = {
        binding,
        score,
        strategy: binding.executionStrategy,
      };
    }
  }

  if (!best) return null;

  if (!userHasPermission(business, best.binding)) {
    return {
      denied: true,
      reason: "permission",
      message: `You don't have permission to access ${best.binding.moduleIds.join(", ")} data.`,
    };
  }

  return best;
}

/** Bridge legacy read capability definitions for regex-only patterns */
export function resolveLegacyRegexCapability(
  message: string,
): EaSemanticCapabilityBinding | null {
  for (const cap of CENTRAL_READ_CAPABILITIES) {
    if (cap.exclude?.some((p) => p.test(message))) continue;
    for (const alias of cap.aliases) {
      if (alias.test(message)) {
        const bindings = listSemanticCapabilities();
        return bindings.find((b) => b.id === cap.id) ?? null;
      }
    }
  }
  return null;
}
