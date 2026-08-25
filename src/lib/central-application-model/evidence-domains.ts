/**
 * Shared evidence domain detection — used by task classifier and evidence planner.
 */

export type EvidenceDomain =
  | "cash"
  | "revenue"
  | "expenses"
  | "profitability"
  | "ar"
  | "ap"
  | "payroll"
  | "headcount"
  | "sales"
  | "clients"
  | "projects"
  | "health";

export const FINANCE_DOMAINS: EvidenceDomain[] = [
  "cash",
  "revenue",
  "expenses",
  "profitability",
  "ar",
  "ap",
  "payroll",
];

const DOMAIN_SIGNALS: Record<EvidenceDomain, RegExp> = {
  cash: /\b(cash|bank|treasury|liquidity|runway|burn)\b/i,
  revenue: /\b(revenue|income|turnover|sales\s+income|top\s*line)\b/i,
  expenses: /\b(expenses?|costs?|spend|outgoings?|opex|cogs)\b/i,
  profitability: /\b(profit|margin|p&l|loss|ebitda|bottom\s*line)\b/i,
  ar: /\b(ar\b|receivable|outstanding\s+invoice|debtors?)\b/i,
  ap: /\b(ap\b|payable|creditors?|supplier\s+invoice)\b/i,
  payroll: /\b(payroll|wages|salaries|compensation|employer\s+cost)\b/i,
  headcount: /\b(headcount|employees?|staff|fte|people|workforce|team)\b/i,
  sales: /\b(sales|pipeline|crm|deals?|opportunities?|selling|bookings?)\b/i,
  clients: /\b(clients?|customers?)\b/i,
  projects: /\b(projects?|delivery|milestones?)\b/i,
  health: /\b(health|at\s+risk|risky|distress|struggling)\b/i,
};

