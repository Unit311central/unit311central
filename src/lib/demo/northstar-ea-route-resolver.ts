/**
 * Deterministic EA routing for Northstar demo — maps NL / catalogue views to queryModule.
 */

import "server-only";

import { listPlatformModules } from "@/lib/ai-operating-assistant/application-catalogue";
import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { resolveNorthstarModuleId, type NorthstarModuleId } from "@/lib/demo/northstar-module-id";
import { parseScopedPdfRequest } from "@/lib/ai-operating-assistant/scoped-pdf-metrics";
import { resolveNorthstarExecutiveIntelligenceIntent } from "@/lib/demo/executive-intelligence-intent";
import { resolveAbhiBoardPackIntent } from "@/lib/abhi/board-pack-intent";
import { isLiveFinancialBalanceQuestion } from "@/lib/ai-operating-assistant/knowledge-domains";
import { hasExplicitWriteIntent } from "@/lib/ai-operating-assistant/intent-action-resolver";

export type NorthstarEaRoute = {
  tool: string;
  args: Record<string, unknown>;
  reason: string;
};

const VIEW_TO_MODULE: Record<string, { module: NorthstarModuleId; focus?: string }> = {
  home: { module: "home" },
  "executive-assistant": { module: "executive-assistant" },
  "demo-company-intelligence": { module: "intelligence", focus: "company" },
  "demo-client-intelligence": { module: "intelligence", focus: "client" },
  "demo-market-intelligence": { module: "intelligence", focus: "market" },
  "business-central-dashboard": { module: "business-central" },
  clients: { module: "clients" },
  "clients-dashboard": { module: "clients", focus: "dashboard" },
  "member-intelligence": { module: "business-central", focus: "member intelligence" },
  crm: { module: "business-central", focus: "crm pipeline" },
  "crm-meetings": { module: "business-central", focus: "discovery meetings" },
  "client-onboarding": { module: "business-central", focus: "onboarding" },
  "potential-clients": { module: "business-central", focus: "potential clients" },
  representatives: { module: "sales-management", focus: "partners" },
  "sales-management": { module: "sales-management" },
  grants: { module: "grants" },
  financials: { module: "financials" },
  "general-ledger": { module: "financials", focus: "general ledger" },
  "accounts-receivable": { module: "financials", focus: "accounts receivable" },
  "accounts-payable": { module: "financials", focus: "accounts payable" },
  expenses: { module: "financials", focus: "expenses" },
  wise: { module: "financials", focus: "bank cash" },
  "financial-reports": { module: "financials", focus: "financial reports" },
  "fundraising-dashboard": { module: "fundraising" },
  "fundraising-investors": { module: "fundraising", focus: "investors" },
  "fundraising-cap-table": { module: "fundraising", focus: "cap table" },
  "fundraising-pipeline": { module: "fundraising", focus: "pipeline" },
  "fundraising-meetings": { module: "fundraising", focus: "meetings" },
  "fundraising-pitch-decks": { module: "fundraising", focus: "pitch decks" },
  "fundraising-data-rooms": { module: "fundraising", focus: "data rooms" },
  "hr-dashboard": { module: "hr", focus: "dashboard" },
  hr: { module: "hr", focus: "employees" },
  "hr-org-chart": { module: "hr", focus: "org chart" },
  "hr-recruitment": { module: "hr", focus: "recruitment" },
  "hr-leave": { module: "hr", focus: "leave attendance" },
  "hr-payroll": { module: "hr", focus: "payroll" },
  "hr-performance": { module: "hr", focus: "performance reviews" },
  "hr-reports": { module: "hr", focus: "hr reports headcount" },
  "oa-marketing-dashboard": { module: "marketing" },
  "marketing-newsletter": { module: "marketing", focus: "newsletter" },
  "marketing-events": { module: "marketing", focus: "events" },
  "marketing-event-management": { module: "marketing", focus: "event management" },
  "marketing-mailing-list": { module: "marketing", focus: "mailing list" },
  "portfolio-stories": { module: "marketing", focus: "client stories" },
  "projects-dashboard": { module: "project-management" },
  "projects-internal": { module: "project-management", focus: "internal projects" },
  "projects-external": { module: "project-management", focus: "external projects" },
  "engineering-dashboard": { module: "engineering" },
  "engineering-programs": { module: "engineering", focus: "programs milestones" },
  "engineering-capacity": { module: "engineering", focus: "team capacity" },
  "engineering-risks": { module: "engineering", focus: "risks" },
  "engineering-sops": { module: "engineering", focus: "standard operating procedures SOPs" },
  "corporate-dashboard": { module: "corporate" },
  "corporate-company-details": { module: "corporate", focus: "company details" },
  "office-locations": { module: "corporate", focus: "office locations" },
  "corporate-bank-accounts": { module: "corporate", focus: "bank accounts" },
  "corporate-advisers": { module: "corporate", focus: "advisors" },
  "corporate-contracts": { module: "corporate", focus: "contracts" },
  "board-dashboard": { module: "board" },
  "board-meetings": { module: "board", focus: "meetings" },
  "board-minutes": { module: "board", focus: "minutes" },
  "board-members": { module: "board", focus: "members" },
  "board-pack": { module: "board", focus: "board deck" },
  "corporate-risk-register": { module: "board", focus: "risk register" },
  "technology-dashboard": { module: "technology" },
  "technology-architecture": { module: "technology", focus: "architecture" },
  "technology-devices": { module: "technology", focus: "devices" },
  "technology-software-dashboard": { module: "technology", focus: "software saas" },
  "technology-software": { module: "technology", focus: "software" },
  "technology-telecommunications": { module: "technology", focus: "telecom" },
  "productivity-dashboard": { module: "productivity" },
  "content-studio": { module: "productivity", focus: "content studio" },
  "files-internal": { module: "productivity", focus: "internal files" },
  "files-external": { module: "productivity", focus: "external files" },
  "files-client": { module: "productivity", focus: "client files" },
  "info-email": { module: "productivity", focus: "email" },
  calendar: { module: "productivity", focus: "calendar" },
  messaging: { module: "productivity", focus: "messaging" },
  communications: { module: "productivity", focus: "communications" },
  social: { module: "productivity", focus: "social" },
  whiteboard: { module: "productivity", focus: "whiteboard" },
  "support-overview": { module: "support", focus: "overview" },
  support: { module: "support", focus: "tickets" },
  "support-mine": { module: "support", focus: "my tickets" },
  "whatsapp-integration": { module: "support", focus: "whatsapp" },
  "operations-dashboard": { module: "operations" },
  assets: { module: "operations", focus: "assets" },
  "inventory-management": { module: "operations", focus: "inventory" },
  procurement: { module: "operations", focus: "procurement" },
  logistics: { module: "operations", focus: "logistics" },
  "training-dashboard": { module: "training" },
  "course-builder": { module: "training", focus: "course builder" },
  training: { module: "training", focus: "staff courses" },
  "training-external": { module: "training", focus: "external courses" },
  "qms-training": { module: "training", focus: "qms courses" },
  "quality-management": { module: "qms" },
  "qms-document-control": { module: "qms", focus: "document control" },
  "qms-capa": { module: "qms", focus: "capa" },
  "qms-internal-audits": { module: "qms", focus: "internal audits" },
  "qms-management-review": { module: "qms", focus: "management review" },
  "qms-reports": { module: "qms", focus: "qms reporting" },
  "website-management": { module: "tools", focus: "website" },
  integrations: { module: "tools", focus: "integrations" },
  testing: { module: "tools", focus: "testing" },
  telemetry: { module: "tools", focus: "telemetry" },
  users: { module: "tools", focus: "users" },
  "external-client-access": { module: "external-client-access" },
  "users-external": { module: "external-client-access", focus: "external users" },
  profile: { module: "settings", focus: "profile" },
  settings: { module: "settings", focus: "general" },
  billing: { module: "settings", focus: "billing" },
  appearance: { module: "settings", focus: "appearance" },
};

