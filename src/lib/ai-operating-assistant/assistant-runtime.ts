import { resolveBoardPackSummaryName } from "./boardpack-summary";
import {
  ensureActionModulesRegistered,
  redirectManualGuidanceToActionPlan,
  resolveOrchestrationRoute,
} from "./action-orchestration";
import { getAssistantAction } from "./actions/registry";
import {
  cardsFromArtifacts,
  cardsFromBoardPackNeedsDate,
  cardsFromBoardPackSuccess,
} from "./execution-card-adapters";
import { eaStage, eaStop, getEaCorrelationId, setEaConversationId } from "./ea-forensic-trace";
import { topicHintFromHistory } from "./intent-router";
import { extractConversationEntityMemory } from "./intent-action-resolver";
import { loadOperatorMemory } from "./operator-memory";
import {
  createAssistantResponse,
  formatOpenAIError,
  getAssistantModel,
  isRetryableOpenAIError,
} from "./openai-client";
import { buildBusinessContext } from "./context-service";
import { buildStructuredJsonHint, buildSystemInstructions } from "./prompt-service";
import { executeAssistantTool, getOpenAIToolSchemas, resolveAssistantToolName } from "./tool-service";
import { getAssistantArtifact } from "./artifact-store";
import {
  createConversation,
  createMessageId,
  getConversationForUser,
  titleFromMessages,
  updateConversation,
} from "./conversation-service";
import { recordQualityEvent } from "./feedback-service";
import type {
  AssistantBusinessContext,
  AssistantChatMessage,
  AssistantChatRequest,
  AssistantStreamEvent,
} from "./types";
import type { PlatformSession } from "@/lib/platform-auth";
import { isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";
import {
  buildExecutiveSynthesisDeveloperMessage,
  shouldSynthesizeExecutiveToolResult,
} from "./ea-llm-synthesis";
import { classifyKnowledgeDomain } from "./knowledge-domains";
import { getReadCapability } from "./capabilities/read-registry";
import { recordEaExecutionTelemetry } from "./capabilities/execution-telemetry";
import {
  executeEvidencePlan,
  getSemanticCapability,
} from "@/lib/central-application-model";
import { adaptExecutiveOrchestrationResult } from "./artifact-output";

type EasyInputMessage = {
  role: "user" | "assistant" | "system" | "developer";
  content: string;
};

function toInputMessages(
  history: AssistantChatMessage[],
  latestUserMessage: string,
): EasyInputMessage[] {
  const prior = history
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-24)
    .map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.content,
    }));

  return [...prior, { role: "user", content: latestUserMessage }];
}

/** Drop inlined file bytes before SSE — large base64 payloads break the client stream. */
function stripStreamPayloadBytes<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((entry) => stripStreamPayloadBytes(entry)) as T;
  }
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(record)) {
    if (
      key === "contentBase64" ||
      key === "pdfContentBase64" ||
      key === "pptxContentBase64"
    ) {
      continue;
    }
    next[key] = stripStreamPayloadBytes(entry);
  }
  return next as T;
}

function encodeSse(event: AssistantStreamEvent) {
  return `data: ${JSON.stringify(stripStreamPayloadBytes(event))}\n\n`;
}

async function resolveHistory(
  session: PlatformSession,
  request: AssistantChatRequest,
  _context: AssistantBusinessContext,
): Promise<{ conversationId: string | null; history: AssistantChatMessage[]; title: string }> {
  const clientPrior = (request.messages ?? [])
    .filter((message) => message.role === "user" || message.role === "assistant")
    .filter((message) => message.id !== "welcome" && message.content.trim().length > 0);

  if (request.conversationId && isSupabaseServiceRoleConfigured()) {
    const existing = await getConversationForUser(request.conversationId, session.sub);
    if (existing) {
      const dbHistory = existing.messages.filter(
        (message) =>
          (message.role === "user" || message.role === "assistant") &&
          message.id !== "welcome" &&
          message.content.trim().length > 0,
      );
      // Prefer the longer continuous thread so client/server never drop context.
      // Prefer client copies when they carry durable artifact bytes (base64).
      const base = dbHistory.length >= clientPrior.length ? dbHistory : clientPrior;
      const clientById = new Map(clientPrior.map((message) => [message.id, message]));
      const history = base.map((message) => {
        const client = clientById.get(message.id);
        if (client?.artifacts?.some((artifact) => Boolean(artifact.contentBase64))) {
          return client;
        }
        return message;
      });
      // Append any newer client-only turns not yet in DB.
      const knownIds = new Set(history.map((message) => message.id));
      for (const message of clientPrior) {
        if (!knownIds.has(message.id)) history.push(message);
      }
      return {
        conversationId: existing.id,
        history,
        title: existing.title,
      };
    }
  }

  if (clientPrior.length) {
    return {
      conversationId: request.conversationId ?? null,
      history: clientPrior,
      title: titleFromMessages(clientPrior),
    };
  }

  return {
    conversationId: null,
    history: [],
    title: "New conversation",
  };
}

function formatSearchEmployeesReply(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;
  const status = String((result as { status?: string }).status ?? "");
  if (status === "error" || status === "forbidden") {
    return (
      (typeof (result as { error?: string }).error === "string" &&
        (result as { error: string }).error) ||
      "I could not load employees."
    );
  }
  const items = (result as { items?: Array<Record<string, unknown>> }).items;
  if (!Array.isArray(items)) return null;
  const summary = (result as { summary?: Record<string, unknown> }).summary;
  const headcount =
    typeof summary?.headcount === "number" ? summary.headcount : items.length;
  if (items.length === 0) {
    return (
      (typeof summary?.message === "string" && summary.message) ||
      `There are currently no employees matching that request. Headcount on file: ${headcount}.`
    );
  }
  const lines = items.slice(0, 40).map((item, index) => {
    const name = String(item.fullName ?? "—");
    const department = String(item.department ?? "—");
    const role = String(item.role ?? "—");
    return `${index + 1}. ${name} — ${department} — ${role}`;
  });
  const more =
    items.length > 40 ? `\n…and ${items.length - 40} more.` : "";
  const lead =
    (typeof summary?.message === "string" && summary.message) ||
    `I found ${items.length} employee${items.length === 1 ? "" : "s"}.`;
  return `${lead}\n\n${lines.join("\n")}${more}`;
}

function formatListedToolReply(
  result: unknown,
  options: {
    emptyFallback: string;
    line: (item: Record<string, unknown>, index: number) => string;
    maxLines?: number;
  },
): string | null {
  if (!result || typeof result !== "object") return null;
  const status = String((result as { status?: string }).status ?? "");
  const summary = (result as { summary?: Record<string, unknown> }).summary;
  if (status === "error" || status === "forbidden") {
    return (
      (typeof (result as { error?: string }).error === "string" &&
        (result as { error: string }).error) ||
      (typeof summary?.message === "string" && summary.message) ||
      "That query could not be completed."
    );
  }
  const items = (result as { items?: Array<Record<string, unknown>> }).items;
  if (!Array.isArray(items)) {
    return typeof summary?.message === "string" ? summary.message : null;
  }
  if (items.length === 0) {
    return (typeof summary?.message === "string" && summary.message) || options.emptyFallback;
  }
  const max = options.maxLines ?? 40;
  const lines = items.slice(0, max).map((item, index) => options.line(item, index));
  const more = items.length > max ? `\n…and ${items.length - max} more.` : "";
  const lead =
    (typeof summary?.message === "string" && summary.message) ||
    `I found ${items.length} result${items.length === 1 ? "" : "s"}.`;
  return `${lead}\n\n${lines.join("\n")}${more}`;
}

function money(value: unknown, currency = "GBP"): string {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return "—";
  const code = String(currency || "GBP").toUpperCase();
  const { withPreferredCurrencySymbol } =
    require("@/lib/accounting/chart-of-accounts") as typeof import("@/lib/accounting/chart-of-accounts");
  return withPreferredCurrencySymbol(
    amount.toLocaleString("en-GB", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }),
    code,
  );
}

