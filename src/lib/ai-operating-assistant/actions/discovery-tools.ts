/**
 * OpenAI-discoverable tools that expose the Action Framework / Capability Graph
 * and the separate Application Catalogue (platform structure).
 */

import { asString, toolOk, type AssistantToolExecutionContext } from "../tool-result";
import type { InternalOperationsView } from "@/lib/internal-operations-data";

import {
  answerPlatformQuestion,
  getPlatformModule,
  listPlatformModulesForEntitlements,
  searchApplicationCatalogue,
} from "../application-catalogue";
import {
  buildActionPlan,
  type ProposedActionStepInput,
} from "./execution-pipeline";
import { listAssistantActionDescriptors } from "./registry";
import {
  answerCapabilityQuestion,
  buildCapabilityGraph,
  listCapabilities,
  searchCapabilities,
} from "./capability-service";

function allowedViewsFromCtx(ctx: AssistantToolExecutionContext) {
  return ctx.business.permissions.allowedViews as
    | InternalOperationsView[]
    | null
    | undefined;
}

function moduleVisible(
  moduleId: string,
  allowed: InternalOperationsView[] | null | undefined,
) {
  return listPlatformModulesForEntitlements(allowed).some((m) => m.id === moduleId);
}

export async function listPlatformModulesTool(
  _args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
) {
  void _args;
  const modules = listPlatformModulesForEntitlements(allowedViewsFromCtx(ctx));
  return toolOk(
    "listPlatformModules",
    modules.map((m) => ({
      id: m.id,
      label: m.displayName,
      description: m.description,
      applicationCount: m.applications.length,
      applications: m.applications.map((a) => a.label),
      href: m.navigation.href,
    })),
    {
      source: ["assistant:application-catalogue"],
      pageSize: modules.length || 1,
      summary: {
        kind: "platform_modules",
        answer: answerPlatformQuestion("What modules exist?")?.answer ?? null,
        note: "Application Catalogue — platform structure, not Action Registry capabilities. Filtered to operator grants.",
      },
    },
  );
}

export async function searchApplicationsTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
) {
  const allowed = allowedViewsFromCtx(ctx);
  const query =
    asString(args.query) || asString(args.question) || asString(args.module) || "";
  if (!query.trim()) {
    return listPlatformModulesTool({}, ctx);
  }

  const answered = answerPlatformQuestion(query);
  if (answered) {
    const modules = (answered.modules ?? []).filter((m) => moduleVisible(m.id, allowed));
    return toolOk(
      "searchApplications",
      modules.map((m) => ({
        id: m.id,
        label: m.displayName,
        description: m.description,
        applications: m.applications.map((a) => ({
          label: a.label,
          pages: a.pages.map((p) => p.label),
          href: a.href,
        })),
        href: m.navigation.href,
      })),
      {
        source: ["assistant:application-catalogue"],
        pageSize: modules.length || 1,
        summary: {
          kind: answered.kind,
          answer: answered.answer,
          navigateHref: answered.navigateHref ?? null,
        },
        followUpActions: answered.navigateHref
          ? [
              {
                id: "open_platform_location",
                label: answered.navigateLabel ?? "Open",
                kind: "navigate" as const,
                href: answered.navigateHref,
              },
            ]
          : undefined,
      },
    );
  }

  const module = getPlatformModule(query);
  if (module && moduleVisible(module.id, allowed)) {
    const scoped = listPlatformModulesForEntitlements(allowed).find((m) => m.id === module.id);
    const visible = scoped ?? module;
    return toolOk(
      "searchApplications",
      [
        {
          id: visible.id,
          label: visible.displayName,
          description: visible.description,
          applications: visible.applications.map((a) => ({
            label: a.label,
            pages: a.pages.map((p) => p.label),
            href: a.href,
          })),
          href: visible.navigation.href,
        },
      ],
      {
        source: ["assistant:application-catalogue"],
        pageSize: 1,
        summary: {
          kind: "module_detail",
          answer: answerPlatformQuestion(`What is under ${visible.displayName}`)?.answer,
        },
      },
    );
  }

  const allowedIds = new Set(
    listPlatformModulesForEntitlements(allowed).map((m) => m.id),
  );
  const hits = searchApplicationCatalogue(query, 10).filter((h) =>
    allowedIds.has(h.entry.module.id),
  );
  return toolOk(
    "searchApplications",
    hits.map((h) => {
      if (h.entry.kind === "module") {
        return {
          kind: "module",
          module: h.entry.module.displayName,
          href: h.entry.module.navigation.href,
        };
      }
      if (h.entry.kind === "application") {
        return {
          kind: "application",
          module: h.entry.module.displayName,
          application: h.entry.application.label,
          href: h.entry.application.href,
        };
      }
      return {
        kind: "page",
        module: h.entry.module.displayName,
        application: h.entry.application.label,
        page: h.entry.page.label,
        href: h.entry.page.href,
      };
    }),
    {
      source: ["assistant:application-catalogue"],
      pageSize: hits.length || 1,
      summary: {
        kind: hits.length ? "search" : "unsupported",
        answer: hits.length
          ? "Matches from the Application Catalogue (platform structure)."
          : "No matching modules/applications in the Application Catalogue.",
      },
    },
  );
}

