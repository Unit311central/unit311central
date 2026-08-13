/**
 * Deterministic ABHI EA PDF intents — demo asks B–E.
 * Board pack/deck (A) stays in board-pack-intent.ts and is unchanged.
 */

export type AbhiEaPdfToolName =
  | "abhi.generateRegulatoryImpactPdf"
  | "abhi.generateQuarterlyFinancialDeltaPdf"
  | "abhi.generateProjectHealthPdf"
  | "abhi.generatePlatformAccessPdf";

export type AbhiEaPdfIntent = {
  tool: AbhiEaPdfToolName;
  args: Record<string, unknown>;
  reason: string;
};

const DEMO_B =
  "Show me the regulatory impact in a report for the past 6 months on members in the UK in a PDF.";

const DEMO_C =
  "Give me a report showing, for the last quarter, deltas in profit and loss, burn and payroll costs in a PDF.";

const DEMO_D =
  "Give me a health status update of all active projects in a PDF.";

const DEMO_E =
  "Give me a summary of all users in ABHI and their access to this platform in a PDF.";

function wantsPdf(lower: string) {
  return /\b(pdf|report|document)\b/.test(lower);
}

function wantsGenerateVerb(lower: string) {
  return /\b(create|make|generate|export|produce|build|prepare|give|get|show)\b/.test(lower);
}

export function resolveAbhiEaPdfIntent(message: string): AbhiEaPdfIntent | null {
  const text = message.trim();
  if (!text) return null;
  const lower = text.toLowerCase();

  if (!wantsPdf(lower) || !wantsGenerateVerb(lower)) return null;

  // Exact demo prompts (highest priority).
  if (text === DEMO_B) {
    return {
      tool: "abhi.generateRegulatoryImpactPdf",
      args: { question: text, months: 6, region: "UK" },
      reason: "abhi_regulatory_impact_pdf_demo",
    };
  }
  if (text === DEMO_C) {
    return {
      tool: "abhi.generateQuarterlyFinancialDeltaPdf",
      args: { question: text },
      reason: "abhi_quarterly_financial_delta_pdf_demo",
    };
  }
  if (text === DEMO_D) {
    return {
      tool: "abhi.generateProjectHealthPdf",
      args: { question: text },
      reason: "abhi_project_health_pdf_demo",
    };
  }
  if (text === DEMO_E) {
    return {
      tool: "abhi.generatePlatformAccessPdf",
      args: { question: text },
      reason: "abhi_platform_access_pdf_demo",
    };
  }

  // B — regulatory impact period report
  if (
    /\bregulatory\b/.test(lower) &&
    /\b(impact|members?)\b/.test(lower) &&
    (/\b(?:last|past|previous)\s+six\s+months\b/.test(lower) ||
      /\b(?:last|past|previous)\s+6\s+months?\b/.test(lower)) &&
    /\b(uk|united kingdom)\b/.test(lower)
  ) {
    const monthsMatch = lower.match(/\b(?:last|past|previous)\s+(\d{1,2})\s+months?\b/);
    const months = monthsMatch?.[1] ? Number(monthsMatch[1]) : 6;
    return {
      tool: "abhi.generateRegulatoryImpactPdf",
      args: {
        question: text,
        months,
        region: /\buk\b|united kingdom/.test(lower) ? "UK" : "all",
      },
      reason: "abhi_regulatory_impact_pdf",
    };
  }

  // C — last quarter financial deltas
  if (
    /\blast\s+quarter\b|\bprevious\s+quarter\b|\bprior\s+quarter\b/.test(lower) &&
    /\bdelta/.test(lower) &&
    /\b(p\s*&\s*l|p\s+and\s+l|pnl|profit\s*(and|&)\s*loss)\b/.test(lower) &&
    /\bburn\b/.test(lower) &&
    /\bpayroll\b/.test(lower)
  ) {
    return {
      tool: "abhi.generateQuarterlyFinancialDeltaPdf",
      args: { question: text },
      reason: "abhi_quarterly_financial_delta_pdf",
    };
  }

  // D — active project health PDF
  if (
    /\bhealth\b/.test(lower) &&
    /\b(active\s+projects?|projects?)\b/.test(lower) &&
    /\b(status|update)\b/.test(lower)
  ) {
    return {
      tool: "abhi.generateProjectHealthPdf",
      args: { question: text },
      reason: "abhi_project_health_pdf",
    };
  }

  // E — platform users access (not HR employee directory)
  if (
    /\busers?\b/.test(lower) &&
    /\b(platform\s+access|access\s+to\s+(this\s+)?platform|their\s+access)\b/.test(lower) &&
    !/\b(employees?|staff|headcount|hr\s+list|employee\s+directory)\b/.test(lower)
  ) {
    return {
      tool: "abhi.generatePlatformAccessPdf",
      args: { question: text },
      reason: "abhi_platform_access_pdf",
    };
  }

  return null;
}

export const ABHI_EA_DEMO_PDF_PROMPTS = {
  regulatory: DEMO_B,
  financialDelta: DEMO_C,
  projectHealth: DEMO_D,
  platformAccess: DEMO_E,
} as const;
