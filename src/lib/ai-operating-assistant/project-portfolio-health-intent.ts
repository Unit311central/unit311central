/**
 * Project portfolio health check routing — OnwardAir & ABHI EA.
 */

import { isAbhiSlug } from "@/lib/abhi-surface";
import { isOnwardAirSlug } from "@/lib/onwardair-surface";

export type ProjectPortfolioHealthTool =
  | "onwardair.queryProjectPortfolio"
  | "abhi.queryProjectPortfolio";

export type ProjectPortfolioHealthIntent = {
  tool: ProjectPortfolioHealthTool;
  args: Record<string, unknown>;
  reason: string;
};

export function isProjectPortfolioHealthQuestion(message: string): boolean {
  const lower = message.toLowerCase();
  const projectCtx =
    /\bproject(s)?\b/.test(lower) ||
    /\bportfolio\b/.test(lower) ||
    /\bprogramme(s)?\b/.test(lower);
  if (!projectCtx) return false;

  return (
    /\bhealth\s+check\b/.test(lower) ||
    /\bportfolio\s+health\b/.test(lower) ||
    (/\b(on\s+track|at\s+risk|issues?)\b/.test(lower) &&
      /\b(what'?s|which|give\s+me|show|health)\b/.test(lower))
  );
}

export function resolveProjectPortfolioHealthIntent(
  message: string,
  workspaceSlug: string,
): ProjectPortfolioHealthIntent | null {
  const text = message.trim();
  if (!text || !isProjectPortfolioHealthQuestion(text)) return null;

  const slug = String(workspaceSlug ?? "")
    .trim()
    .toLowerCase();

  if (isOnwardAirSlug(slug)) {
    return {
      tool: "onwardair.queryProjectPortfolio",
      args: { question: text },
      reason: "onwardair_project_portfolio_health",
    };
  }

  if (isAbhiSlug(slug)) {
    return {
      tool: "abhi.queryProjectPortfolio",
      args: { question: text },
      reason: "abhi_project_portfolio_health",
    };
  }

  return null;
}