/** Chief-of-Staff prose for executive intelligence tools (never reply “Done.”). */
function formatExecutiveIntelligenceReply(
  toolName: string,
  result: unknown,
): string | null {
  if (!result || typeof result !== "object") return null;
  const status = String((result as { status?: string }).status ?? "");
  const summary = (result as { summary?: Record<string, unknown> }).summary;
  const items = (result as { items?: Array<Record<string, unknown>> }).items;
  if (status === "error" || status === "forbidden") {
    return (
      (typeof (result as { error?: string }).error === "string" &&
        (result as { error: string }).error) ||
      "I could not load that operating picture."
    );
  }

  if (toolName === "getDailyBrief") {
    const brief = items?.[0];
    if (!brief) return "I could not build today’s brief.";
    const headline =
      (typeof brief.headline === "string" && brief.headline) ||
      (typeof summary?.headline === "string" && summary.headline) ||
      "Today’s operating picture";
    const priorities = Array.isArray(brief.priorities)
      ? brief.priorities.map(String).filter(Boolean).slice(0, 5)
      : [];
    const insights = Array.isArray(brief.insights)
      ? brief.insights.slice(0, 4).map((entry) => {
          const title = String((entry as { title?: string }).title ?? "Insight");
          const text = String((entry as { summary?: string }).summary ?? "");
          return text ? `• ${title} — ${text}` : `• ${title}`;
        })
      : [];
    const sections = Array.isArray(brief.sections)
      ? brief.sections.slice(0, 3).flatMap((section) => {
          const title = String((section as { title?: string }).title ?? "");
          const bullets = Array.isArray((section as { bullets?: unknown }).bullets)
            ? ((section as { bullets: unknown[] }).bullets as unknown[])
                .map(String)
                .filter(Boolean)
                .slice(0, 3)
            : [];
          if (!title || bullets.length === 0) return [];
          return [`${title}:`, ...bullets.map((b) => `• ${b}`)];
        })
      : [];
    const parts = [headline];
    if (priorities.length) {
      parts.push("", "Requires attention:", ...priorities.map((p, i) => `${i + 1}. ${p}`));
    }
    if (insights.length) {
      parts.push("", "Live signals:", ...insights);
    } else if (sections.length) {
      parts.push("", ...sections);
    }
    if (parts.length === 1) {
      parts.push("", "No elevated overnight issues in the current pass.");
    }
    return parts.join("\n");
  }

  if (toolName === "getSmartInsights") {
    if (!Array.isArray(items) || items.length === 0) {
      return "No elevated risks in the current analysis pass.";
    }
    const lines = items.slice(0, 8).map((entry, index) => {
      const severity = String(entry.severity ?? "medium").toUpperCase();
      const title = String(entry.title ?? "Insight");
      const text = String(entry.summary ?? "");
      return text
        ? `${index + 1}. [${severity}] ${title} — ${text}`
        : `${index + 1}. [${severity}] ${title}`;
    });
    const critical = typeof summary?.critical === "number" ? summary.critical : null;
    const high = typeof summary?.high === "number" ? summary.high : null;
    const lead =
      critical != null || high != null
        ? `Top operating risks (${critical ?? 0} critical, ${high ?? 0} high):`
        : "Top operating risks:";
    return `${lead}\n\n${lines.join("\n")}`;
  }

  if (toolName === "queryBusiness") {
    const snapshot = items?.[0] as { overview?: Record<string, unknown> } | undefined;
    const overview = snapshot?.overview ?? summary ?? {};
    const currency = String(overview.reportingCurrency ?? "GBP");
    const question =
      (typeof summary?.question === "string" && summary.question) || "Business summary";
    const asksBurn = /\bburn\b|runway|monthly\s+spend/i.test(question);

    if (asksBurn && overview.monthlyBurn != null) {
      const burnLines = [
        `Monthly burn: ${money(overview.monthlyBurn, currency)}`,
        overview.previousMonthlyBurn != null
          ? `Previous month burn: ${money(overview.previousMonthlyBurn, currency)}`
          : null,
        overview.runwayMonths != null ? `Cash runway: ${overview.runwayMonths} months` : null,
        overview.cashPosition != null
          ? `Cash position: ${money(overview.cashPosition, currency)}`
          : null,
        overview.monthlyPayroll != null
          ? `Payroll (monthly): ${money(overview.monthlyPayroll, currency)}`
          : null,
        overview.headcount != null ? `Headcount: ${overview.headcount}` : null,
        overview.burnTrendLabel != null ? `Composition: ${overview.burnTrendLabel}` : null,
      ].filter(Boolean);
      return `${question.replace(/\?$/, "")}:\n\n${burnLines.map((l) => `• ${l}`).join("\n")}`;
    }

    const lines = [
      `Active clients: ${overview.activeClients ?? "—"}`,
      `Live projects: ${overview.liveProjects ?? "—"}`,
      `Headcount: ${overview.headcount ?? "—"}`,
      `Cash position: ${money(overview.cashPosition, currency)}`,
    ];
    if (overview.monthlyBurn != null) {
      lines.push(`Monthly burn: ${money(overview.monthlyBurn, currency)}`);
    }
    if (overview.runwayMonths != null) {
      lines.push(`Cash runway: ${overview.runwayMonths} months`);
    }
    if (overview.overdueInvoices != null) {
      lines.push(`Overdue invoices: ${overview.overdueInvoices}`);
    }
    if (overview.hotLeads != null) {
      lines.push(`Hot CRM leads: ${overview.hotLeads}`);
    }
    return `${question.replace(/\?$/, "")}:\n\n${lines.map((l) => `• ${l}`).join("\n")}`;
  }

  if (toolName === "searchPlatformSubscriptions") {
    const expectedMonthly =
      typeof summary?.expectedMonthlyUsd === "number" ? summary.expectedMonthlyUsd : null;
    const expectedQuarterly =
      typeof summary?.expectedQuarterlyUsd === "number" ? summary.expectedQuarterlyUsd : null;
    const expectedFrequency =
      typeof summary?.expectedFrequency === "string" ? summary.expectedFrequency : null;
    const reflected = summary?.reflected;
    const lead =
      (typeof summary?.message === "string" && summary.message) ||
      "Platform Billing subscriptions:";

    if (!Array.isArray(items) || items.length === 0) {
      return lead;
    }

    const lines = items.map((item, index) => {
      const expectedBit =
        item.expectedChargeLabel != null
          ? ` — expected ${String(item.expectedChargeLabel)} → ${
              item.matchesExpected === true
                ? "match"
                : item.matchesExpected === false
                  ? "mismatch"
                  : "n/a"
            }`
          : "";
      return `${index + 1}. ${String(item.companyName ?? "—")} — ${String(
        item.planName ?? "—",
      )} — ${String(item.billingFrequencyLabel ?? item.billingFrequency ?? "—")} — MRR ${String(
        item.mrrLabel ?? item.mrrUsd ?? "—",
      )} — period charge ${String(item.periodChargeLabel ?? item.periodChargeUsd ?? "—")} — ${String(
        item.subscriptionStatusLabel ?? item.subscriptionStatus ?? "—",
      )}${expectedBit}`;
    });

    const expectationLine =
      expectedMonthly != null || expectedQuarterly != null
        ? `\n\nExpected: ${
            expectedMonthly != null ? `$${Number(expectedMonthly).toLocaleString("en-US")}/mo` : "—"
          }${
            expectedQuarterly != null
              ? ` · $${Number(expectedQuarterly).toLocaleString("en-US")} quarterly in advance`
              : ""
          }${expectedFrequency ? ` · frequency ${expectedFrequency}` : ""}.`
        : "";

    const verdict =
      reflected === false
        ? "\n\nVerdict: Not reflected in current Billing details."
        : reflected === true
          ? "\n\nVerdict: Reflected in current Billing details."
          : "";

    return `${lead}\n\n${lines.join("\n")}${expectationLine}${verdict}`;
  }

  if (toolName === "getBusinessHealth") {
    const health = items?.[0];
    if (!health) return "I could not score business health.";
    const overall = health.overall ?? summary?.overall ?? "—";
    const risks = Array.isArray(health.risks)
      ? health.risks.map(String).filter(Boolean).slice(0, 5)
      : [];
    const parts = [`Business health: ${overall}/100.`];
    if (risks.length) {
      parts.push("", "Elevated risks:", ...risks.map((r, i) => `${i + 1}. ${r}`));
    }
    return parts.join("\n");
  }

  if (
    toolName === "abhi.getExecutiveBriefing" ||
    toolName === "abhi.getOrgHealth" ||
    toolName === "abhi.queryActions" ||
    toolName === "abhi.getBoardInsights" ||
    toolName === "talanton.getExecutiveBriefing" ||
    toolName === "talanton.getOrgHealth" ||
    toolName === "talanton.queryActions" ||
    toolName === "talanton.getBoardInsights" ||
    toolName === "talanton.queryPortfolio" ||
    toolName === "talanton.queryFunds" ||
    toolName === "talanton.queryImpact" ||
    toolName === "talanton.queryStories" ||
    toolName === "talanton.generateStoriesReport" ||
    toolName === "talanton.generateStoriesLessonsPdf" ||
    toolName === "onwardair.getExecutiveBriefing" ||
    toolName === "onwardair.getOrgHealth" ||
    toolName === "onwardair.queryActions" ||
    toolName === "onwardair.getBoardInsights" ||
    toolName === "onwardair.queryModule" ||
    toolName === "onwardair.queryProjectPortfolio" ||
    toolName === "northstar.getExecutiveBriefing" ||
    toolName === "northstar.getOrgHealth" ||
    toolName === "northstar.queryActions" ||
    toolName === "northstar.getBoardInsights" ||
    toolName === "northstar.queryModule" ||
    toolName === "abhi.queryProjectPortfolio"
  ) {
    const prose =
      (typeof summary?.message === "string" && summary.message) ||
      (typeof items?.[0]?.prose === "string" && items[0].prose) ||
      null;
    if (prose) return prose;
    if (toolName.startsWith("talanton.")) {
      return "I could not complete that Talanton executive analysis.";
    }
    if (toolName.startsWith("onwardair.")) {
      return "I could not complete that OnwardAir executive analysis.";
    }
    if (toolName.startsWith("northstar.")) {
      return "I could not complete that Northstar executive analysis.";
    }
    return "I could not complete that ABHI executive analysis.";
  }

  return null;
}

