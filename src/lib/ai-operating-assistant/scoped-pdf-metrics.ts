/**
 * Natural-language → scoped live PDF metric selection.
 * Numbers never invented; unknown asks become honest gaps.
 */

import {
  parseReportPeriod,
  type ReportPeriod,
} from "@/lib/ai-operating-assistant/report-period";

export type ScopedPdfMetricId =
  | "pnl"
  | "burn_rate"
  | "runway"
  | "payroll_total"
  | "crm_pipeline_value"
  | "cash"
  | "ar_overdue"
  | "headcount"
  | "open_projects";

export type ScopedPdfMetricDef = {
  id: ScopedPdfMetricId;
  label: string;
  /** Matchers tested against the full lowercased message. */
  match: RegExp;
  permission: "financials" | "hr" | "crm" | "projects" | "any";
};

export const SCOPED_PDF_METRICS: ScopedPdfMetricDef[] = [
  {
    id: "pnl",
    label: "Profit & Loss",
    match:
      /\b(p\s*&\s*l|p\s+and\s+l|pnl|profit\s*(and|&)\s*loss|profit\s+and\s+loss)\b/i,
    permission: "financials",
  },
  {
    id: "burn_rate",
    label: "Burn rate",
    match: /\b(burn\s*rate|monthly\s+burn)\b/i,
    permission: "financials",
  },
  {
    id: "runway",
    label: "Cash runway",
    match: /\b(cash\s+)?runway\b/i,
    permission: "financials",
  },
  {
    id: "payroll_total",
    label: "Payroll total",
    match:
      /\b(payroll\s+(total|cost|obligation|amount|sum)|monthly\s+payroll|payroll)\b/i,
    permission: "hr",
  },
  {
    id: "crm_pipeline_value",
    label: "CRM pipeline value",
    match:
      /\b((value\s+of\s+(the\s+)?)?crm\s+pipeline|open\s+pipeline(\s+value)?|pipeline\s+value|sales\s+pipeline)\b/i,
    permission: "crm",
  },
  {
    id: "cash",
    label: "Cash position",
    match: /\b(cash\s+position|how\s+much\s+cash|cash\s+balance|cash\s+on\s+hand)\b/i,
    permission: "financials",
  },
  {
    id: "ar_overdue",
    label: "AR overdue",
    match:
      /\b(ar\s+overdue|overdue\s+(invoices?|receivables?)|accounts?\s+receivable\s+overdue)\b/i,
    permission: "financials",
  },
  {
    id: "headcount",
    label: "Headcount",
    match: /\b(headcount|how\s+many\s+employees|employee\s+count|staff\s+count)\b/i,
    permission: "hr",
  },
  {
    id: "open_projects",
    label: "Open projects",
    match: /\b(open\s+projects|live\s+projects|active\s+projects|project\s+count)\b/i,
    permission: "projects",
  },
];

export type ScopedPdfRequest = {
  wantsDocument: boolean;
  metrics: ScopedPdfMetricId[];
  period: ReportPeriod;
  unknownTopics: string[];
  /** Route to generateScopedBusinessPdf instead of fixed templates. */
  useScopedPath: boolean;
  title: string;
};

function wantsDocument(lower: string): boolean {
  return (
    /\b(pdf|report|pack|directory|export|document)\b/.test(lower) ||
    /\b(generate|create|make|export|produce|build|prepare)\s+(a\s+|the\s+|me\s+a\s+|me\s+)?(pdf|report|pack|directory|document)\b/.test(
      lower,
    ) ||
    /\b(give me|get me)\s+(a\s+|the\s+)?(pdf|report|pack|directory)\b/.test(lower)
  );
}

function detectMetrics(lower: string): ScopedPdfMetricId[] {
  const found: ScopedPdfMetricId[] = [];
  for (const def of SCOPED_PDF_METRICS) {
    if (def.match.test(lower) && !found.includes(def.id)) {
      found.push(def.id);
    }
  }
  return found;
}

/** Strip period / PDF chrome so leftover segments can be flagged as unknown. */
function isNoiseSegment(seg: string): boolean {
  const s = seg.trim().toLowerCase();
  if (!s || s.length < 3) return true;
  if (
    /\b(pdf|report|document|export|create|make|generate|give|show|me|a|the|for|last|past|previous|months?|ytd|year|to|date|my|our|please)\b/.test(
      s,
    ) &&
    s.split(/\s+/).length <= 4 &&
    !/\b(cac|marketing|nps|churn|ltv|mrr|arr)\b/.test(s)
  ) {
    // Pure period / verb chrome
    if (/^(last|past|previous)\s+\d+\s+months?$/.test(s)) return true;
    if (/^(last|past|previous)\s+six\s+months$/.test(s)) return true;
    if (/^(ytd|year\s+to\s+date|this\s+year)$/.test(s)) return true;
    if (/^(a\s+)?pdf$/.test(s)) return true;
    if (/^(create|make|generate|export|give)\b/.test(s) && !/\b(cac|marketing)\b/.test(s)) {
      return true;
    }
  }
  if (/^(last|past|previous)\s+\d+\s+months?$/.test(s)) return true;
  if (/^\d+\s+months?$/.test(s)) return true;
  return false;
}

