/**
 * Executive Assistant knowledge domains — permanent foundation.
 *
 * These three domains are completely independent. Routing must choose one
 * before tools are selected. Never answer a domain from another domain’s source.
 *
 * 1) PLATFORM   → Application Catalogue (modules / apps / pages / views)
 * 2) CAPABILITY → Action Registry / Capability Graph (executable actions)
 * 3) BUSINESS   → Live business data tools (clients, projects, invoices, …)
 *
 * Write requests are a CAPABILITY path that ends in the Action Framework
 * (propose → Plan Viewer → executeActionPlan), not a fourth knowledge source.
 */

export type EaKnowledgeDomain =
  | "platform"
  | "capability"
  | "business"
  | "write"
  | "unknown";

export type EaKnowledgeClassification = {
  domain: EaKnowledgeDomain;
  reason: string;
};

const PLATFORM_HINT =
  /\b(application\s+catalogue|platform\s+structure|what\s+is\s+under|applications?\s+(are\s+)?under|apps?\s+(are\s+)?under|pages?\s+(are\s+)?under|open\s+(financials|human\s+resources|hr|operations|settings|business\s+central)|where\s+(do\s+i|can\s+i)\s+(find|manage|open)|go\s+to\s+(financials|hr|human\s+resources)|list\s+(all\s+)?(platform\s+)?modules?\b|what\s+modules?\s+(exist|are\s+there|are\s+available)|tell\s+me\s+about|what\s+can\s+i\s+do\s+in|explain\s+the|describe\s+the|overview\s+of)\b/i;

const CAPABILITY_HINT =
  /\b(what\s+can\s+you\s+(do|help|show|tell|answer|provide|generate|configure|change)|what\s+can\s+you\s+help\s+me\s+with|what\s+are\s+you\s+(able|capable)\s+of|list\s+(your\s+)?(capabilities|actions)|what\s+actions?\s+(exist|are\s+(there|available)|for)|can\s+you\s+(create|add|archive|update|assign|merge)|capabilities?\s+for|actions?\s+for|what\s+\w+\s+can\s+you\b)\b/i;

const WRITE_HINT =
  /\b(create|add|register|archive|restore|activate|assign|merge|update|delete|terminate|approve|reject|cancel|book|reserve|reschedule|move|mark|qualify|chase|switch|confirm|write\s*off|approve\s+payment|signed|signing|we've\s+just\s+signed|just\s+signed|onboard|set\s*up|schedule|send|convert|close|tag|record|enrol|enroll|publish|retire|deactivate|revoke|connect|wire|remit|transfer\s+(?:funds|money|£|\$|€))\b/i;

const BUSINESS_HINT =
  /\b(show\s+(my\s+|our\s+|the\s+)?|list\s+(my\s+|our\s+|the\s+)?|how\s+many|how\s+much\s+cash|how\s+healthy|who\s+(manages|owns|is|owes|can\s+grant)|overdue|at\s+risk|biggest\s+risks|outstanding|which\s+(projects|clients|customers|modules|locations|certificates|integrations|courses|environments|tools|careers?)|clients?\b|customers?\b|employees?\b|invoices?\b|subscriptions?\b|billing\b|mrr\b|signup|quarterly\s+in\s+advance|should\s+pay|headcount|cash\s+(position|do\s+we\s+have|balance)|overloaded|workload|what\s+(has\s+)?changed|what\s+happened|miss\s+deadlines?|highest\s+overdue|summarise|summarize|attention|focus\s+on\s+today|opportunities|pipeline|behind\s+schedule|delegate|meeting\s+with|leave|overnight|since\s+yesterday|portfolio|status|quiet|joined|blocking|one-line|overview|cap\s*table|office\s+locations?|bank\s+accounts?|share\s+classes?|advisers?|advisors?|go\s*live|sign-?off|enabled|production-critical|mfa|vendor\s+sync|api\s+credentials?|security\s+brief|wordmark|sops?\b|careers?\s+listings?)\b/i;

/** Org rollout / enablement state — live business, not Application Catalogue. */
export function isOrgModuleStateQuestion(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    /\bmodules?\b/i.test(lower) &&
    /\b(enabled|go\s*live|go-live|sign-?off|ready|for\s+us|rolled\s+out|live\s+for|owner)\b/i.test(
      lower,
    )
  );
}

/** CEO-style status / lookup reads that should hit live data, not freeform platform tools. */
export function isBusinessStatusRead(message: string): boolean {
  const lower = message.trim().toLowerCase();
  if (!lower) return false;
  if (isOrgModuleStateQuestion(lower)) return true;
  if (
    /^(what|which|who|where|when|why|how|any|are|is|give|preview|show|list|summarise|summarize|find|flag|run|confirm)\b/i.test(
      lower,
    )
  ) {
    return true;
  }
  return /\b(status|brief|enabled|complete|live|credentials?|stored|today|linked|correct|concentrated)\b/i.test(
    lower,
  );
}

/**
 * Coarse domain classification used before tool selection.
 * Fine-grained handlers (Application Catalogue / Capability Graph / intent router)
 * remain the source of truth for answers — this only enforces domain priority.
 */