function formatDirectListReply(toolName: string, result: unknown): string | null {
  const intelligence = formatExecutiveIntelligenceReply(toolName, result);
  if (intelligence) return intelligence;

  switch (toolName) {
    case "searchEmployees":
      return formatSearchEmployeesReply(result);
    case "searchPerformanceReviews":
      return formatListedToolReply(result, {
        emptyFallback: "There are currently no performance reviews.",
        line: (item, index) =>
          `${index + 1}. ${String(item.employeeName ?? "—")} — ${String(item.reviewPeriod ?? "—")} — ${String(item.status ?? "—")}${
            item.overallRating ? ` — ${String(item.overallRating)}` : ""
          }`,
      });
    case "searchLeave":
      return formatListedToolReply(result, {
        emptyFallback: "There are currently no leave requests matching that request.",
        line: (item, index) =>
          `${index + 1}. ${String(item.employeeName ?? "—")} — ${String(item.type ?? "—")} — ${String(item.startDate ?? "")} → ${String(item.endDate ?? "")} — ${String(item.status ?? "")}`,
      });
    case "searchVacancies":
      return formatListedToolReply(result, {
        emptyFallback: "There are currently no open vacancies.",
        line: (item, index) =>
          `${index + 1}. ${String(item.title ?? "—")} — ${String(item.department ?? "—")} — ${String(item.location ?? "—")} — ${String(item.status ?? "—")}`,
      });
    case "searchSupportTickets":
      return formatListedToolReply(result, {
        emptyFallback: "There are currently no support tickets matching that request.",
        line: (item, index) =>
          `${index + 1}. ${String(item.id ?? "—")} — ${String(item.name ?? "—")} — ${String(item.priority ?? "—")} — ${String(item.status ?? "—")}`,
      });
    case "searchSoftwareAssets":
      return formatListedToolReply(result, {
        emptyFallback: "There are currently no software assets matching that request.",
        line: (item, index) =>
          item.kind === "summary"
            ? `${index + 1}. ${String(item.totalProducts ?? 0)} products · monthly ${String(item.monthlySpend ?? "—")} · renewals (30d) ${String(item.renewalsDueIn30Days ?? 0)}`
            : `${index + 1}. ${String(item.name ?? "—")} — ${String(item.vendor ?? "—")} — ${String(item.status ?? "—")}`,
      });
    case "searchInventory":
      return formatListedToolReply(result, {
        emptyFallback: "There are currently no inventory assets matching that request.",
        line: (item, index) =>
          `${index + 1}. ${String(item.assetTag ?? "—")} — ${String(item.name ?? "—")} — ${String(item.status ?? "—")} — ${String(item.location ?? "—")}`,
      });
    case "searchQmsTraining":
      return formatListedToolReply(result, {
        emptyFallback: "No QMS training records match that request.",
        line: (item, index) => {
          if (item.kind === "summary") {
            return `${index + 1}. Compliance ${String(item.complianceScore ?? "—")}% · overdue ${String(item.overdue ?? 0)} · expiring certs ${String(item.expiring ?? 0)}`;
          }
          if (item.kind === "capa") {
            return `${index + 1}. [CAPA] ${String(item.reference ?? item.id ?? "—")} — ${String(item.title ?? "—")} — ${String(item.status ?? "—")}`;
          }
          return `${index + 1}. ${String(item.learnerName ?? "—")} — ${String(item.courseTitle ?? "—")} — ${String(item.status ?? "—")}`;
        },
      });
    case "searchClients":
      return formatListedToolReply(result, {
        emptyFallback: "There are currently no clients matching that request.",
        line: (item, index) =>
          `${index + 1}. ${String(item.companyName ?? "—")} — ${String(item.accountStatus ?? "—")} — ${String(item.region ?? item.companyCountry ?? "—")} — ${String(item.activeProjects ?? 0)} active projects`,
      });
    case "searchCRM":
      return formatListedToolReply(result, {
        emptyFallback: "There are currently no CRM opportunities matching that request.",
        line: (item, index) => {
          const value =
            typeof item.estimatedValue === "number"
              ? Number(item.estimatedValue).toLocaleString("en-GB", {
                  style: "currency",
                  currency: "GBP",
                  maximumFractionDigits: 0,
                })
              : "—";
          return `${index + 1}. ${String(item.companyName ?? "—")} — ${String(item.status ?? "—")} — ${value}${
            item.nextAction ? ` — next: ${String(item.nextAction)}` : ""
          }`;
        },
      });
    case "searchProjects":
      return formatListedToolReply(result, {
        emptyFallback: "There are currently no projects matching that request.",
        line: (item, index) =>
          `${index + 1}. ${String(item.name ?? "—")} — ${String(item.clientName ?? "Internal")} — ${String(item.phase ?? "—")}`,
      });
    case "searchInvoices":
      return formatListedToolReply(result, {
        emptyFallback: "There are currently no outstanding invoices.",
        line: (item, index) =>
          `${index + 1}. ${String(item.clientName ?? "—")} — ${String(item.number ?? "")} — ${Number(item.amount ?? 0).toLocaleString("en-GB", {
            style: "currency",
            currency: String(item.currency ?? "GBP"),
            maximumFractionDigits: 0,
          })} — due ${String(item.dueDate ?? "—")} — ${String(item.status ?? "")}`,
      });
    case "searchExpenses":
      return formatListedToolReply(result, {
        emptyFallback: "There are currently no expenses matching that request.",
        line: (item, index) =>
          `${index + 1}. ${String(item.supplier ?? "—")} — ${Number(item.amount ?? 0).toLocaleString("en-GB", {
            style: "currency",
            currency: String(item.currency ?? "GBP"),
            maximumFractionDigits: 0,
          })} — ${String(item.date ?? "—")}${item.description ? ` — ${String(item.description)}` : ""}`,
      });
    case "platformSearch":
      return formatListedToolReply(result, {
        emptyFallback: "No platform matches.",
        line: (item, index) =>
          `${index + 1}. [${String(item.module ?? "Module")}] ${String(item.label ?? "—")}${
            item.detail ? ` — ${String(item.detail)}` : ""
          }`,
      });
    case "getCashPosition":
    case "getMonthlyPayrollObligation": {
      const summary = (result as { summary?: Record<string, unknown> }).summary;
      return typeof summary?.message === "string" ? summary.message : null;
    }
    case "queryPayroll": {
      const summary = (result as { summary?: Record<string, unknown> }).summary;
      if (typeof summary?.message === "string") return summary.message;
      return formatListedToolReply(result, {
        emptyFallback: "No payroll data is available for that request.",
        line: (item, index) => {
          if (typeof item.month === "string") {
            return `${index + 1}. ${item.month} — gross ${Number(item.gross ?? 0).toLocaleString("en-GB", {
              style: "currency",
              currency: "GBP",
              maximumFractionDigits: 0,
            })} — net ${Number(item.net ?? 0).toLocaleString("en-GB", {
              style: "currency",
              currency: "GBP",
              maximumFractionDigits: 0,
            })}`;
          }
          return `${index + 1}. ${JSON.stringify(item)}`;
        },
      });
    }
    default:
      return null;
  }
}