function moduleRoute(
  module: NorthstarModuleId,
  question: string,
  reason: string,
  focus?: string,
  pageLabel?: string,
  viewId?: string,
): NorthstarEaRoute {
  return {
    tool: "northstar.queryModule",
    args: {
      module,
      question,
      ...(focus ? { focus } : {}),
      ...(pageLabel ? { pageLabel } : {}),
      ...(viewId ? { viewId } : {}),
    },
    reason,
  };
}

function hasNavigationOpenIntent(lower: string): boolean {
  if (
    /\b(open rate|open vacancies|open capas?|open projects?|open leads?|open tickets?|open pos?|opening balance)\b/i.test(
      lower,
    )
  ) {
    return false;
  }
  return (
    /\bhow do i open\b/i.test(lower) ||
    /\b(open|go to|navigate to|take me to)\s+(the\s+)?[a-z]/i.test(lower)
  );
}

function isPlatformNavigationQuestion(lower: string): boolean {
  return (
    /\b(where|navigate|take\s+me\s+to|go\s+to)\b/i.test(lower) ||
    /\bhow do i open\b/i.test(lower) ||
    hasNavigationOpenIntent(lower) ||
    (/\bwhere\s+is\b/i.test(lower) &&
      /\b(platform|sidebar|application|unit311|unit\s*311)\b/i.test(lower)) ||
    /\b(what\s+(?:apps?|applications|pages)\s+(?:are\s+)?(?:under|in|inside)|applications?\s+(?:are\s+)?(?:under|in))\b/i.test(
      lower,
    )
  );
}

/** Module/sub-page reads that must not become scoped PDF generation (e.g. "document control"). */
function isModuleDataReadNotPdf(lower: string): boolean {
  if (/\b(create|generate|make|export|pdf|report|pack|board\s+deck)\b/i.test(lower)) return false;
  if (/\bwhat data is on the .+ screen\b/i.test(lower)) return true;
  if (
    /\b(summari[sz]e|show me|what are the key kpis|what needs attention|what changed recently)\b/i.test(
      lower,
    ) &&
    /\bin\s+[a-z0-9]/i.test(lower)
  ) {
    return true;
  }
  if (/\bdocument control\b/i.test(lower)) return true;
  return false;
}