export async function listBusinessActionsTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
) {
  const { ensureActionModulesRegistered } = await import(
    "@/lib/ai-operating-assistant/action-orchestration"
  );
  ensureActionModulesRegistered();

  const moduleFilter = asString(args.module) as
    | import("./types").AssistantActionModule
    | undefined;
  const capabilities = listCapabilities({
    business: ctx.business,
    module: moduleFilter,
  });
  const descriptors = listAssistantActionDescriptors({
    business: ctx.business,
    module: moduleFilter,
  });
  const graph = buildCapabilityGraph();

  return toolOk("listBusinessActions", capabilities, {
    source: ["assistant:capability-service"],
    pageSize: capabilities.length || 1,
    summary: {
      count: capabilities.length,
      statements: capabilities.map((c) => c.statement),
      note:
        capabilities.length === 0
          ? "Capability Graph is empty. Register actions with capability metadata."
          : "Capabilities discovered from the Action Registry / Capability Graph.",
      modules: [...new Set(capabilities.map((d) => d.module))],
      businessObjects: [...new Set(capabilities.map((d) => d.businessObject))],
      relationshipCount: graph.edges.length,
      descriptors,
    },
    dataGaps:
      capabilities.length === 0
        ? ["No domain action handlers registered yet."]
        : undefined,
  });
}

export async function searchCapabilitiesTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
) {
  const { ensureActionModulesRegistered } = await import(
    "@/lib/ai-operating-assistant/action-orchestration"
  );
  ensureActionModulesRegistered();

  const query = asString(args.query) || asString(args.question) || "";
  if (!query.trim()) {
    const answered = answerCapabilityQuestion("What can you do?", {
      business: ctx.business,
    });
    return toolOk(
      "searchCapabilities",
      answered?.capabilities ?? listCapabilities({ business: ctx.business }),
      {
        source: ["assistant:capability-service"],
        pageSize: answered?.capabilities.length || 1,
        summary: {
          kind: answered?.kind ?? "catalogue",
          answer: answered?.answer ?? "",
          statements: answered?.statements ?? [],
        },
      },
    );
  }

  const answered = answerCapabilityQuestion(query, { business: ctx.business });
  if (answered) {
    return toolOk("searchCapabilities", answered.capabilities, {
      source: ["assistant:capability-service"],
      pageSize: answered.capabilities.length || 1,
      summary: {
        kind: answered.kind,
        answer: answered.answer,
        statements: answered.statements,
      },
    });
  }

  const hits = searchCapabilities(query, { business: ctx.business });
  return toolOk(
    "searchCapabilities",
    hits.map((h) => ({ ...h.capability, score: h.score, matchedOn: h.matchedOn })),
    {
      source: ["assistant:capability-service"],
      pageSize: hits.length || 1,
      summary: {
        kind: hits.length ? "search" : "unsupported",
        answer: hits.length
          ? hits.map((h) => h.capability.statement).join("\n")
          : "No matching capabilities in the Action Registry.",
        statements: hits.map((h) => h.capability.statement),
      },
    },
  );
}

export async function proposeBusinessActionPlanTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
) {
  const { ensureActionModulesRegistered } = await import(
    "@/lib/ai-operating-assistant/action-orchestration"
  );
  ensureActionModulesRegistered();

  const aiRequest = asString(args.request) || asString(args.question) || null;
  const title = asString(args.title) || null;
  const conversationId = asString(args.conversationId) || null;
  const rawSteps = Array.isArray(args.steps) ? args.steps : [];

  const steps: ProposedActionStepInput[] = [];
  for (const entry of rawSteps) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const actionId = asString(row.actionId) || asString(row.id);
    if (!actionId) continue;
    steps.push({
      actionId,
      input:
        row.input && typeof row.input === "object"
          ? (row.input as Record<string, unknown>)
          : {},
      dependsOnStepIds: Array.isArray(row.dependsOnStepIds)
        ? row.dependsOnStepIds.filter((id): id is string => typeof id === "string")
        : undefined,
    });
  }

  const { plan, blocked, blockReason } = await buildActionPlan({
    business: ctx.business,
    steps,
    aiRequest,
    conversationId,
    title,
  });

  if (blocked || plan.status !== "proposed") {
    return toolOk(
      "proposeBusinessActionPlan",
      [{ planId: plan.id, blocked: true, blockReason: blockReason ?? null }],
      {
        source: ["assistant:action-pipeline"],
        pageSize: 1,
        summary: {
          planId: plan.id,
          status: plan.status,
          stepCount: plan.steps.length,
          requiresConfirmation: false,
          blocked: true,
          executed: false,
          message: blockReason || "I couldn't complete that.",
        },
      },
    );
  }

  const { executeActionPlan } = await import("./execution-pipeline");
  const { shortCeoActionMessage } = await import("./instant-execute");
  const executed = await executeActionPlan({
    planId: plan.id,
    business: ctx.business,
    confirmed: true,
  });

  const succeeded = [...executed.plan.steps]
    .reverse()
    .find((step) => step.status === "succeeded" && step.result);
  const message = succeeded?.result
    ? shortCeoActionMessage({
        actionId: succeeded.actionId,
        result: succeeded.result,
        stepInput: succeeded.input,
      })
    : executed.summary || "Completed.";

  return toolOk(
    "proposeBusinessActionPlan",
    [
      {
        planId: executed.plan.id,
        blocked: false,
        executed: true,
        status: executed.plan.status,
      },
    ],
    {
      source: ["assistant:action-pipeline"],
      pageSize: 1,
      summary: {
        planId: executed.plan.id,
        status: executed.plan.status,
        stepCount: executed.plan.steps.length,
        requiresConfirmation: false,
        blocked: false,
        executed: true,
        message,
      },
    },
  );
}