function enrichArtifactsFromMemory(
  artifacts: NonNullable<AssistantChatMessage["artifacts"]>,
  userId: string,
): NonNullable<AssistantChatMessage["artifacts"]> {
  return artifacts.map((artifact) => {
    if (artifact.contentBase64) return artifact;
    const stored = getAssistantArtifact(artifact.id, userId);
    if (!stored?.contentBase64) return artifact;
    return { ...artifact, contentBase64: stored.contentBase64 };
  });
}

function messageHasDurableArtifacts(message: AssistantChatMessage) {
  return Boolean(
    message.artifacts?.some(
      (artifact) =>
        typeof artifact.contentBase64 === "string" && artifact.contentBase64.length > 0,
    ),
  );
}

export function extractArtifactsFromToolResult(
  result: unknown,
  toolName?: string,
  userId?: string,
): {
  followUps: NonNullable<AssistantChatMessage["followUpActions"]>;
  artifacts: NonNullable<AssistantChatMessage["artifacts"]>;
  successText: string | null;
  errorText: string | null;
} {
  if (!result || typeof result !== "object") {
    return { followUps: [], artifacts: [], successText: null, errorText: null };
  }
  const status = String((result as { status?: string }).status ?? "");
  const followUps = Array.isArray((result as { followUpActions?: unknown }).followUpActions)
    ? ((result as { followUpActions: NonNullable<AssistantChatMessage["followUpActions"]> })
        .followUpActions ?? [])
    : [];
  const summary = (result as { summary?: Record<string, unknown> }).summary;
  const items = (result as { items?: Array<Record<string, unknown>> }).items;
  const artifactId =
    (typeof summary?.artifactId === "string" && summary.artifactId) ||
    (typeof items?.[0]?.artifactId === "string" && items[0].artifactId) ||
    null;

  if (status === "error" || status === "forbidden") {
    return {
      followUps: [],
      artifacts: [],
      successText: null,
      errorText:
        (typeof (result as { error?: string }).error === "string" &&
          (result as { error: string }).error) ||
        (typeof summary?.message === "string" && summary.message) ||
        "That action could not be completed.",
    };
  }

  if (toolName) {
    const listed = formatDirectListReply(toolName, result);
    // Executive PDF tools return formatted prose — still attach artifacts when present.
    if (listed && !artifactId) {
      return {
        followUps,
        artifacts: [],
        successText: listed,
        errorText: null,
      };
    }
  }

  if (toolName === "emailAssistantArtifact") {
    return {
      followUps,
      artifacts: [],
      successText:
        typeof summary?.message === "string"
          ? summary.message
          : "Email sent.",
      errorText: null,
    };
  }

  if (!artifactId) {
    return {
      followUps,
      artifacts: [],
      successText:
        typeof summary?.message === "string"
          ? summary.message
          : status === "ok"
            ? "Done."
            : null,
      errorText: null,
    };
  }

  const artifactItems = Array.isArray(items)
    ? items.filter(
        (item) =>
          item &&
          typeof item === "object" &&
          typeof (item as { artifactId?: unknown }).artifactId === "string",
      )
    : [];

  if (artifactItems.length > 0) {
    const artifacts = artifactItems.map((item) => {
      const id = String((item as { artifactId: string }).artifactId);
      const kindRaw = String((item as { kind?: string }).kind ?? "pdf");
      const kind =
        kindRaw === "pptx" || kindRaw === "file" || kindRaw === "pdf" ? kindRaw : "pdf";
      const title =
        (typeof (item as { title?: string }).title === "string" &&
          (item as { title: string }).title) ||
        "Document";
      const filename =
        (typeof (item as { filename?: string }).filename === "string" &&
          (item as { filename: string }).filename) ||
        (kind === "pptx" ? "document.pptx" : "document.pdf");
      const contentBase64 =
        typeof (item as { contentBase64?: string }).contentBase64 === "string"
          ? (item as { contentBase64: string }).contentBase64
          : undefined;
      const downloadUrl =
        (typeof (item as { downloadUrl?: string }).downloadUrl === "string" &&
          (item as { downloadUrl: string }).downloadUrl) ||
        `/api/executive-assistant/artifacts/${id}?disposition=attachment`;
      const openUrl =
        (typeof (item as { openUrl?: string }).openUrl === "string" &&
          (item as { openUrl: string }).openUrl) ||
        `/api/executive-assistant/artifacts/${id}?disposition=inline`;
      return {
        id,
        kind: kind as "pdf" | "pptx" | "file",
        title,
        filename,
        downloadUrl,
        openUrl,
        contentBase64,
      };
    });

    const durableArtifacts = userId ? enrichArtifactsFromMemory(artifacts, userId) : artifacts;

    return {
      followUps,
      artifacts: durableArtifacts,
      successText:
        (typeof summary?.message === "string" && summary.message) ||
        `${durableArtifacts[0]?.filename ?? "Document"}\n\nGenerated successfully.`,
      errorText: null,
    };
  }

  const title =
    (typeof summary?.title === "string" && summary.title) ||
    (typeof items?.[0]?.title === "string" && String(items[0].title)) ||
    "Document";
  const filename =
    (typeof summary?.filename === "string" && summary.filename) ||
    (typeof items?.[0]?.filename === "string" && String(items[0].filename)) ||
    "document.pdf";
  const contentBase64 =
    (typeof items?.[0]?.contentBase64 === "string" && String(items[0].contentBase64)) ||
    undefined;

  return {
    followUps,
    artifacts: [
      {
        id: artifactId,
        kind: "pdf",
        title,
        filename,
        downloadUrl: `/api/executive-assistant/artifacts/${artifactId}?disposition=attachment`,
        openUrl: `/api/executive-assistant/artifacts/${artifactId}?disposition=inline`,
        contentBase64,
      },
    ],
    successText:
      (typeof summary?.message === "string" && summary.message) ||
      `${filename}\n\nGenerated successfully.`,
    errorText: null,
  };
}

function extractActiveArtifact(history: AssistantChatMessage[]) {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const artifacts = history[index]?.artifacts;
    if (artifacts && artifacts.length > 0) {
      return artifacts[artifacts.length - 1] ?? null;
    }
  }
  return null;
}

function stripArtifactBytesForStorage(
  message: AssistantChatMessage,
): AssistantChatMessage {
  if (!message.artifacts?.length) return message;
  return {
    ...message,
    artifacts: message.artifacts.map(({ contentBase64: _bytes, ...artifact }) => artifact),
  };
}

