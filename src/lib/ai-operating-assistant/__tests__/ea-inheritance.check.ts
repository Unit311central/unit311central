/**
 * EA central inheritance — FutureWorkspaceX proves pack-only configuration works.
 * Run: npm run prove:ea-inheritance
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { resolveOrchestrationRoute } from "@/lib/ai-operating-assistant/action-orchestration";
import { listPlatformModules } from "@/lib/ai-operating-assistant/application-catalogue";
import { shouldSynthesizeExecutiveToolResult } from "@/lib/ai-operating-assistant/ea-llm-synthesis";
import { buildSystemInstructions } from "@/lib/ai-operating-assistant/prompt-service";
import { getOpenAIToolSchemas } from "@/lib/ai-operating-assistant/tool-service";
import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import {
  ensureEaWorkspacePacksRegistered,
  getEaWorkspacePackForSlug,
  registerEaWorkspacePack,
} from "@/lib/ai-operating-assistant/workspace-packs";
import {
  FUTURE_WORKSPACE_SLUG,
  futureWorkspacePack,
} from "@/lib/ai-operating-assistant/workspace-packs/future-workspace-pack";

const CENTRAL_EA_FILES = [
  "action-orchestration.ts",
  "application-catalogue.ts",
  "assistant-runtime.ts",
  "boardpack-tools.ts",
  "business-snapshot-service.ts",
  "daily-brief-service.ts",
  "ea-llm-synthesis.ts",
  "pdf-brand.ts",
  "proactive-tools.ts",
  "prompt-service.ts",
  "tool-service.ts",
  "workspace-operational-data.ts",
  "project-portfolio-health-intent.ts",
];

function futureBusiness(): AssistantBusinessContext {
  return {
    user: {
      id: "u-future",
      username: "ceo@futureworkspacex.example",
      displayName: "Future CEO",
      userType: "operator",
    },
    organisation: { id: "org-future", name: "Future Workspace X" },
    workspace: {
      id: "ws-future",
      name: "Future Workspace X",
      slug: FUTURE_WORKSPACE_SLUG,
    },
    page: { activeView: "executive-assistant", label: "Executive Assistant" },
    selection: {},
    permissions: {
      roleView: "executive",
      canAccessFinancials: true,
      canAccessUsers: true,
      canAccessStrategy: true,
      canAccessHr: true,
    },
    generatedAt: new Date().toISOString(),
  };
}

function assertNoFutureWorkspaceCentralBranches() {
  const root = join(process.cwd(), "src/lib/ai-operating-assistant");
  for (const file of CENTRAL_EA_FILES) {
    const source = readFileSync(join(root, file), "utf8");
    assert.ok(
      !source.includes(FUTURE_WORKSPACE_SLUG),
      `${file} must not reference ${FUTURE_WORKSPACE_SLUG}`,
    );
    assert.ok(
      !source.includes("futureworkspacex"),
      `${file} must not reference futureworkspacex slug branches`,
    );
  }
}

function assertCentralPromptServicePackDriven() {
  const source = readFileSync(
    join(process.cwd(), "src/lib/ai-operating-assistant/prompt-service.ts"),
    "utf8",
  );
  for (const pattern of [
    "isAbhiSlug",
    "isOnwardAirSlug",
    "isTalantonImpactSlug",
    "isCorpCentreWorkspaceSlug",
    "legacyWorkspaceToolsHint",
    "CORPCENTRE_INSTRUCTIONS",
  ]) {
    assert.ok(!source.includes(pattern), `prompt-service.ts still contains ${pattern}`);
  }
}

function assertPortfolioIntentPackDriven() {
  const source = readFileSync(
    join(process.cwd(), "src/lib/ai-operating-assistant/project-portfolio-health-intent.ts"),
    "utf8",
  );
  for (const pattern of ["isAbhiSlug", "isOnwardAirSlug", "resolveProjectPortfolioHealthIntent"]) {
    assert.ok(
      !source.includes(pattern),
      `project-portfolio-health-intent.ts still contains ${pattern}`,
    );
  }
}

async function main() {
  assertNoFutureWorkspaceCentralBranches();
  assertCentralPromptServicePackDriven();
  assertPortfolioIntentPackDriven();

  ensureEaWorkspacePacksRegistered();
  registerEaWorkspacePack(futureWorkspacePack);

  const pack = getEaWorkspacePackForSlug(FUTURE_WORKSPACE_SLUG);
  assert.ok(pack?.id === "futureworkspacex", "FutureWorkspaceX pack not registered");

  const business = futureBusiness();
  const schemas = getOpenAIToolSchemas(FUTURE_WORKSPACE_SLUG);
  const names = new Set(schemas.map((schema) => schema.name));
  for (const required of ["queryBusiness", "getDailyBrief", "searchApplications"]) {
    assert.ok(names.has(required), `missing core tool ${required}`);
  }
  assert.ok(!names.has("abhi.getExecutiveBriefing"), "specialist ABHI tools must not leak");

  const modules = listPlatformModules({ workspaceSlug: FUTURE_WORKSPACE_SLUG });
  assert.ok(modules.length >= 8, "catalogue should resolve via pack nav");

  const route = await resolveOrchestrationRoute("How many employees do we have?", [], business);
  assert.equal(route.kind, "tool");
  if (route.kind === "tool") {
    assert.equal(route.intent.tool, "queryBusiness");
  }

  const synthesizes = shouldSynthesizeExecutiveToolResult({
    workspaceSlug: FUTURE_WORKSPACE_SLUG,
    toolName: "queryBusiness",
    toolArgs: { question: "Summarise clients" },
    userMessage: "Summarise clients",
    toolResult: { status: "ok" },
  });
  assert.ok(synthesizes, "pack synthesis rules should cover queryBusiness");

  const instructions = buildSystemInstructions(business);
  assert.ok(instructions.includes("Future Workspace X"), "generic core instructions apply");
  assert.ok(!instructions.includes("ABHI — reporting currency"), "no ABHI pack hint leaked");

  console.log("EA inheritance checks passed (FutureWorkspaceX inherits central EA via pack only).");
}

void main();