export function classifyKnowledgeDomain(message: string): EaKnowledgeClassification {
  const text = message.trim();
  if (!text) return { domain: "unknown", reason: "empty" };
  const lower = text.toLowerCase();

  if (
    /\b(tell\s+me\s+about|what\s+is\s+the|what's\s+in|explain\s+the|describe\s+the|what\s+does\s+the|what\s+can\s+i\s+do\s+in|how\s+does\s+the)\b[\s\S]{0,60}\b(module|section|workspace|area)\b/i.test(
      lower,
    ) ||
    /\b(overview\s+of|applications?\s+in|apps?\s+in|pages?\s+in)\b/i.test(lower)
  ) {
    return { domain: "platform", reason: "module_natural_language" };
  }

  // Org module enablement / go-live is live business state, not catalogue listing.
  if (isOrgModuleStateQuestion(lower)) {
    return { domain: "business", reason: "org_module_state" };
  }

  // Find / where / run-report / confirm-linked are live lookups, not writes or catalogue.
  if (
    /^(find|where|flag)\b/i.test(lower) ||
    /\brun\s+(a\s+|an\s+|the\s+)?[\w\s-]{0,40}\breport\b/i.test(lower) ||
    /\bconfirm\b[\s\S]{0,40}\b(is|are|linked|correct|connected)\b/i.test(lower) ||
    /\bwhere\b[\s\S]{0,40}\b(spend|concentrated)\b/i.test(lower)
  ) {
    return { domain: "business", reason: "live_lookup_or_status" };
  }

  // Platform structure first — never confuse with Action Registry.
  if (
    PLATFORM_HINT.test(lower) &&
    !/\b(what\s+can\s+you\s+do|what\s+actions?\s+exist\s+for|capabilities?\s+for)\b/i.test(lower)
  ) {
    // "Show my clients" is business data, not "show me [module]".
    if (
      /\b(show|list)\s+(my\s+)?(clients?|projects?|employees?|invoices?|tasks?)\b/i.test(lower)
    ) {
      return { domain: "business", reason: "live_list_request" };
    }
    return { domain: "platform", reason: "platform_structure_language" };
  }

  // Capability catalogue / discovery (not execution yet).
  if (
    CAPABILITY_HINT.test(lower) &&
    !/\b(called|named)\b/i.test(lower) &&
    !/\b(ltd|limited|llc|inc|plc)\b/i.test(lower)
  ) {
    return { domain: "capability", reason: "capability_discovery_language" };
  }

  // Explicit write with entity → Action Framework.
  // Never treat interrogative reads as writes ("Which clients…", "How healthy…").
  if (
    /^(what|which|who|where|when|why|how|any|show|list|give\s+me|summarise|summarize)\b/i.test(
      lower,
    ) &&
    !/\b(called|named|titled)\b/i.test(lower)
  ) {
    if (BUSINESS_HINT.test(lower) || CAPABILITY_HINT.test(lower) || PLATFORM_HINT.test(lower)) {
      if (CAPABILITY_HINT.test(lower)) {
        return { domain: "capability", reason: "capability_discovery_language" };
      }
      if (
        PLATFORM_HINT.test(lower) &&
        !/\b(show|list)\s+(my\s+)?(clients?|projects?|employees?|invoices?|tasks?)\b/i.test(lower)
      ) {
        return { domain: "platform", reason: "platform_structure_language" };
      }
      return { domain: "business", reason: "interrogative_business_read" };
    }
  }

  // Explicit write with entity → Action Framework.
  // Never treat PDF/report generation as a write ("create me a pdf…").
  if (
    /\b(pdf|report|pack|directory|document|export)\b/i.test(lower) &&
    /\b(create|make|generate|export|produce|build|prepare|give|get|show)\b/i.test(lower) &&
    !/\b(called|named|titled)\b/i.test(lower)
  ) {
    return { domain: "business", reason: "document_generation_request" };
  }

  if (
    WRITE_HINT.test(lower) &&
    (/\b(called|named|titled)\b/i.test(lower) ||
      /\b(ltd|limited|llc|inc|plc|holdings|engineering)\b/i.test(lower) ||
      /\b(this|that|the)\s+(client|project|employee|invoice)\b/i.test(lower))
  ) {
    return { domain: "write", reason: "write_with_entity" };
  }

  if (
    WRITE_HINT.test(lower) &&
    !/^(what|which|where|how|any|who|show|list)\b/i.test(lower) &&
    !/\b(what|which|where|how\s+many|show|list)\b/i.test(lower)
  ) {
    return { domain: "write", reason: "write_language" };
  }

  if (BUSINESS_HINT.test(lower)) {
    return { domain: "business", reason: "live_business_language" };
  }

  return { domain: "unknown", reason: "fallback" };
}

export const KNOWLEDGE_DOMAIN_SOURCES = {
  platform: {
    name: "Application Catalogue",
    purpose: "Understand the workspace platform structure (modules → applications → pages/views).",
    tools: ["listPlatformModules", "searchApplications"],
  },
  capability: {
    name: "Action Registry",
    purpose: "Understand executable business capabilities.",
    tools: ["listBusinessActions", "searchCapabilities"],
  },
  business: {
    name: "Live business data",
    purpose: "Understand the user’s organisation records.",
    tools: ["queryBusiness", "searchClients", "searchProjects", "searchInvoices", "searchEmployees"],
  },
  write: {
    name: "Action Framework",
    purpose: "Propose and execute registered write capabilities via Plan Viewer.",
    tools: ["proposeBusinessActionPlan", "planBusinessGoal"],
  },
} as const;
