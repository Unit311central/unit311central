/**
 * Phase 1 Talanton EA — manual demo checks for /testing UI and client walkthroughs.
 */

export type TalantonEaDemoCheck = {
  id: string;
  prompt: string;
  expected: string;
  /** Where to run the prompt (e.g. open a module first). */
  context?: string;
  /** Deep link to open the right screen before asking. */
  href?: string;
  hrefLabel?: string;
};

export const TALANTON_EA_PHASE1_DEMO_CHECKS: TalantonEaDemoCheck[] = [
  {
    id: "daily-brief",
    prompt: "Review today's priorities",
    expected:
      "Talanton stewardship daily brief — portfolio, funds, impact, stories pipeline, and governance (not generic projects/clients).",
    href: "/dashboard",
    hrefLabel: "Open Executive Assistant",
  },
  {
    id: "executive-briefing",
    prompt: "Give me an executive briefing",
    expected: "Full Talanton executive briefing with organisation status, portfolio, funds, impact, and governance.",
    href: "/dashboard",
    hrefLabel: "Open Executive Assistant",
  },
  {
    id: "portfolio-attention",
    prompt: "What requires attention across the portfolio?",
    expected: "Portfolio intelligence — health score, attention companies, and recommended actions.",
    href: "/internaldashboard?view=portfolio-intelligence-briefing",
    hrefLabel: "Portfolio Intelligence",
  },
  {
    id: "funds-deployment",
    prompt: "Summarise fund capital deployment",
    expected: "Funds overview in USD — committed, deployed, and available capital across Talanton funds.",
    href: "/internaldashboard?view=funds-dashboard",
    hrefLabel: "Fund Dashboard",
  },
  {
    id: "impact-metrics",
    prompt: "Summarise portfolio impact metrics",
    expected: "Impact briefing — jobs created, people served, and impact health score.",
    href: "/internaldashboard?view=impact-intelligence-dashboard",
    hrefLabel: "Impact Intelligence",
  },
  {
    id: "stories-clarify",
    prompt: "Create an impact stories report",
    expected:
      "Clarification prompt — EA asks which companies and impact areas before generating (need_info, not a blind PDF).",
    href: "/dashboard",
    hrefLabel: "Open Executive Assistant",
  },
  {
    id: "stories-pdf",
    prompt: "All companies, all impact areas, approved only, PDF impact stories report",
    expected: "Impact stories PDF artifact with portfolio submissions and journey visits in scope.",
    href: "/dashboard",
    hrefLabel: "Open Executive Assistant",
  },
  {
    id: "stories-view-aware",
    prompt: "Summarise this page",
    context: "Open Portfolio Stories first, then ask in the EA panel.",
    expected: "View-aware story narrative query (portfolio submissions scoped to the stories module).",
    href: "/internaldashboard?view=portfolio-stories",
    hrefLabel: "Portfolio Stories",
  },
  {
    id: "board-pack",
    prompt: "Create Board Pack",
    expected: "10-slide Talanton board pack PDF via boardpack.generate (distinct from the board deck below).",
    href: "/dashboard",
    hrefLabel: "Open Executive Assistant",
  },
];
