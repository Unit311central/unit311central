/**
 * Natural-language → scoped live PDF metric selection.
 * Numbers never invented; unknown asks become honest gaps.
 * Typos are tolerated via fuzzy phrase matching across all registered metrics.
 */

import {
  parseReportPeriod,
  type ReportPeriod,
} from "@/lib/ai-operating-assistant/report-period";

export type ScopedPdfMetricId =
  | "pnl"
  | "balance_sheet"
  | "burn_rate"
  | "runway"
  | "payroll_total"
  | "crm_pipeline_value"
  | "cash"
  | "ar_overdue"
  | "ar_outstanding"
  | "ap_outstanding"
  | "revenue_ytd"
  | "net_profit"
  | "outstanding_invoices"
  | "headcount"
  | "open_projects"
  | "total_projects"
  | "overdue_projects"
  | "active_clients"
  | "hot_leads"
  | "open_leads"
  | "open_vacancies"
  | "pending_leave"
  | "portfolio_capital"
  | "fund_deployment"
  | "impact_health"
  | "jobs_created"
  | "portfolio_health";

export type ScopedPdfMetricDef = {
  id: ScopedPdfMetricId;
  label: string;
  /** Exact / near-exact regex for the full message. */
  match: RegExp;
  /** Canonical phrases used for fuzzy typo matching. */
  phrases: string[];
  permission: "financials" | "hr" | "crm" | "projects" | "any";
};

