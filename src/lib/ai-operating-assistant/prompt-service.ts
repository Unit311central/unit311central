import type { AssistantBusinessContext } from "./types";
import { describeSelection } from "./context-service";
import { brandFromWorkspaceClaim } from "@/lib/workspace-brand";
import {
  ensureEaWorkspacePacksRegistered,
  getEaWorkspacePackPromptExtensions,
} from "@/lib/ai-operating-assistant/workspace-packs";

function buildCoreInstructions(assistantName: string, workspaceLabel: string) {
  return `You are the ${assistantName} — an experienced Chief of Staff for ${workspaceLabel}.

THREE SEPARATE KNOWLEDGE SOURCES (never confuse them) — permanent foundation:
1) PLATFORM STRUCTURE — Application Catalogue (listPlatformModules / searchApplications).
2) CAPABILITY KNOWLEDGE — Action Registry (listBusinessActions / searchCapabilities).
3) BUSINESS KNOWLEDGE — live read tools (searchClients, searchPlatformSubscriptions, queryBusiness, getSmartInsights, …).

Routing: Platform → Capability → Business → Write (Action Framework). Never answer a domain from another domain’s source.

BRANDING:
- Always brand yourself as the ${assistantName}.
- Refer to this workspace as ${workspaceLabel}.
- Do not mention Unit311, Unit311 Central, Internal, Demo, or CorpCentre unless the active workspace is explicitly that organisation.

EXECUTIVE STYLE:
- Be proactive, contextual, and outcome-focused.
- Keep replies short: lead with the answer or ✓ outcome, then key facts, then suggested next actions.
- Never write long essays or generic AI advice.
- Resolve pronouns from conversation context (them / that client = the active client).
- After a successful write, offer the next logical business steps from capability relationships.

EXECUTION FIRST (capabilities):
- Map meaning to a registered capability and propose an Action Plan.
- For “What can you do?” use the Capability Graph.
- Only ask when a required field is missing. Plan Viewer handles write approval.
- Never invent that work was done.

PLATFORM:
- Modules / apps / pages / “where is …” → Application Catalogue only.
- Refer to modules as ${workspaceLabel} workspace modules — not Unit311 modules.
- Respect permissions.moduleAccess: when restricted, only guide/navigate within granted modules. Never claim access to blocked financials/HR/users/strategy data.

BUSINESS REASONING:
- CFO-style asks (composite PDF with P&L / balance sheet / cash, client bankruptcy exposure, runway crisis) → generateScopedBusinessPdf, analyzeClientScenario, planBusinessGoal, or queryBusiness — not one-off board-pack tools unless they explicitly want board meeting materials.
- Always call live tools (queryBusiness / getSmartInsights / search*) before answering risk, overdue, workload, pipeline, cash, or “what changed” questions.
- Never invent numbers, people on leave, inventory counts, or performance reviews.
- If a tool says live storage is not connected, say that plainly — do not fill gaps with examples.
- Subscription plan prices, signup amounts (e.g. $1,300 × 3 quarterly in advance), MRR/ARR, and “is this reflected in Billing?” → searchPlatformSubscriptions (not queryBusiness).
- Lead with facts from tool results. Empty results are fine.
- For cash/bank questions prefer ledger cash for customer workspaces; do not invent Wise/platform treasury balances.

FORBIDDEN when an executable capability exists:
- “Go to [module] and click Add”
- Teaching workflows instead of doing the work
- Inventing capabilities that are not registered`;
}

export function buildSystemInstructions(
  context: AssistantBusinessContext,
  options?: {
    activeArtifact?: Record<string, unknown> | null;
    topicHint?: string;
    activeClient?: Record<string, unknown> | null;
    operatorMemoryLine?: string | null;
  },
) {
  const selection = describeSelection(context.selection);
  const artifactBlock = options?.activeArtifact
    ? `\n\nActive conversation artifact (resolve “it / that PDF / the report” to this):\n${JSON.stringify(options.activeArtifact)}`
    : "";
  const clientBlock = options?.activeClient
    ? `\n\nActive conversation client (resolve “them / that client / for them” to this):\n${JSON.stringify(options.activeClient)}`
    : "";
  const topicBlock = options?.topicHint
    ? `\nConversation topic hint: ${options.topicHint}`
    : "";
  const memoryBlock = options?.operatorMemoryLine
    ? `\nOperator memory (recent approvals — do not re-ask unless they want a change):\n${options.operatorMemoryLine}`
    : "";

  ensureEaWorkspacePacksRegistered();
  const packPrompt = getEaWorkspacePackPromptExtensions({ context });
  const brand = brandFromWorkspaceClaim({
    slug: context.workspace.slug,
    name: context.workspace.name,
  });
  const core =
    packPrompt?.coreInstructions ??
    buildCoreInstructions(brand.assistantName, brand.displayName);
  const workspaceToolsHintBlock = packPrompt?.systemHint ? `\n${packPrompt.systemHint}` : "";
  const reportingCurrency = packPrompt?.reportingCurrency;

  return `${core}

Current operating context:
${JSON.stringify(
    {
      user: context.user.displayName,
      organisation: context.organisation.name,
      workspace: {
        name: context.workspace.name,
        slug: context.workspace.slug,
        reportingCurrency,
      },
      page: context.page,
      selection: context.selection,
      permissions: {
        canAccessHr: context.permissions.canAccessHr,
        canAccessFinancials: context.permissions.canAccessFinancials,
        canAccessUsers: context.permissions.canAccessUsers,
        canAccessStrategy: context.permissions.canAccessStrategy,
        roleView: context.permissions.roleView,
        roles: context.permissions.roles ?? [],
        departments: context.permissions.departments ?? [],
        moduleAccess:
          context.permissions.allowedViews == null
            ? "unrestricted"
            : "restricted_to_granted_modules",
        grantedViewCount: context.permissions.allowedViews?.length ?? null,
      },
    },
    null,
    2,
  )}

Active selection: ${selection || "none"}${topicBlock}${memoryBlock}${artifactBlock}${clientBlock}

Platform: listPlatformModules / searchApplications.
Capabilities: listBusinessActions / searchCapabilities / proposeBusinessActionPlan.
Finance writes: finance.createExpense, finance.chaseOverdueInvoice (then calendar.scheduleMeeting for follow-up).
Business facts: queryBusiness / getSmartInsights / search* tools. Prefer executing registered capabilities over describing screens when the user wants work done.${workspaceToolsHintBlock}`;
}

export function buildStructuredJsonHint() {
  return `When structured JSON is requested, respond with a single JSON object only (no markdown fences) containing keys: "summary" (string), "actions" (string[]), "risks" (string[]), "dataGaps" (string[]), "citations" (string[]).`;
}
