/**
 * Project portfolio health check routing — shared question detection only.
 * Workspace tool selection belongs in workspace EA packs.
 */

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

/** Build a portfolio-health tool intent when the active pack supplies the tool name. */
export function buildProjectPortfolioHealthIntent(
  message: string,
  tool: ProjectPortfolioHealthTool,
  reason: string,
): ProjectPortfolioHealthIntent | null {
  const text = message.trim();
  if (!text || !isProjectPortfolioHealthQuestion(text)) return null;
  return {
    tool,
    args: { question: text },
    reason,
  };
}