export const SCOPED_PDF_METRICS: ScopedPdfMetricDef[] = [
  {
    id: "pnl",
    label: "Profit & Loss",
    match: /\b(p\s*&\s*l|p\s+and\s+l|pnl|profit\s*(and|&)\s*loss)\b/i,
    phrases: ["profit and loss", "p and l", "pnl", "p&l"],
    permission: "financials",
  },
  {
    id: "balance_sheet",
    label: "Balance sheet",
    match: /\b(balance\s*sheet|statement\s+of\s+financial\s+position|assets\s+and\s+liabilities)\b/i,
    phrases: [
      "balance sheet",
      "statement of financial position",
      "assets and liabilities",
      "balancesheet",
    ],
    permission: "financials",
  },
  {
    id: "burn_rate",
    label: "Burn rate",
    match: /\b(burn\s*rate|monthly\s+burn)\b/i,
    phrases: ["burn rate", "monthly burn", "burnrate"],
    permission: "financials",
  },
  {
    id: "runway",
    label: "Cash runway",
    match: /\b(cash\s+)?runway\b/i,
    phrases: ["cash runway", "runway"],
    permission: "financials",
  },
  {
    id: "payroll_total",
    label: "Payroll total",
    match:
      /\b(payroll\s+(total|cost|obligation|amount|sum)|monthly\s+payroll|payroll)\b/i,
    phrases: [
      "payroll total",
      "payroll cost",
      "monthly payroll",
      "payroll obligation",
      "payroll",
    ],
    permission: "hr",
  },
  {
    id: "crm_pipeline_value",
    label: "CRM pipeline value",
    match:
      /\b((value\s+of\s+(the\s+)?)?crm\s+pipelin\w*|open\s+pipelin\w*|pipelin\w*\s+value|sales\s+pipelin\w*)\b/i,
    phrases: [
      "crm pipeline",
      "crm pipeline value",
      "value of crm pipeline",
      "open pipeline",
      "pipeline value",
      "sales pipeline",
      "pipeline",
    ],
    permission: "crm",
  },
  {
    id: "cash",
    label: "Cash position",
    match:
      /\b(cash\s+position|how\s+much\s+cash|cash\s+balance|cash\s+on\s+hand|(?:^|[,&\s])cash(?:\s|$|[,&]))\b/i,
    phrases: ["cash position", "cash balance", "cash on hand", "how much cash", "cash"],
    permission: "financials",
  },
  {
    id: "ar_overdue",
    label: "AR overdue",
    match:
      /\b(ar\s+overdue|overdue\s+(invoices?|receivables?)|accounts?\s+receivable\s+overdue)\b/i,
    phrases: [
      "ar overdue",
      "overdue invoices",
      "overdue receivables",
      "accounts receivable overdue",
    ],
    permission: "financials",
  },
  {
    id: "ar_outstanding",
    label: "AR outstanding",
    match:
      /\b(ar\s+outstanding|accounts?\s+receivable|receivables?\s+total|unpaid\s+receivables?)\b/i,
    phrases: [
      "ar outstanding",
      "accounts receivable",
      "receivables total",
      "unpaid receivables",
    ],
    permission: "financials",
  },
  {
    id: "ap_outstanding",
    label: "AP outstanding",
    match:
      /\b(ap\s+outstanding|accounts?\s+payable|what\s+we\s+owe|payables?\s+total)\b/i,
    phrases: [
      "ap outstanding",
      "accounts payable",
      "payables total",
      "what we owe",
    ],
    permission: "financials",
  },
  {
    id: "revenue_ytd",
    label: "Revenue YTD",
    match: /\b(revenue\s+ytd|ytd\s+revenue|year\s*to\s*date\s+revenue|ytd\s+sales)\b/i,
    phrases: [
      "revenue ytd",
      "ytd revenue",
      "year to date revenue",
      "ytd sales",
    ],
    permission: "financials",
  },
  {
    id: "net_profit",
    label: "Net profit",
    match: /\b(net\s+profit|net\s+income|bottom\s+line)\b/i,
    phrases: ["net profit", "net income", "bottom line"],
    permission: "financials",
  },
  {
    id: "outstanding_invoices",
    label: "Outstanding invoices",
    match: /\b(outstanding\s+invoices?|unpaid\s+invoices?|invoice\s+count)\b/i,
    phrases: [
      "outstanding invoices",
      "unpaid invoices",
      "invoice count",
      "outstanding invoice",
    ],
    permission: "financials",
  },
  {
    id: "headcount",
    label: "Headcount",
    match: /\b(headcount|how\s+many\s+employees|employee\s+count|staff\s+count)\b/i,
    phrases: ["headcount", "employee count", "staff count", "how many employees"],
    permission: "hr",
  },
  {
    id: "open_projects",
    label: "Open projects",
    match: /\b(open\s+projects|live\s+projects|active\s+projects)\b/i,
    phrases: ["open projects", "live projects", "active projects"],
    permission: "projects",
  },
  {
    id: "total_projects",
    label: "Total projects",
    match: /\b(total\s+projects|all\s+projects|project\s+count)\b/i,
    phrases: ["total projects", "all projects", "project count"],
    permission: "projects",
  },
  {
    id: "overdue_projects",
    label: "Overdue projects",
    match: /\b(overdue\s+projects|late\s+projects|projects?\s+behind)\b/i,
    phrases: ["overdue projects", "late projects", "projects behind"],
    permission: "projects",
  },
  {
    id: "active_clients",
    label: "Active clients",
    match: /\b(active\s+clients|client\s+count|how\s+many\s+clients|number\s+of\s+clients)\b/i,
    phrases: [
      "active clients",
      "client count",
      "how many clients",
      "number of clients",
    ],
    permission: "crm",
  },
  {
    id: "hot_leads",
    label: "Hot leads",
    match: /\b(hot\s+leads|hot\s+opportunities)\b/i,
    phrases: ["hot leads", "hot opportunities"],
    permission: "crm",
  },
  {
    id: "open_leads",
    label: "Open leads",
    match: /\b(open\s+leads|open\s+opportunities|crm\s+opportunity\s+count)\b/i,
    phrases: ["open leads", "open opportunities", "crm opportunity count"],
    permission: "crm",
  },
  {
    id: "open_vacancies",
    label: "Open vacancies",
    match: /\b(open\s+(roles|vacancies|positions)|vacancies|open\s+jobs)\b/i,
    phrases: ["open vacancies", "open roles", "open positions", "vacancies"],
    permission: "hr",
  },
  {
    id: "pending_leave",
    label: "Pending leave",
    match: /\b(pending\s+leave|leave\s+requests?|awaiting\s+leave\s+approval)\b/i,
    phrases: [
      "pending leave",
      "leave requests",
      "leave request",
      "awaiting leave approval",
    ],
    permission: "hr",
  },
  {
    id: "portfolio_capital",
    label: "Portfolio capital committed",
    match: /\b(portfolio\s+capital|capital\s+committed|total\s+capital|funds?\s+committed)\b/i,
    phrases: [
      "portfolio capital",
      "capital committed",
      "total capital committed",
      "funds committed",
    ],
    permission: "any",
  },
  {
    id: "fund_deployment",
    label: "Fund deployment",
    match: /\b(fund\s+deployment|capital\s+deployed|deployment\s+rate|deployed\s+capital)\b/i,
    phrases: [
      "fund deployment",
      "capital deployed",
      "deployment rate",
      "deployed capital",
    ],
    permission: "any",
  },
  {
    id: "impact_health",
    label: "Impact health score",
    match: /\b(impact\s+health|impact\s+score|impact\s+health\s+score)\b/i,
    phrases: ["impact health", "impact score", "impact health score"],
    permission: "any",
  },
  {
    id: "jobs_created",
    label: "Jobs created",
    match: /\b(jobs\s+created|employment\s+created|jobs\s+supported)\b/i,
    phrases: ["jobs created", "employment created", "jobs supported"],
    permission: "any",
  },
  {
    id: "portfolio_health",
    label: "Portfolio health score",
    match: /\b(portfolio\s+health|portfolio\s+health\s+score|holdings?\s+health)\b/i,
    phrases: ["portfolio health", "portfolio health score", "holdings health"],
    permission: "any",
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

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => 0),
  );
  for (let i = 0; i < rows; i += 1) matrix[i]![0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0]![j] = j;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,
        matrix[i]![j - 1]! + 1,
        matrix[i - 1]![j - 1]! + cost,
      );
    }
  }
  return matrix[a.length]![b.length]!;
}

