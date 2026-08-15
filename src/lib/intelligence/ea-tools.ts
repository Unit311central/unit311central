import type { OrchestrationRoute } from "@/lib/ai-operating-assistant/orchestration-route";
import type { AssistantToolExecutionContext } from "@/lib/ai-operating-assistant/tool-result";
import type { EaIntentResolverContext } from "@/lib/ai-operating-assistant/workspace-packs/types";
import { packToolRoute } from "@/lib/ai-operating-assistant/workspace-packs/orchestration-helpers";
import type { AssistantToolDefinition } from "@/lib/ai-operating-assistant/types";
import {
  buildIntelligenceBriefing,
  searchIntelligenceRecords,
} from "@/lib/intelligence/provider";
import {
  getIntelligencePackBySlug,
  listIntelligenceDomainsForWorkspace,
} from "@/lib/intelligence/registry";
import { resolveIntelligenceHostSurface } from "@/lib/intelligence/workspace-context";
import type { IntelligenceDomainId } from "@/lib/intelligence/types";

export const CENTRAL_INTELLIGENCE_TOOL_DEFINITIONS: AssistantToolDefinition[] = [
  {
    name: "intelligence.listDomains",
    description:
      "List intelligence domains registered for the current workspace via the central Intelligence framework.",
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "intelligence.searchRecords",
    description:
      "Search intelligence records for a workspace domain (competitor, member, portfolio, regulatory, etc.).",
    parameters: {
      type: "object",
      properties: {
        domainId: { type: "string", description: "Intelligence domain id from the workspace pack." },
        search: { type: "string", description: "Optional text search." },
        limit: { type: "number", description: "Max records (default 10)." },
      },
      required: ["domainId"],
      additionalProperties: false,
    },
  },
  {
    name: "intelligence.getBriefing",
    description:
      "Build the executive intelligence briefing for a workspace domain — what needs attention.",
    parameters: {
      type: "object",
      properties: {
        domainId: { type: "string", description: "Intelligence domain id." },
      },
      required: ["domainId"],
      additionalProperties: false,
    },
  },
];

function workspaceSlugFromBusiness(
  slug: string | null | undefined,
): string | null {
  const normalized = String(slug ?? "").trim().toLowerCase();
  if (!normalized) return null;
  return getIntelligencePackBySlug(normalized)?.slug ?? normalized;
}

function defaultDomainId(workspaceSlug: string): IntelligenceDomainId | null {
  const domains = listIntelligenceDomainsForWorkspace(workspaceSlug);
  return domains[0]?.id ?? null;
}

type IntelligenceToolHandler = (
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
) => Promise<unknown>;

export const CENTRAL_INTELLIGENCE_TOOL_HANDLERS: Record<string, IntelligenceToolHandler> = {
  "intelligence.listDomains": async (_args, ctx) => {
    const workspaceSlug = workspaceSlugFromBusiness(ctx.business.workspace.slug);
    if (!workspaceSlug) {
      return { ok: false, message: "Workspace context is required for intelligence." };
    }
    const pack = getIntelligencePackBySlug(workspaceSlug);
    if (!pack) {
      return { ok: false, message: "No intelligence pack registered for this workspace." };
    }
    return {
      workspaceSlug: pack.slug,
      label: pack.label,
      domains: pack.domains.map((d) => ({ id: d.id, label: d.label, description: d.description })),
    };
  },
  "intelligence.searchRecords": async (args, ctx) => {
    const workspaceSlug = workspaceSlugFromBusiness(ctx.business.workspace.slug);
    if (!workspaceSlug) {
      return { ok: false, message: "Workspace context is required for intelligence." };
    }
    const domainId = String(args.domainId ?? "").trim();
    if (!domainId) {
      return { ok: false, message: "domainId is required." };
    }
    const result = await searchIntelligenceRecords(
      {
        workspaceSlug,
        filter: { domainIds: [domainId], search: args.search ? String(args.search) : undefined },
        limit: Number(args.limit ?? 10),
        offset: 0,
      },
      {
        access: {
          roleView: "admin",
          hostSurface: resolveIntelligenceHostSurface(workspaceSlug),
          isExternal: false,
          isAdmin: true,
        },
      },
    );
    return result;
  },
  "intelligence.getBriefing": async (args, ctx) => {
    const workspaceSlug = workspaceSlugFromBusiness(ctx.business.workspace.slug);
    if (!workspaceSlug) {
      return { ok: false, message: "Workspace context is required for intelligence." };
    }
    const domainId = String(args.domainId ?? "").trim();
    if (!domainId) {
      return { ok: false, message: "domainId is required." };
    }
    const briefing = await buildIntelligenceBriefing(workspaceSlug, domainId, {
      access: {
        roleView: "admin",
        hostSurface: resolveIntelligenceHostSurface(workspaceSlug),
        isExternal: false,
        isAdmin: true,
      },
    });
    return briefing;
  },
};

/** Resolve NL intelligence queries through the central provider before legacy EA tools. */
export async function resolveIntelligenceEaOrchestration(
  ctx: EaIntentResolverContext,
): Promise<OrchestrationRoute | null> {
  const workspaceSlug = workspaceSlugFromBusiness(ctx.business.workspace.slug);
  if (!workspaceSlug) return null;

  const pack = getIntelligencePackBySlug(workspaceSlug);
  if (!pack) return null;

  for (const resolver of pack.eaBridge?.intentResolvers ?? []) {
    const route = await resolver({
      message: ctx.message,
      business: ctx.business,
      history: ctx.history,
      workspaceSlug: pack.slug,
    });
    if (route) return route;
  }

  const message = ctx.message.toLowerCase();
  const domainId =
    pack.domains.find((d) => message.includes(d.label.toLowerCase()))?.id ??
    defaultDomainId(pack.slug);

  if (!domainId) return null;

  if (/intelligence brief|what needs attention|intelligence overview/.test(message)) {
    return packToolRoute({
      tool: "intelligence.getBriefing",
      args: { domainId },
      reason: "Central intelligence briefing",
    });
  }

  if (/search intelligence|intelligence records|intelligence signals/.test(message)) {
    const search = message
      .replace(/search intelligence|intelligence records|intelligence signals/gi, "")
      .trim();
    return packToolRoute({
      tool: "intelligence.searchRecords",
      args: { domainId, search: search || undefined, limit: 8 },
      reason: "Central intelligence search",
    });
  }

  if (/list intelligence domains|intelligence domains/.test(message)) {
    return packToolRoute({
      tool: "intelligence.listDomains",
      args: {},
      reason: "List intelligence domains",
    });
  }

  return null;
}