async function persistTurn(input: {
  session: PlatformSession;
  conversationId: string | null;
  history: AssistantChatMessage[];
  userMessage: AssistantChatMessage;
  assistantMessage: AssistantChatMessage;
  context: AssistantBusinessContext;
  title: string;
}) {
  const hasDurableArtifacts = messageHasDurableArtifacts(input.assistantMessage);
  const assistantMessage = hasDurableArtifacts
    ? stripArtifactBytesForStorage({
        ...input.assistantMessage,
        artifacts: enrichArtifactsFromMemory(
          input.assistantMessage.artifacts ?? [],
          input.session.sub,
        ),
      })
    : input.assistantMessage;
  const messages = [...input.history, input.userMessage, assistantMessage];
  const title = titleFromMessages(messages);
  const localId = input.conversationId?.startsWith("local_")
    ? input.conversationId
    : `local_${createMessageId()}`;
  const persistedId =
    input.conversationId &&
    !input.conversationId.startsWith("local_") &&
    input.conversationId !== "pending"
      ? input.conversationId
      : null;

  if (!isSupabaseServiceRoleConfigured()) {
    return {
      conversationId: localId,
      title,
    };
  }

  if (persistedId) {
    const existing = await getConversationForUser(persistedId, input.session.sub);
    if (existing) {
      const updated = await updateConversation({
        conversationId: persistedId,
        userId: input.session.sub,
        messages,
        workspaceContext: input.context,
        title,
        isSaved: existing.isSaved,
      });
      return { conversationId: updated.id, title: updated.title };
    }
  }

  // Auto-save a hidden draft when PDFs/PPTX are generated so View Pack still works
  // after switching ABHI ↔ OnwardAir (serverless cold starts, new browser tabs).
  if (hasDurableArtifacts) {
    try {
      const created = await createConversation({
        userId: input.session.sub,
        workspaceId: input.context.workspace.id,
        organisationId: input.context.organisation?.id ?? null,
        messages,
        workspaceContext: input.context,
        title,
        isSaved: false,
      });
      return { conversationId: created.id, title: created.title };
    } catch (error) {
      console.error("[EA] persistTurn draft save failed — using local conversation id", error);
      return { conversationId: localId, title };
    }
  }

  return {
    conversationId: localId,
    title,
  };
}

/**
 * Runs one assistant turn via the OpenAI Responses API with optional tool loop.
 * Yields SSE-friendly stream events.
 */
export async function* runAssistantTurn(input: {
  session: PlatformSession;
  request: AssistantChatRequest;
}): AsyncGenerator<AssistantStreamEvent> {
  const { EA_SERVER_ORG_STATE_BINDINGS } = await import(
    "@/lib/ai-operating-assistant/workspace-packs/org-state-server"
  );

  let run: () => AsyncGenerator<AssistantStreamEvent> = () => runAssistantTurnInner(input);
  for (const binding of EA_SERVER_ORG_STATE_BINDINGS) {
    const requestRecord = input.request as Record<string, unknown>;
    const parsed = binding.parseRequestPayload(requestRecord[binding.requestField]);
    const previous = run;
    run = () =>
      binding.wrapAssistantTurn(
        parsed,
        previous,
      ) as AsyncGenerator<AssistantStreamEvent>;
  }

  yield* run();
}

