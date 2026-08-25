/**
 * Demo workspace EA orchestration — server-only module spine hook.
 *
 * Reconnects resolveNorthstarEaDataRoute without importing server-only code into demo-pack.ts.
 */

import "server-only";

import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { hasExplicitWriteIntent } from "@/lib/ai-operating-assistant/intent-action-resolver";
import { isLiveFinancialBalanceQuestion } from "@/lib/ai-operating-assistant/knowledge-domains";
import { listPlatformModules } from "@/lib/ai-operating-assistant/application-catalogue";
import {
  resolveNorthstarEaDataRoute,
  type NorthstarEaRoute,
} from "@/lib/demo/northstar-ea-route-resolver";

export type DemoEaSpineContext = {
  workspaceSlug?: string | null;
  hasWriteIntent?: boolean;
};

/** True when Demo module spine should win over generic semantic headcount/CRM caps. */
export function preferDemoModuleSpineOverSemantic(message: string, workspaceSlug?: string | null): boolean {
  if (String(workspaceSlug ?? "").trim().toLowerCase() !== DEMO_WORKSPACE_SLUG) return false;
  const text = message.trim();
  if (!text) return false;
  const lower = text.toLowerCase();

  if (/\b(graph|chart|plot|visuali[sz]e|pie chart|bar chart|line chart)\b/.test(lower)) return false;
  if (isLiveFinancialBalanceQuestion(text)) return false;

  if (
    /\bhow are sales doing\b/.test(lower) ||
    /\bon track to hit (?:target|quota|plan)\b/.test(lower) ||
    /\bbehind target\b/.test(lower) ||
    /\bexecutive sales update\b/.test(lower) ||
    /\bsales forecast\b/.test(lower) ||
    /\b(salespeople|sales reps?|sales team)\b.*\b(attention|behind|target|performance)\b/.test(lower) ||
    /\b(opportunities?|deals?)\b.*\b(close|likely|miss target)\b/.test(lower)
  ) {
    return true;
  }

  const moduleScoped =
    /\b(executive summary|key kpis|what needs attention|what changed recently|show me risks|summarise|summarize|additional .+ check)\b/.test(
      lower,
    ) ||
    /\b(give me|provide|show)\s+(an?\s+)?(executive\s+)?(summary|update|overview)\b/.test(lower);

  if (moduleScoped) return true;

  const modules = listPlatformModules({ workspaceSlug: DEMO_WORKSPACE_SLUG });
  for (const mod of modules) {
    const names = [mod.label, mod.displayName, mod.id.replace(/-/g, " ")].map((s) => s.toLowerCase());
    if (names.some((name) => name.length > 3 && lower.includes(name))) {
      return true;
    }
  }

  for (const page of modules.flatMap((m) => m.applications.flatMap((a) => a.pages))) {
    const label = page.label?.toLowerCase() ?? "";
    if (label.length > 3 && lower.includes(label)) return true;
  }

  return false;
}

export function isDemoWorkspaceSlug(slug: string | null | undefined): boolean {
  return String(slug ?? "").trim().toLowerCase() === DEMO_WORKSPACE_SLUG;
}

export function resolveDemoEaModuleSpineRoute(
  message: string,
  ctx: DemoEaSpineContext = {},
): NorthstarEaRoute | null {
  if (!isDemoWorkspaceSlug(ctx.workspaceSlug)) return null;
  if (ctx.hasWriteIntent ?? hasExplicitWriteIntent(message)) return null;
  return resolveNorthstarEaDataRoute(message);
}