const CONCERN_SIGNALS =
  /\b(worried|concerned|afraid|anxious|nervous|scared|bankrupt|insolvent|going\s+under|out\s+of\s+business|run\s+out|can't\s+pay|cash\s*crisis|financial\s+trouble|distress|survive|going\s+broke)\b/i;

const COMPARATIVE_SIGNALS =
  /\b(compare|contrast|explain\s+(?:any|the|why)|difference|differences|affect|affecting|impact|impacting|relate|relationship|between|why\s+(?:is|are|does|do)|how\s+does|align|misalign|gap|diverge|feels?\s+flat|doesn'?t\s+match|what\s+concerns?\s+you|concerns?\s+me|concern\s+you|reconcile|justify|relative\s+to|versus|vs\.?)\b/i;

const ANALYTICAL_INVESTIGATION_SIGNALS =
  /\b(driving\s+the\s+change|what\s+is\s+driving|why\s+is\b.{0,48}\bchang|warning\s+signs?|(?:what\s+should\s+)?management\s+(?:should\s+)?know|most\s+important\s+things|priorities?\s+this\s+month|management\s+priorities?|management\s+briefing|executive\s+briefing|leadership\s+briefing|biggest\s+risks?|financial\s+performance|performing\s+financially|financially\b|financial\s+position|company\s+position|business\s+position|financial\s+picture|full\s+(?:\w+\s+){0,2}picture|walk\s+me\s+through|commercial\s+value|unresolved\s+issues|financial\s+impact|behind\s+schedule|management\s+summary|needs\s+my\s+attention|important\s+enough\s+to\s+affect)\b/i;

const SOFT_CONCERN_SIGNALS =
  /\b(feels?\s+tight|stretched|too\s+thin|losing\s+people|turnover\s+risk|burnout|overworked|can'?t\s+make\s+payroll|make\s+payroll|payroll\s+next)\b/i;

export function detectEvidenceDomains(message: string): EvidenceDomain[] {
  const found: EvidenceDomain[] = [];
  for (const [domain, pattern] of Object.entries(DOMAIN_SIGNALS) as Array<
    [EvidenceDomain, RegExp]
  >) {
    if (pattern.test(message)) found.push(domain);
  }
  return found;
}

export function enrichEvidenceDomains(message: string, domains: EvidenceDomain[]): EvidenceDomain[] {
  const set = new Set(domains);
  if (/\bfinancial\s+(performance|position|health|results?|outlook|picture)\b/i.test(message)) {
    set.add("revenue");
    set.add("cash");
    set.add("profitability");
  }
  if (/\b(sales|selling|pipeline)\s+performance\b/i.test(message) || /\bsales\s+performance\b/i.test(message)) {
    set.add("sales");
  }
  if (/\b(management|executive|leadership)\b/i.test(message) && /\b(know|priorit|focus|brief|important)\b/i.test(message)) {
    set.add("health");
    set.add("revenue");
    set.add("sales");
  }
  if (/\bwarning\s+signs?\b/i.test(message)) {
    set.add("health");
    set.add("cash");
    set.add("revenue");
  }
  if (/\b(bookings?|margins?|p&l|profit\s+and\s+loss)\b/i.test(message)) {
    set.add("revenue");
    set.add("sales");
    set.add("profitability");
  }
  if (/\b(under[- ]?resourced|understaffed|delivery\s+load|sales\s+commitments?)\b/i.test(message)) {
    set.add("projects");
    set.add("sales");
    set.add("headcount");
  }
  if (/\b(payroll|wages|salaries)\b/i.test(message) && /\b(revenue|cash|sustainable|afford)\b/i.test(message)) {
    set.add("payroll");
    set.add("revenue");
    set.add("cash");
  }
  if (/\bdriving\b/i.test(message) && /\b(financ|position|change|performance)\b/i.test(message)) {
    set.add("revenue");
    set.add("cash");
    set.add("expenses");
  }
  return [...set];
}

export function isOpenEndedConcern(message: string): boolean {
  const lower = message.toLowerCase();
  if (/\bwhat'?s worrying you\b/.test(lower)) return true;
  if (/\banything i should know\b/.test(lower)) return true;
  if (CONCERN_SIGNALS.test(lower)) return true;
  if (SOFT_CONCERN_SIGNALS.test(lower) && /\b(worried|concerned|not\s+sure|anxious|help|risk|should\s+i\s+know)\b/i.test(lower)) {
    return true;
  }
  if (/\bhelp me understand (the )?risk\b/i.test(lower)) return true;
  if (/\bhelp\b/i.test(lower) && CONCERN_SIGNALS.test(lower)) return true;
  if (
    /\b(are we|will we|is the company)\b/i.test(lower) &&
    /\b(ok|alright|fine|safe|survive|sustainable)\b/i.test(lower)
  ) {
    return true;
  }
  if (
    /\bwhat should (we|i) do\b/i.test(lower) &&
    /\b(financ|cash|money|business|company)\b/i.test(lower)
  ) {
    return true;
  }
  return false;
}

export function isAnalyticalInvestigation(message: string): boolean {
  return ANALYTICAL_INVESTIGATION_SIGNALS.test(message);
}

export function isComparativeQuestion(message: string, domains: EvidenceDomain[]): boolean {
  const enriched = enrichEvidenceDomains(message, domains);
  const hasSales =
    enriched.includes("sales") || /\b(sales|pipeline|crm|selling|bookings?)\b/i.test(message);
  const hasFinance =
    enriched.some((d) => FINANCE_DOMAINS.includes(d)) ||
    /\bfinancial\s+(performance|position|results?)\b/i.test(message) ||
    /\b(p&l|margins?|revenue\s+forecast|cash|ar\b)\b/i.test(message);
  const hasProjects =
    enriched.includes("projects") || /\b(projects?|delivery)\b/i.test(message);

  if (hasSales && hasFinance && COMPARATIVE_SIGNALS.test(message)) return true;
  if (hasProjects && hasSales && COMPARATIVE_SIGNALS.test(message)) return true;
  if (/\breconcile\b/i.test(message) && hasSales && hasFinance) return true;
  if (/\bjustify\b/i.test(message) && hasSales && hasFinance) return true;

  if (enriched.length < 2) return false;
  if (
    enriched.includes("revenue") &&
    enriched.includes("expenses") &&
    /\b(revenue|sales)\b[\s\S]{0,40}\b(expenses?|costs)\b/i.test(message) &&
    !/\b(affect|impact|explain|difference|compare|why|pipeline|sales|crm|concern)\b/i.test(message)
  ) {
    return false;
  }
  return COMPARATIVE_SIGNALS.test(message);
}

export function messageNeedsFinance(message: string, domains: EvidenceDomain[]): boolean {
  return (
    domains.some((d) => FINANCE_DOMAINS.includes(d)) ||
    /\b(financ|revenue|cash|runway|p&l|profit|margin|burn|ar\b|ap\b|payable|receivable|liquidity)\b/i.test(
      message,
    )
  );
}

export function messageNeedsHr(message: string, domains: EvidenceDomain[]): boolean {
  return (
    domains.includes("headcount") ||
    domains.includes("payroll") ||
    /\b(headcount|employees?|staff|workforce|hr\b|people|hiring|turnover)\b/i.test(message)
  );
}