async function* runAssistantTurnInner(input: {
  session: PlatformSession;
  request: AssistantChatRequest;
}): AsyncGenerator<AssistantStreamEvent> {
  const message = input.request.message?.trim();
  if (!message) {
    yield { type: "error", error: "message is required", retryable: false };
    return;
  }

  const context = await buildBusinessContext({
    session: input.session,
    activeView: input.request.activeView,
    pathname: input.request.pathname,
    selection: input.request.selection,
    roleView: input.request.roleView,
  });

  const resolved = await resolveHistory(input.session, input.request, context);
  const activeArtifact = extractActiveArtifact(resolved.history);
  const entityMemory = extractConversationEntityMemory(resolved.history);
  const operatorMemory = await loadOperatorMemory({
    userId: input.session.sub,
    workspaceId: context.workspace.id,
  }).catch(() => ({ recentApprovals: [], summaryLine: null }));
  const userMessage: AssistantChatMessage = {
    id: createMessageId(),
    role: "user",
    content: message,
    createdAt: new Date().toISOString(),
  };

  yield {
    type: "meta",
    conversationId: resolved.conversationId ?? "pending",
    title: resolved.title,
    correlationId: getEaCorrelationId(),
  };

  const instructions = [
    buildSystemInstructions(context, {
      activeArtifact: activeArtifact
        ? {
            artifactId: activeArtifact.id,
            title: activeArtifact.title,
            filename: activeArtifact.filename,
            downloadUrl: activeArtifact.downloadUrl,
            openUrl: activeArtifact.openUrl,
          }
        : null,
      activeClient:
        entityMemory.clientId || entityMemory.clientName
          ? {
              clientId: entityMemory.clientId ?? null,
              clientName: entityMemory.clientName ?? null,
              projectId: entityMemory.projectId ?? null,
              projectName: entityMemory.projectName ?? null,
            }
          : null,
      topicHint: topicHintFromHistory(resolved.history),
      operatorMemoryLine: operatorMemory.summaryLine,
    }),
    input.request.structuredJson ? buildStructuredJsonHint() : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const turnStartedAt = Date.now();
  let recordedDataGaps = 0;

  let tools: ReturnType<typeof getOpenAIToolSchemas> = [];
  let inputItems: EasyInputMessage[] = toInputMessages(resolved.history, message);
  let assistantText = "";
  let toolLoops = 0;
  let awaitingSynthesis = false;
  let requireToolOnFirstModelTurn = false;
  let turnFollowUps: NonNullable<AssistantChatMessage["followUpActions"]> = [];
  let turnArtifacts: NonNullable<AssistantChatMessage["artifacts"]> = [];

  try {
    tools = getOpenAIToolSchemas(context.workspace.slug);
    ensureActionModulesRegistered();

    // Intent → registered action → propose/execute. Never fall through to workflow teaching.
    const route = await resolveOrchestrationRoute(message, resolved.history, context);
    setEaConversationId(resolved.conversationId);

    if (route.kind === "need_info") {
      eaStage("Intent resolved", {
        actionId: route.actionId,
        confidence: null,
        "extracted input": route.input,
        kind: "need_info",
      });
      eaStop("Intent resolved", "missing required fields — asking user before plan", {
        actionId: route.actionId,
        question: route.message,
      });
      assistantText = route.message;
      yield { type: "delta", text: assistantText };
      const assistantMessage: AssistantChatMessage = {
        id: createMessageId(),
        role: "assistant",
        content: assistantText,
        createdAt: new Date().toISOString(),
        executionCards: route.executionCards,
      };
      const saved = await persistTurn({
        session: input.session,
        conversationId: resolved.conversationId,
        history: resolved.history,
        userMessage,
        assistantMessage,
        context,
        title: resolved.title,
      });
      yield {
        type: "done",
        message: assistantMessage,
        conversationId: saved.conversationId,
        correlationId: getEaCorrelationId(),
      };
      return;
    }

    if (route.kind === "workflow_read") {
      eaStage("Intent resolved", {
        actionId: null,
        confidence: null,
        "extracted input": null,
        kind: "workflow_read",
      });
      assistantText = route.message;
      yield { type: "delta", text: assistantText };
      const assistantMessage: AssistantChatMessage = {
        id: createMessageId(),
        role: "assistant",
        content: assistantText,
        createdAt: new Date().toISOString(),
        executionCards: route.executionCards,
      };
      const saved = await persistTurn({
        session: input.session,
        conversationId: resolved.conversationId,
        history: resolved.history,
        userMessage,
        assistantMessage,
        context,
        title: resolved.title,
      });
      yield {
        type: "done",
        message: assistantMessage,
        conversationId: saved.conversationId,
        correlationId: getEaCorrelationId(),
      };
      return;
    }

    if (route.kind === "platform_answer") {
      eaStage("Intent resolved", {
        actionId: null,
        confidence: null,
        "extracted input": null,
        kind: "platform_answer",
      });
      assistantText = route.message;
      yield { type: "delta", text: assistantText };
      const assistantMessage: AssistantChatMessage = {
        id: createMessageId(),
        role: "assistant",
        content: assistantText,
        createdAt: new Date().toISOString(),
        executionCards: route.executionCards,
        followUpActions: route.executionCards
          ?.flatMap((card) =>
            (card.actions ?? [])
              .filter((a) => a.intent === "navigate" && a.href)
              .map((a) => ({
                id: a.id,
                label: a.label,
                kind: "navigate" as const,
                href: a.href,
              })),
          ),
      };
      const saved = await persistTurn({
        session: input.session,
        conversationId: resolved.conversationId,
        history: resolved.history,
        userMessage,
        assistantMessage,
        context,
        title: resolved.title,
      });
      yield {
        type: "done",
        message: assistantMessage,
        conversationId: saved.conversationId,
        correlationId: getEaCorrelationId(),
      };
      return;
    }

    if (route.kind === "capability_answer") {
      eaStage("Intent resolved", {
        actionId: null,
        confidence: null,
        "extracted input": null,
        kind: "capability_answer",
      });
      assistantText = route.message;
      yield { type: "delta", text: assistantText };
      const assistantMessage: AssistantChatMessage = {
        id: createMessageId(),
        role: "assistant",
        content: assistantText,
        createdAt: new Date().toISOString(),
        executionCards: route.executionCards,
      };
      const saved = await persistTurn({
        session: input.session,
        conversationId: resolved.conversationId,
        history: resolved.history,
        userMessage,
        assistantMessage,
        context,
        title: resolved.title,
      });
      yield {
        type: "done",
        message: assistantMessage,
        conversationId: saved.conversationId,
        correlationId: getEaCorrelationId(),
      };
      return;
    }

    if (route.kind === "semantic_answer") {
      eaStage("Intent resolved", {
        actionId: null,
        confidence: null,
        "extracted input": null,
        kind: "semantic_answer",
        capabilityId: route.capabilityId,
      });
      recordEaExecutionTelemetry({
        path: "deterministic",
        capabilityId: route.capabilityId,
        workspaceSlug: context.workspace.slug,
        workspaceId: context.workspace.id,
        userId: input.session.sub,
        responseType: route.responseBlocks?.some(
          (b) => b.type === "line_chart" || b.type === "bar_chart" || b.type === "pie_chart",
        )
          ? "chart"
          : route.responseBlocks?.some((b) => b.type === "table")
            ? "table"
            : route.responseBlocks?.some((b) => b.type === "kpi")
              ? "kpi"
              : "text",
      });
      assistantText = route.message;
      yield { type: "delta", text: assistantText };
      const assistantMessage: AssistantChatMessage = {
        id: createMessageId(),
        role: "assistant",
        content: assistantText,
        createdAt: new Date().toISOString(),
        executionCards: route.executionCards,
        responseBlocks: route.responseBlocks,
      };
      const saved = await persistTurn({
        session: input.session,
        conversationId: resolved.conversationId,
        history: resolved.history,
        userMessage,
        assistantMessage,
        context,
        title: resolved.title,
      });
      yield {
        type: "done",
        message: assistantMessage,
        conversationId: saved.conversationId,
        correlationId: getEaCorrelationId(),
      };
      return;
    }

    if (route.kind === "evidence_gpt") {
      eaStage("Intent resolved", {
        actionId: null,
        confidence: null,
        "extracted input": null,
        kind: "evidence_gpt",
        capabilityId: route.plan.synthesisKind,
      });
      const executed = await executeEvidencePlan(route.plan, { message, business: context });
      const adapted = adaptExecutiveOrchestrationResult(executed);
      recordEaExecutionTelemetry({
        path: "evidence_gpt",
        capabilityId: executed.capabilityId,
        workspaceSlug: context.workspace.slug,
        workspaceId: context.workspace.id,
        userId: input.session.sub,
        escalationReason: "deterministic_evidence_synthesis",
        gptCallCount: 0,
        responseType: adapted.responseBlocks?.some(
          (b) => b.type === "line_chart" || b.type === "bar_chart" || b.type === "pie_chart",
        )
          ? "chart"
          : adapted.responseBlocks?.some((b) => b.type === "table")
            ? "table"
            : adapted.responseBlocks?.some((b) => b.type === "kpi")
              ? "kpi"
              : adapted.artifacts.length
                ? "artifact"
                : "text",
      });
      assistantText = adapted.text;
      turnArtifacts = adapted.artifacts;
      yield { type: "delta", text: assistantText };
      const assistantMessage: AssistantChatMessage = {
        id: createMessageId(),
        role: "assistant",
        content: assistantText,
        createdAt: new Date().toISOString(),
        responseBlocks: adapted.responseBlocks,
        followUpActions: adapted.followUpActions,
        artifacts: adapted.artifacts.length > 0 ? adapted.artifacts : undefined,
      };
      const saved = await persistTurn({
        session: input.session,
        conversationId: resolved.conversationId,
        history: resolved.history,
        userMessage,
        assistantMessage,
        context,
        title: resolved.title,
      });
      yield {
        type: "done",
        message: assistantMessage,
        conversationId: saved.conversationId,
        correlationId: getEaCorrelationId(),
      };
      return;
    } else if (route.kind === "none") {
      eaStage("Intent resolved", {
        actionId: null,
        confidence: null,
        "extracted input": null,
        kind: "none",
      });
      recordEaExecutionTelemetry({
        path: "gpt_terra",
        workspaceSlug: context.workspace.slug,
        workspaceId: context.workspace.id,
        userId: input.session.sub,
        escalationReason: "no_deterministic_capability_match",
        gptCallCount: 1,
      });
      eaStop("Intent resolved", "no executable business action matched — continuing to model tools", {
        message,
      });
      const classification = classifyKnowledgeDomain(message);
      if (
        (classification.domain === "business" || classification.domain === "write") &&
        classification.reason !== "document_generation_request"
      ) {
        requireToolOnFirstModelTurn = true;
        inputItems = [
          ...inputItems,
          {
            role: "developer",
            content:
              "REAL EA TURN: Ground this answer in live workspace data. Call getOrgContext and/or the most specific search/query tool before you reply. Do not invent numbers, names, or statuses.",
          },
        ];
      }
    }

    if (route.kind === "tool") {
      const directIntent = route.intent;
      const intentSteps = Array.isArray(directIntent.args.steps)
        ? (directIntent.args.steps as Array<{ actionId?: string; input?: Record<string, unknown> }>)
        : [];
      const intentFirst = intentSteps[0];
      eaStage("Intent resolved", {
        actionId:
          typeof intentFirst?.actionId === "string" ? intentFirst.actionId : directIntent.tool,
        confidence: (() => {
          const match =
            typeof directIntent.reason === "string"
              ? directIntent.reason.match(/confidence=([0-9.]+)/)
              : null;
          return match ? Number(match[1]) : directIntent.reason ?? null;
        })(),
        "extracted input": intentFirst?.input ?? directIntent.args,
        tool: directIntent.tool,
        reason: directIntent.reason,
      });
      const toolArgs =
        directIntent.tool === "emailAssistantArtifact" && activeArtifact
          ? {
              ...directIntent.args,
              artifactId:
                (typeof directIntent.args.artifactId === "string" &&
                  directIntent.args.artifactId) ||
                activeArtifact.id,
              contentBase64: activeArtifact.contentBase64,
              title: activeArtifact.title,
              filename: activeArtifact.filename,
            }
          : directIntent.args;
      yield {
        type: "tool_call",
        name: directIntent.tool,
        arguments: toolArgs,
      };
      const result = await executeAssistantTool(
        directIntent.tool,
        toolArgs,
        context,
      );
      yield { type: "tool_result", name: directIntent.tool, result };
      const extracted = extractArtifactsFromToolResult(
        result,
        directIntent.tool,
        input.session.sub,
      );
      turnFollowUps = extracted.followUps;
      turnArtifacts = extracted.artifacts;

      let capabilityFormatted: ReturnType<
        NonNullable<ReturnType<typeof getReadCapability>>["formatAnswer"]
      > | null = null;

      if (
        (directIntent.tool === "proposeBusinessActionPlan" ||
          directIntent.tool === "planBusinessGoal") &&
        !extracted.errorText
      ) {
        const summaryMessage =
          typeof (result as { summary?: { message?: string; executed?: boolean } })?.summary
            ?.message === "string"
            ? (result as { summary: { message: string; executed?: boolean } }).summary.message
            : null;
        const executed =
          (result as { summary?: { executed?: boolean } })?.summary?.executed === true;
        if (executed && summaryMessage) {
          assistantText = summaryMessage;
        } else if (summaryMessage && !/approve/i.test(summaryMessage)) {
          assistantText = summaryMessage;
        } else {
          const steps = Array.isArray(directIntent.args.steps)
            ? (directIntent.args.steps as Array<{
                actionId?: string;
                input?: Record<string, unknown>;
              }>)
            : [];
          const first = steps[0];
          const actionId = typeof first?.actionId === "string" ? first.actionId : "";
          const definition = actionId ? getAssistantAction(actionId) : null;
          const primaryFields =
            definition?.capability.entityExtraction?.primaryNameFields ?? [];
          let entityLabel: string | null = null;
          if (first?.input) {
            for (const field of primaryFields) {
              const value = first.input[field];
              if (typeof value === "string" && value.trim()) {
                entityLabel = value.trim();
                break;
              }
            }
          }
          assistantText = entityLabel
            ? `Completed — ${entityLabel}.`
            : summaryMessage || "Completed.";
        }
      } else {
        assistantText =
          extracted.errorText ??
          extracted.successText ??
          "Done.";
      }

      if (route.capabilityId) {
        const cap = getReadCapability(route.capabilityId);
        const semanticCap = getSemanticCapability(route.capabilityId);
        const formatter = cap ?? semanticCap;
        if (formatter?.formatAnswer) {
          capabilityFormatted = formatter.formatAnswer(
            result as import("./tool-result").AssistantToolResult,
            {
              message,
              business: context,
            },
          );
          if (capabilityFormatted?.text) {
            assistantText = capabilityFormatted.text;
          }
          if (route.deterministic) {
            const blocks = capabilityFormatted?.blocks;
            recordEaExecutionTelemetry({
              path: "deterministic",
              capabilityId: route.capabilityId,
              tool: directIntent.tool,
              module: cap?.module ?? semanticCap?.moduleIds?.[0] ?? "unknown",
              workspaceSlug: context.workspace.slug,
              workspaceId: context.workspace.id,
              userId: input.session.sub,
              responseType: blocks?.some(
                (b) => b.type === "line_chart" || b.type === "bar_chart" || b.type === "pie_chart",
              )
                ? "chart"
                : blocks?.some((b) => b.type === "table")
                  ? "table"
                  : blocks?.some((b) => b.type === "kpi")
                    ? "kpi"
                    : "text",
              gptCallCount: 0,
            });
          }
        }
      }
      const boardPackSummary =
        directIntent.tool === "boardpack.generate"
          ? ((result as { summary?: Record<string, unknown> }).summary ?? null)
          : null;
      const boardPackNeedsDate = Boolean(boardPackSummary?.needsMeetingDate);
      const boardPackLabel = resolveBoardPackSummaryName(boardPackSummary);
      const boardPackCards =
        boardPackSummary && boardPackNeedsDate
          ? cardsFromBoardPackNeedsDate({
              message: String(
                boardPackSummary.message ??
                  "A meeting date is required before generating the Board Pack.",
              ),
              followUpActions: turnFollowUps,
            })
          : boardPackSummary &&
              boardPackLabel &&
              typeof boardPackSummary.pdfOpenUrl === "string"
            ? cardsFromBoardPackSuccess({
                packName: boardPackLabel,
                meetingDate: String(boardPackSummary.meetingDate ?? ""),
                status: String(boardPackSummary.status ?? "Draft"),
                folderPath: String(
                  boardPackSummary.folderPath ?? "Corporate Information / Board Deck",
                ),
                boardDeckHref: String(
                  boardPackSummary.boardDeckHref ?? "/dashboard?view=board-pack",
                ),
                pdfOpenUrl: String(boardPackSummary.pdfOpenUrl),
                pdfDownloadUrl: String(
                  boardPackSummary.pdfDownloadUrl ?? boardPackSummary.pdfOpenUrl,
                ),
                pptxDownloadUrl: String(boardPackSummary.pptxDownloadUrl ?? ""),
                followUpActions: turnFollowUps,
              })
            : [];

      if (directIntent.tool === "boardpack.generate" && !extracted.errorText) {
        assistantText =
          typeof boardPackSummary?.message === "string"
            ? String(boardPackSummary.message)
            : boardPackNeedsDate
              ? "A meeting date is required before generating the Board Pack."
              : "Board Pack Generated Successfully";
      }

      const synthesisCtx = {
        workspaceSlug: context.workspace.slug ?? "",
        toolName: directIntent.tool,
        toolArgs: toolArgs as Record<string, unknown>,
        userMessage: message,
        toolResult: result,
      };

      const synthesizeExecutive =
        !route.skipSynthesis &&
        shouldSynthesizeExecutiveToolResult(synthesisCtx) &&
        !extracted.errorText;

      const capabilityBlocks = capabilityFormatted?.blocks;

      if (synthesizeExecutive) {
        inputItems = [
          ...toInputMessages(resolved.history, message),
          {
            role: "developer",
            content: buildExecutiveSynthesisDeveloperMessage(synthesisCtx),
          },
        ];
        awaitingSynthesis = true;
      } else {
      yield { type: "delta", text: assistantText };

      const executionCards = [
        ...(route.executionCards ?? []),
        ...boardPackCards,
        ...(boardPackCards.length > 0 ? [] : cardsFromArtifacts(turnArtifacts)),
      ];

      const assistantMessage: AssistantChatMessage = {
        id: createMessageId(),
        role: "assistant",
        content: assistantText,
        createdAt: new Date().toISOString(),
        followUpActions: turnFollowUps.length > 0 ? turnFollowUps : undefined,
        artifacts: turnArtifacts.length > 0 ? turnArtifacts : undefined,
        executionCards: executionCards.length > 0 ? executionCards : undefined,
        responseBlocks: capabilityBlocks?.length ? capabilityBlocks : undefined,
      };

      const saved = await persistTurn({
        session: input.session,
        conversationId: resolved.conversationId,
        history: resolved.history,
        userMessage,
        assistantMessage,
        context,
        title: resolved.title,
      });

      yield {
        type: "done",
        message: assistantMessage,
        conversationId: saved.conversationId,
        correlationId: getEaCorrelationId(),
      };
      return;
      }
    }

    while (toolLoops < 6) {
      const synthesisOnly = awaitingSynthesis;
      awaitingSynthesis = false;
      const stream = await createAssistantResponse(
        {
          model: getAssistantModel(),
          instructions,
          input: inputItems,
          ...(synthesisOnly
            ? {}
            : {
                tools,
                ...(requireToolOnFirstModelTurn && toolLoops === 0
                  ? { tool_choice: "required" as const }
                  : {}),
              }),
          stream: true,
          store: false,
          ...(input.request.structuredJson
            ? {
                text: {
                  format: { type: "json_object" as const },
                },
              }
            : {}),
        },
        { callSite: "assistant_chat_stream", userId: input.session.sub, workspaceId: context.workspace.id, conversationId: resolved.conversationId },
      );

      let pendingToolCalls: Array<{ callId: string; name: string; arguments: string }> = [];
      let responseId: string | null = null;

      for await (const event of stream as AsyncIterable<{
        type: string;
        delta?: string;
        response?: { id?: string; output?: unknown[] };
        item?: { type?: string; name?: string; call_id?: string; arguments?: string; id?: string };
        name?: string;
        arguments?: string;
        call_id?: string;
      }>) {
        if (event.type === "response.created" && event.response?.id) {
          responseId = event.response.id;
        }

        if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
          assistantText += event.delta;
          yield { type: "delta", text: event.delta };
        }

        if (event.type === "response.output_item.done" && event.item?.type === "function_call") {
          const name = event.item.name ?? "unknown";
          const args = event.item.arguments ?? "{}";
          const callId = event.item.call_id ?? event.item.id ?? createMessageId();
          pendingToolCalls.push({ callId, name, arguments: args });
          yield { type: "tool_call", name, arguments: safeParse(args) };
        }

        if (event.type === "response.function_call_arguments.done") {
          // Some SDK versions emit this; prefer output_item.done when both appear.
          if (event.name && event.arguments && event.call_id) {
            if (!pendingToolCalls.some((call) => call.callId === event.call_id)) {
              pendingToolCalls.push({
                callId: event.call_id,
                name: event.name,
                arguments: event.arguments,
              });
              yield {
                type: "tool_call",
                name: event.name,
                arguments: safeParse(event.arguments),
              };
            }
          }
        }

        if (event.type === "response.failed") {
          yield {
            type: "error",
            error: "OpenAI response failed",
            retryable: true,
          };
          return;
        }

        void responseId;
      }

      if (pendingToolCalls.length === 0) {
        break;
      }

      toolLoops += 1;
      const toolOutputs: Array<{ type: "function_call_output"; call_id: string; output: string }> =
        [];

      for (const call of pendingToolCalls) {
        const toolStarted = Date.now();

        // Never let workflow/page guidance bypass registered executable actions.
        const redirected = await redirectManualGuidanceToActionPlan(
          call.name,
          message,
          context,
        );
        const effectiveName = resolveAssistantToolName(redirected?.tool ?? call.name);
        const effectiveArgs = redirected?.args ?? call.arguments;

        if (redirected) {
          yield {
            type: "tool_call",
            name: effectiveName,
            arguments: effectiveArgs,
          };
        }

        const result = await executeAssistantTool(effectiveName, effectiveArgs, context);
        const status =
          result && typeof result === "object" && "status" in result
            ? String((result as { status?: string }).status)
            : "ok";
        const success = status === "ok" || status === "partial";
        void recordQualityEvent({
          kind: success ? "tool_success" : "tool_error",
          toolName: effectiveName,
          durationMs: Date.now() - toolStarted,
          success,
          meta: {
            status,
            redirectedFrom: redirected ? call.name : undefined,
          },
        });
        const gaps =
          result && typeof result === "object" && Array.isArray((result as { dataGaps?: unknown }).dataGaps)
            ? ((result as { dataGaps: string[] }).dataGaps?.length ?? 0)
            : 0;
        if (gaps > 0) {
          recordedDataGaps += gaps;
          void recordQualityEvent({
            kind: "data_gap",
            toolName: effectiveName,
            meta: { count: gaps },
          });
        }
        yield { type: "tool_result", name: effectiveName, result };
        const extracted = extractArtifactsFromToolResult(
          result,
          effectiveName,
          input.session.sub,
        );
        if (extracted.followUps.length > 0) turnFollowUps = extracted.followUps;
        if (extracted.artifacts.length > 0) turnArtifacts = extracted.artifacts;

        // Action Framework / Planning Engine proposals end the turn — do not let the
        // model continue with manual navigation instructions.
        if (
          effectiveName === "proposeBusinessActionPlan" ||
          effectiveName === "planBusinessGoal"
        ) {
          assistantText =
            extracted.errorText ??
            extracted.successText ??
            (typeof (result as { summary?: { message?: string } })?.summary?.message ===
            "string"
              ? (result as { summary: { message: string } }).summary.message
              : "Completed.");
          yield { type: "delta", text: assistantText };

          const assistantMessage: AssistantChatMessage = {
            id: createMessageId(),
            role: "assistant",
            content: assistantText,
            createdAt: new Date().toISOString(),
            followUpActions: turnFollowUps.length > 0 ? turnFollowUps : undefined,
            artifacts: turnArtifacts.length > 0 ? turnArtifacts : undefined,
          };

          const saved = await persistTurn({
            session: input.session,
            conversationId: resolved.conversationId,
            history: resolved.history,
            userMessage,
            assistantMessage,
            context,
            title: resolved.title,
          });

          yield {
            type: "done",
            message: assistantMessage,
            conversationId: saved.conversationId,
          };
          return;
        }

        toolOutputs.push({
          type: "function_call_output",
          call_id: call.callId,
          output: JSON.stringify(result),
        });
      }

      // Continue the turn with tool outputs as additional input context.
      inputItems = [
        ...inputItems,
        {
          role: "assistant",
          content:
            assistantText ||
            `Calling tools: ${pendingToolCalls.map((call) => call.name).join(", ")}`,
        },
        {
          role: "user",
          content: `Tool results (JSON):\n${JSON.stringify(
            toolOutputs.map((output) => ({
              call_id: output.call_id,
              output: safeParse(output.output),
            })),
            null,
            2,
          )}\nIf tools returned live business data (queryBusiness, search*, brief, health, insights), answer the user's question directly with those facts — never refuse as out of scope. If a tool created a file (status=ok + artifact), reply briefly that the filename is ready. Do not invent success. Do not suggest Excel/Email/Report menus unless asked.`,
        },
      ];
      assistantText = "";
      pendingToolCalls = [];
    }

    if (!assistantText.trim()) {
      if (turnArtifacts.length > 0) {
        assistantText = `Done.\n\n${turnArtifacts[0]!.filename} is ready.`;
      } else {
        assistantText = "I could not complete that just now. Please try again.";
      }
      yield { type: "delta", text: assistantText };
      void recordQualityEvent({ kind: "hallucination_guard", meta: { reason: "empty_assistant_text" } });
    }

    // Never claim a PDF was generated unless we have a real artifact.
    if (/generated|created|ready/i.test(assistantText) && /pdf/i.test(assistantText) && turnArtifacts.length === 0) {
      assistantText =
        "I could not create the PDF. Please try again, or say “Create a PDF of all employees.”";
    }

    // Prefer concise confirmation when we have a real artifact.
    if (turnArtifacts.length > 0) {
      assistantText = `Done.\n\n${turnArtifacts[0]!.filename} is ready.`;
    }

    const lastBoardPackResult = (() => {
      // Reconstruct success card from artifact filenames when OpenAI tool path was used.
      const pdf = turnArtifacts.find((a) => a.kind === "pdf" || a.filename.endsWith(".pdf"));
      const pptx = turnArtifacts.find((a) => a.kind === "pptx" || a.filename.endsWith(".pptx"));
      if (!pdf || !pptx) return null;
      if (!/board pack/i.test(pdf.title) && !/board pack/i.test(pdf.filename)) return null;
      const meetingMatch = pdf.filename.match(/(\d{4}-\d{2}-\d{2})/);
      if (!meetingMatch?.[1]) return null;
      return cardsFromBoardPackSuccess({
        packName: pdf.title.replace(/\s*\(PDF\)\s*$/i, "") || pdf.filename.replace(/\.pdf$/i, ""),
        meetingDate: meetingMatch[1],
        status: "Draft",
        folderPath: "Corporate Information / Board Deck",
        boardDeckHref: "/dashboard?view=board-pack",
        pdfOpenUrl: pdf.openUrl,
        pdfDownloadUrl: pdf.downloadUrl,
        pptxDownloadUrl: pptx.downloadUrl,
        followUpActions: turnFollowUps,
      });
    })();

    if (lastBoardPackResult) {
      assistantText = "Board Pack Generated Successfully";
    }

    void recordQualityEvent({
      kind: "turn",
      durationMs: Date.now() - turnStartedAt,
      success: true,
      meta: { dataGaps: recordedDataGaps, view: context.page.activeView },
    });

    const assistantMessage: AssistantChatMessage = {
      id: createMessageId(),
      role: "assistant",
      content: assistantText,
      createdAt: new Date().toISOString(),
      followUpActions: turnFollowUps.length > 0 ? turnFollowUps : undefined,
      artifacts: turnArtifacts.length > 0 ? turnArtifacts : undefined,
      executionCards: lastBoardPackResult ?? undefined,
    };

    const saved = await persistTurn({
      session: input.session,
      conversationId: resolved.conversationId,
      history: resolved.history,
      userMessage,
      assistantMessage,
      context,
      title: resolved.title,
    });

    yield {
      type: "done",
      message: assistantMessage,
      conversationId: saved.conversationId,
    };
  } catch (error) {
    yield {
      type: "error",
      error: formatOpenAIError(error),
      retryable: isRetryableOpenAIError(error),
    };
  }
}

function safeParse(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

export function createAssistantSseResponse(
  generator: AsyncGenerator<AssistantStreamEvent>,
): Response {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let terminalEvent = false;
      try {
        for await (const event of generator) {
          if (event.type === "done" || event.type === "error") {
            terminalEvent = true;
          }
          controller.enqueue(encoder.encode(encodeSse(event)));
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error("[EA] EXCEPTION — SSE stream");
        console.error(`- correlationId: ${getEaCorrelationId()}`);
        console.error(`- message: ${err.message}`);
        console.error(`- stack: ${err.stack ?? "(no stack)"}`);
        if (err.stack) console.error(err.stack);
        controller.enqueue(
          encoder.encode(
            encodeSse({
              type: "error",
              error: err.message,
              retryable: isRetryableOpenAIError(error),
            }),
          ),
        );
        terminalEvent = true;
      } finally {
        if (!terminalEvent) {
          console.error("[EA] SSE stream ended without done/error");
          console.error(`- correlationId: ${getEaCorrelationId()}`);
          controller.enqueue(
            encoder.encode(
              encodeSse({
                type: "error",
                error: "The assistant stream ended before a reply was ready. Please try again.",
                retryable: true,
              }),
            ),
          );
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