function resolveCataloguePageRoute(text: string, lower: string): NorthstarEaRoute | null {
  const modules = listPlatformModules({ workspaceSlug: DEMO_WORKSPACE_SLUG });
  let best: {
    label: string;
    moduleId: string;
    pageLabel: string;
    viewId?: string;
    mapping: { module: NorthstarModuleId; focus?: string } | null;
  } | null = null;

  for (const mod of modules) {
    for (const app of mod.applications) {
      for (const page of app.pages) {
        const label = page.label?.toLowerCase() ?? "";
        if (label.length < 3 || !lower.includes(label)) continue;
        const viewMapping = page.viewId ? VIEW_TO_MODULE[page.viewId] : null;
        const defaultMapping = mod.navigation.defaultViewId
          ? VIEW_TO_MODULE[mod.navigation.defaultViewId]
          : null;
        if (!best || label.length > best.label.length) {
          best = {
            label,
            moduleId: mod.id,
            pageLabel: page.label,
            viewId: page.viewId,
            mapping: viewMapping ?? defaultMapping,
          };
        }
      }
    }
  }

  if (!best) return null;

  const module =
    best.mapping?.module ??
    resolveNorthstarModuleId(best.moduleId.replace(/-/g, " ")) ??
    resolveNorthstarModuleId(best.label);
  if (!module) return null;

  return moduleRoute(
    module,
    text,
    `northstar_catalogue_page_${best.moduleId}_${slugifyPageLabel(best.label)}`,
    best.mapping?.focus ?? best.pageLabel.toLowerCase(),
    best.pageLabel,
    best.viewId,
  );
}

function slugifyPageLabel(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function resolveNorthstarEaDataRoute(message: string): NorthstarEaRoute | null {
  const text = message.trim();
  if (!text) return null;
  const lower = text.toLowerCase();

  if (hasExplicitWriteIntent(text)) return null;

  if (isPlatformNavigationQuestion(lower)) {
    return null;
  }

  if (!isModuleDataReadNotPdf(lower)) {
  const scopedPdf = parseScopedPdfRequest(text);
  if ((scopedPdf.metrics.length > 0 || scopedPdf.unknownTopics.length > 0) && scopedPdf.wantsDocument) {
    return {
      tool: "generateScopedBusinessPdf",
      args: { prompt: text, metrics: scopedPdf.metrics },
      reason: "northstar_scoped_pdf",
    };
  }
  }

  const boardPack = resolveAbhiBoardPackIntent(text);
  if (boardPack) {
    return { tool: boardPack.tool, args: boardPack.args ?? {}, reason: "northstar_board_pack" };
  }

  const execIntel = resolveNorthstarExecutiveIntelligenceIntent(text);
  if (execIntel) {
    return { tool: execIntel.tool, args: execIntel.args, reason: execIntel.reason };
  }

  if (/\bpayroll\b/i.test(lower) && /\b(last|past|previous)\s+(\d+|six|6)\s+months?\b/i.test(lower)) {
    return { tool: "queryPayroll", args: { intent: "trend" }, reason: "northstar_payroll_trend" };
  }

  if (/\bon leave|leave request|who is on leave|absence|time off|pto\b|out of office\b/.test(lower)) {
    return moduleRoute("hr", text, "northstar_hr_leave", "leave attendance");
  }

  if (isLiveFinancialBalanceQuestion(text)) {
    return { tool: "getCashPosition", args: {}, reason: "northstar_cash_balance" };
  }

  const cataloguePage = resolveCataloguePageRoute(text, lower);
  if (cataloguePage) return cataloguePage;

  for (const [viewId, mapping] of Object.entries(VIEW_TO_MODULE)) {
    const page = listPlatformModules({ workspaceSlug: DEMO_WORKSPACE_SLUG })
      .flatMap((m) => m.applications.flatMap((a) => a.pages))
      .find((p) => p.viewId === viewId);
    const label = page?.label?.toLowerCase() ?? "";
    if (label && lower.includes(label)) {
      return moduleRoute(
        mapping.module,
        text,
        `northstar_view_${viewId}`,
        mapping.focus,
        page?.label,
        viewId,
      );
    }
  }

  const moduleId = resolveNorthstarModuleId(lower);
  if (moduleId) {
    return moduleRoute(moduleId, text, `northstar_module_${moduleId}`);
  }

  const modules = listPlatformModules({ workspaceSlug: DEMO_WORKSPACE_SLUG });
  for (const mod of modules) {
    const names = [mod.label, mod.displayName, mod.id.replace(/-/g, " ")].map((s) => s.toLowerCase());
    if (names.some((name) => lower.includes(name))) {
      const mapped = mod.navigation.defaultViewId
        ? VIEW_TO_MODULE[mod.navigation.defaultViewId]
        : null;
      if (mapped) {
        return moduleRoute(mapped.module, text, `northstar_catalogue_${mod.id}`, mapped.focus);
      }
      const resolved = resolveNorthstarModuleId(mod.label);
      if (resolved) return moduleRoute(resolved, text, `northstar_catalogue_${mod.id}`);
    }
  }

  return null;
}