function segmentMatchesMetric(seg: string): boolean {
  const lower = seg.toLowerCase();
  return SCOPED_PDF_METRICS.some((def) => def.match.test(lower));
}

function detectUnknownTopics(message: string, metrics: ScopedPdfMetricId[]): string[] {
  const lower = message.toLowerCase();
  // Prefer content after "pdf for" / "report for" / "showing"
  const afterFor =
    lower.match(
      /\b(?:pdf|report|document|export)\b[\s\S]{0,40}?\b(?:for|showing|including|with)\s+(.+)$/i,
    )?.[1] ??
    lower.match(/\b(?:for|showing|including)\s+(.+)$/i)?.[1] ??
    lower;

  // Protect multi-word metric phrases so "and" split does not invent false unknowns.
  const protectedBody = afterFor
    .replace(/\bprofit\s*(and|&)\s*loss\b/gi, "profit_and_loss")
    .replace(/\bp\s*&\s*l\b/gi, "pnl_token")
    .replace(/\bvalue\s+of\s+(the\s+)?crm\s+pipeline\b/gi, "crm_pipeline_value")
    .replace(/\bcrm\s+pipeline\b/gi, "crm_pipeline_value")
    .replace(/\bopen\s+pipeline(\s+value)?\b/gi, "crm_pipeline_value")
    .replace(/\bpipeline\s+value\b/gi, "crm_pipeline_value")
    .replace(/\bburn\s*rate\b/gi, "burn_rate")
    .replace(/\bmonthly\s+burn\b/gi, "burn_rate")
    .replace(/\bpayroll\s+(total|cost|obligation|amount|sum)\b/gi, "payroll_total")
    .replace(/\bmonthly\s+payroll\b/gi, "payroll_total")
    .replace(/\bcash\s+position\b/gi, "cash_position")
    .replace(/\bar\s+overdue\b/gi, "ar_overdue")
    .replace(/\bopen\s+projects\b/gi, "open_projects")
    .replace(/\blive\s+projects\b/gi, "open_projects")
    .replace(/\bactive\s+projects\b/gi, "open_projects");

  const segments = protectedBody
    .split(/\s*,\s*|\s+and\s+/i)
    .map((s) => s.replace(/[?.!]+$/g, "").trim())
    .filter(Boolean);

  const knownTokens = new Set([
    "profit_and_loss",
    "pnl_token",
    "crm_pipeline_value",
    "burn_rate",
    "payroll_total",
    "cash_position",
    "ar_overdue",
    "open_projects",
    "payroll",
    "headcount",
    "runway",
  ]);

  const unknowns: string[] = [];
  for (const seg of segments) {
    if (knownTokens.has(seg.replace(/^(the|a|an|our|my)\s+/i, "").trim())) continue;
    if (isNoiseSegment(seg)) continue;
    if (segmentMatchesMetric(seg)) continue;
    // Period fragment glued to metric text e.g. "profit_and_loss for last 6 months"
    if (/^(profit_and_loss|pnl_token|burn_rate|payroll_total|crm_pipeline_value)\b/.test(seg)) {
      continue;
    }
    if (segmentMatchesMetric(seg.replace(/\bfor\s+last\s+\d+\s+months?\b/i, ""))) continue;
    if (/\blast\s+\d+\s+months?\b/.test(seg) && metrics.includes("pnl")) continue;
    // Skip generic financial report phrasing when only template path
    if (/\b(financials?|board|engineering|employees?|directory)\b/.test(seg) && metrics.length <= 1) {
      continue;
    }
    const cleaned = seg.replace(/^(the|a|an|our|my)\s+/i, "").trim();
    if (cleaned.length >= 3 && !unknowns.includes(cleaned)) {
      unknowns.push(cleaned);
    }
  }
  return unknowns;
}

export function parseScopedPdfRequest(message: string): ScopedPdfRequest {
  const text = message.trim();
  const lower = text.toLowerCase();
  const document = wantsDocument(lower);
  const metrics = detectMetrics(lower);
  const period = parseReportPeriod(lower);
  const unknownTopics = document ? detectUnknownTopics(text, metrics) : [];

  const hasCustomRange = period.kind === "last_n_months";
  const useScopedPath =
    document &&
    (metrics.length >= 2 ||
      (metrics.length >= 1 && hasCustomRange) ||
      (metrics.length >= 1 && unknownTopics.length > 0));

  return {
    wantsDocument: document,
    metrics,
    period,
    unknownTopics,
    useScopedPath,
    title: "Custom Business Report",
  };
}

export function metricLabel(id: ScopedPdfMetricId): string {
  return SCOPED_PDF_METRICS.find((m) => m.id === id)?.label ?? id;
}