/** True when two tokens are equal, a truncation, or within edit distance. */
export function fuzzyTokenEquals(a: string, b: string): boolean {
  const na = normalizeToken(a);
  const nb = normalizeToken(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  // Truncation / unfinished typing: pipelin → pipeline, payrol → payroll
  if (na.length >= 4 && nb.startsWith(na)) return true;
  if (nb.length >= 4 && na.startsWith(nb)) return true;
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen < 4) return false;
  const maxDist = maxLen <= 5 ? 1 : maxLen <= 9 ? 2 : 3;
  return levenshtein(na, nb) <= maxDist;
}

function tokenizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9&\s]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Fuzzy-match a multi-word phrase inside free text. */
export function fuzzyPhraseInText(text: string, phrase: string): boolean {
  const lower = text.toLowerCase();
  const exact = phrase.toLowerCase();
  if (lower.includes(exact)) return true;

  const phraseWords = tokenizeWords(phrase);
  if (!phraseWords.length) return false;
  if (phraseWords.length === 1) {
    return tokenizeWords(lower).some((w) => fuzzyTokenEquals(w, phraseWords[0]!));
  }

  const textWords = tokenizeWords(lower);
  for (let i = 0; i <= textWords.length - phraseWords.length; i += 1) {
    let ok = true;
    for (let j = 0; j < phraseWords.length; j += 1) {
      if (!fuzzyTokenEquals(textWords[i + j]!, phraseWords[j]!)) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

function metricMatchesText(def: ScopedPdfMetricDef, text: string): boolean {
  if (def.match.test(text)) return true;
  return def.phrases.some((phrase) => fuzzyPhraseInText(text, phrase));
}

function detectMetrics(lower: string): ScopedPdfMetricId[] {
  const found: ScopedPdfMetricId[] = [];
  for (const def of SCOPED_PDF_METRICS) {
    if (metricMatchesText(def, lower) && !found.includes(def.id)) {
      found.push(def.id);
    }
  }
  return found;
}

/** Strip period / PDF chrome so leftover segments can be flagged as unknown. */
function isNoiseSegment(seg: string): boolean {
  const s = seg.trim().toLowerCase();
  if (!s || s.length < 3) return true;
  if (/^(last|past|previous)\s+\d+\s+months?$/.test(s)) return true;
  if (/^(last|past|previous)\s+six\s+months$/.test(s)) return true;
  if (/^(ytd|year\s+to\s+date|this\s+year)$/.test(s)) return true;
  if (/^(a\s+)?pdf$/.test(s)) return true;
  if (/^\d+\s+months?$/.test(s)) return true;
  if (
    /^(create|make|generate|export|give|show|get)\b/.test(s) &&
    !/\b(cac|marketing|nps|churn|ltv|mrr|arr)\b/.test(s) &&
    s.split(/\s+/).length <= 5
  ) {
    return true;
  }
  return false;
}

function segmentMatchesMetric(seg: string): boolean {
  return SCOPED_PDF_METRICS.some((def) => metricMatchesText(def, seg));
}

function detectUnknownTopics(message: string, metrics: ScopedPdfMetricId[]): string[] {
  const lower = message.toLowerCase();
  const afterFor =
    lower.match(
      /\b(?:pdf|report|document|export)\b[\s\S]{0,40}?\b(?:for|showing|including|with)\s+(.+)$/i,
    )?.[1] ??
    lower.match(/\b(?:for|showing|including)\s+(.+)$/i)?.[1] ??
    lower;

  // Soft-protect common compound phrases before splitting on "and".
  let protectedBody = afterFor;
  for (const def of SCOPED_PDF_METRICS) {
    for (const phrase of def.phrases) {
      if (phrase.split(/\s+/).length < 2) continue;
      if (fuzzyPhraseInText(protectedBody, phrase)) {
        const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
        protectedBody = protectedBody.replace(new RegExp(escaped, "gi"), def.id);
      }
    }
  }
  // Also protect fuzzy pipeline / payroll compounds that regex may miss after split.
  protectedBody = protectedBody
    .replace(/\bprofit\s*(and|&)\s*loss\b/gi, "pnl")
    .replace(/\bvalue\s+of\s+(the\s+)?crm\s+\w+\b/gi, (m) =>
      fuzzyPhraseInText(m, "value of crm pipeline") ? "crm_pipeline_value" : m,
    );

  const segments = protectedBody
    .split(/\s*,\s*|\s+and\s+/i)
    .map((s) => s.replace(/[?.!*]+$/g, "").trim())
    .filter(Boolean);

  const knownIds = new Set(SCOPED_PDF_METRICS.map((m) => m.id));

  const unknowns: string[] = [];
  for (const seg of segments) {
    const cleaned = seg.replace(/^(the|a|an|our|my)\s+/i, "").trim();
    if (knownIds.has(cleaned as ScopedPdfMetricId)) continue;
    if (isNoiseSegment(seg)) continue;
    if (segmentMatchesMetric(seg)) continue;
    if (segmentMatchesMetric(seg.replace(/\bfor\s+last\s+\d+\s+months?\b/i, ""))) continue;
    if (/\blast\s+\d+\s+months?\b/.test(seg) && metrics.includes("pnl")) continue;
    if (/\b(financials?|board|engineering|employees?|directory)\b/.test(seg) && metrics.length <= 1) {
      continue;
    }
    // Truly unknown marketing/product metrics stay listed.
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
