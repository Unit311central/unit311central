/**
 * Phase 1 ABHI EA — manual demo checks for /testing UI and client walkthroughs.
 */

export type AbhiEaDemoCheck = {
  id: string;
  prompt: string;
  expected: string;
  context?: string;
  href?: string;
  hrefLabel?: string;
};

export const ABHI_EA_PHASE1_DEMO_CHECKS: AbhiEaDemoCheck[] = [
  {
    id: "executive-briefing",
    prompt: "Give me an executive briefing",
    expected:
      "ABHI Chief-of-Staff briefing — organisation status, financial summary, commercial/membership, risks, open actions, and recommended next steps.",
    href: "/dashboard?view=executive-assistant",
    hrefLabel: "Open Executive Assistant",
  },
  {
    id: "org-health",
    prompt: "Organisation health assessment",
    expected: "RAG health across financial, commercial, operational, governance, and overall dimensions.",
    href: "/dashboard?view=executive-assistant",
    hrefLabel: "Open Executive Assistant",
  },
  {
    id: "overdue-actions",
    prompt: "What actions are overdue?",
    expected: "Board/governance actions from the meetings register with overdue status and owners.",
    href: "/dashboard?view=board-meetings",
    hrefLabel: "Board Meetings",
  },
  {
    id: "board-risks",
    prompt: "What are the three biggest risks facing ABHI?",
    expected: "Top board risks with ratings, trends, and mitigation — not a PDF unless explicitly requested.",
    href: "/dashboard?view=corporate-risk-register",
    hrefLabel: "Risk Register",
  },
  {
    id: "financial-performance",
    prompt: "Summarise financial performance",
    expected: "GBP revenue YTD, cash position (~£1M), burn, and AR — aligned with Financials dashboard.",
    href: "/dashboard?view=financials",
    hrefLabel: "Financials",
  },
  {
    id: "sponsorship",
    prompt: "How is sponsorship performing?",
    expected: "Commercial sponsorship lines, gaps, and board discussion points from membership/commercial data.",
    href: "/dashboard?view=member-intelligence",
    hrefLabel: "Member Intelligence",
  },
  {
    id: "whx",
    prompt: "Are WHX targets at risk?",
    expected: "WHX pavilion commitments, delivery risks, and deposit/critical-path notes.",
    href: "/dashboard?view=marketing-abhi-events",
    hrefLabel: "ABHI Events",
  },
  {
    id: "nav-financials",
    prompt: "Where do I find accounts receivable?",
    expected: "Navigate to Financials → Accounts Receivable (Application Catalogue / searchApplications).",
    href: "/dashboard?view=accounts-receivable",
    hrefLabel: "Accounts Receivable",
  },
  {
    id: "nav-regulatory",
    prompt: "Where is regulatory impact assessment?",
    expected: "ABHI Intelligence → Regulatory Intelligence → Impact Assessments.",
    href: "/dashboard?view=regulatory-impact",
    hrefLabel: "Impact Assessments",
  },
  {
    id: "nav-board-deck",
    prompt: "Where are board decks stored?",
    expected: "Board → Board Decks (generated packs and historical decks).",
    href: "/dashboard?view=board-pack",
    hrefLabel: "Board Decks",
  },
  {
    id: "board-pack",
    prompt: "Create a board pack for the next meeting",
    expected:
      "Multi-slide ABHI board pack PDF + PowerPoint via boardpack.generate — cover, exec summary, actions, risks, KPIs, financials, commercial, team, strategic discussion.",
    href: "/dashboard?view=executive-assistant",
    hrefLabel: "Open Executive Assistant",
  },
  {
    id: "module-discovery",
    prompt: "What modules are available in ABHI?",
    expected:
      "Full Application Catalogue list — ABHI Intelligence, Business Central (Members), Financials, Board, Marketing & Events, HR, Training, QMS, etc.",
    href: "/dashboard?view=executive-assistant",
    hrefLabel: "Open Executive Assistant",
  },
];
