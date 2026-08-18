/**
 * Northstar module identifiers + lightweight NL → module routing (client-safe).
 */

export type NorthstarModuleId =
  | "home"
  | "executive-assistant"
  | "business-central"
  | "financials"
  | "engineering"
  | "fundraising"
  | "board"
  | "intelligence"
  | "clients"
  | "grants"
  | "support"
  | "qms"
  | "hr"
  | "marketing"
  | "operations"
  | "technology"
  | "training"
  | "corporate"
  | "project-management"
  | "productivity"
  | "tools"
  | "external-client-access"
  | "settings";

export function resolveNorthstarModuleId(raw: string): NorthstarModuleId | null {
  const lower = raw.toLowerCase();
  if (/\bhome\b|executive\s+dashboard/.test(lower)) return "home";
  if (/\bexecutive\s+assistant\b|\bea\b/.test(lower) && !/briefing/.test(lower)) return "executive-assistant";
  if (
    /hr|human\s+resources|headcount|staff|employee|people|fte|hiring|org\s+chart/.test(lower) &&
    !/\bpayroll\b/.test(lower)
  )
    return "hr";
  if (/financial|margin|revenue|cash|p\s*&\s*l|gl|treasury|ar\b|ap\b|ledger|invoice|expense/.test(lower))
    return "financials";
  if (/engineering|atlas|firmware|voltex|programme|program|milestone|edge\s+controller/.test(lower))
    return "engineering";
  if (/fundraising|seed\s+round|investor|pipeline|term\s+sheet|data\s+room|cap\s+table|pitch\s+deck/.test(lower))
    return "fundraising";
  if (/grant|innovate\s+uk|horizon|ukri|eu\s+funding/.test(lower)) return "grants";
  if (/board|governance|minutes|director/.test(lower)) return "board";
  if (/sheffield|client|account|renewal|churn|customer|crm|onboarding|discovery|partner/.test(lower))
    return "clients";
  if (/business\s+central|member\s+intelligence/.test(lower)) return "business-central";
  if (/support|ticket|helpdesk|mag-sup/.test(lower)) return "support";
  if (/qms|quality|capa|audit|iso/.test(lower)) return "qms";
  if (/intelligence|competitor|senseforge|market|regulatory/.test(lower)) return "intelligence";
  if (/marketing|newsletter|mailing|event/.test(lower)) return "marketing";
  if (/operations|inventory|procurement|asset|logistics|warehouse/.test(lower)) return "operations";
  if (/technology|saas|telecom|device|infrastructure|software/.test(lower)) return "technology";
  if (/training|course|lms|learning/.test(lower)) return "training";
  if (/corporate|company\s+details|office\s+location|contract/.test(lower)) return "corporate";
  if (/project\s+management|internal\s+project|external\s+project/.test(lower)) return "project-management";
  if (/productivity|file\s+explorer|calendar|messaging|email/.test(lower)) return "productivity";
  if (/integration|telemetry|website\s+management/.test(lower)) return "tools";
  if (/external\s+client|client\s+portal/.test(lower)) return "external-client-access";
  if (/settings|billing|appearance|profile/.test(lower)) return "settings";
  return null;
}
