/**
 * Real EA — general intelligence mode: no vertical regex lanes, model picks tools.
 * Run: npm run prove:ea-real
 */
import assert from "node:assert/strict";

import { resolveOrchestrationRoute } from "@/lib/ai-operating-assistant/action-orchestration";
import { registerAllActionModules } from "@/lib/ai-operating-assistant/actions/register-all-modules";
import { extractClientNameFromScenario } from "@/lib/ai-operating-assistant/client-scenario-tools";
import { isEaGeneralIntentMode } from "@/lib/ai-operating-assistant/ea-general-mode";
import { resolveDirectIntent } from "@/lib/ai-operating-assistant/intent-router";
import { getAssistantModel } from "@/lib/ai-operating-assistant/openai-client";
import { buildSystemInstructions } from "@/lib/ai-operating-assistant/prompt-service";
import { parseScopedPdfRequest } from "@/lib/ai-operating-assistant/scoped-pdf-metrics";
import {
  ASSISTANT_TOOL_DEFINITIONS,
  getOpenAIToolSchemas,
} from "@/lib/ai-operating-assistant/tool-service";
import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";

registerAllActionModules();

const OPEN_QUESTIONS = [
  "Make me a PDF report for the last 6 months with P&L, balance sheet, and cash position",
  "Client Meridian Packaging has just gone bankrupt — what are the ramifications?",
  "I'm worried we are going out of business — what should I do?",
  "Summarise the business — cash, pipeline, and risks",
  "How much cash do we have in the bank?",
  "Which customers owe us the most overdue money?",
  "What is our monthly burn and runway?",
  "Create a financial report PDF for the board",
  "for all my active clients, they should pay ($1,300 × 3) on signup — is this reflected?",
  "Show hot leads",
  "What needs my decision today?",
] as const;

const business: AssistantBusinessContext = {
  user: { id: "u", username: "u", displayName: "U", userType: "internal" },
  organisation: { id: null, name: null },
  workspace: { id: null, name: "Northstar", slug: "northstar-demo" },
  page: { activeView: "ea", label: "EA", pathname: null },
  selection: {
    clientId: null,
    clientName: null,
    projectId: null,
    projectName: null,
    employeeId: null,
    employeeName: null,
    contractId: null,
    contractName: null,
    fileId: null,
    fileName: null,
  },
  permissions: {
    roleView: "c-suite",
    canAccessFinancials: true,
    canAccessUsers: true,
    canAccessStrategy: true,
    canAccessHr: true,
  },
  generatedAt: new Date().toISOString(),
};

async function runEaRealSuite() {
  assert.equal(isEaGeneralIntentMode(), true, "real EA mode should be default");
  assert.equal(
    getAssistantModel(),
    "gpt-5.6-terra",
    "production EA should default to Terra unless OPENAI_ASSISTANT_MODEL is set",
  );

  const toolNames = new Set(ASSISTANT_TOOL_DEFINITIONS.map((tool) => tool.name));
  assert.ok(toolNames.has("getOrgContext"), "getOrgContext registered");
  assert.ok(toolNames.has("generateScopedBusinessPdf"), "scoped PDF compositor available");
  assert.ok(toolNames.has("analyzeClientScenario"), "client scenario tool available");
  assert.ok(toolNames.has("planBusinessGoal"), "planning tool available");

  const schemas = getOpenAIToolSchemas("northstar-demo");
  assert.ok(
    schemas.some((schema) => schema.name === "getOrgContext"),
    "getOrgContext exposed to model",
  );

  const instructions = buildSystemInstructions(business);
  assert.match(instructions, /answer ANY executive question/i, "open Q&A contract in system prompt");
  assert.match(instructions, /getOrgContext/i, "getOrgContext in system prompt");
  assert.doesNotMatch(
    instructions,
    /CFO-style asks/i,
    "legacy CFO lane wording removed",
  );

  const routingFailures: string[] = [];
  for (const prompt of OPEN_QUESTIONS) {
    const intent = resolveDirectIntent(prompt, []);
    if (intent != null) {
      routingFailures.push(`resolveDirectIntent should be null for: ${prompt} → ${intent.tool}`);
    }
  }
  if (routingFailures.length > 0) {
    console.error("prove:ea-real routing failures:\n", routingFailures.join("\n"));
    process.exit(1);
  }

  const orchestrationFailures: string[] = [];
  for (const prompt of OPEN_QUESTIONS) {
    const route = await resolveOrchestrationRoute(prompt, [], business);
    if (route.kind === "tool" && route.intent.tool !== "searchApplications") {
      orchestrationFailures.push(
        `${prompt} → tool short-circuit ${route.intent.tool} (expected none or searchApplications)`,
      );
    }
  }
  if (orchestrationFailures.length > 0) {
    console.error("prove:ea-real orchestration failures:\n", orchestrationFailures.join("\n"));
    process.exit(1);
  }

  const scoped = parseScopedPdfRequest(OPEN_QUESTIONS[0]);
  assert.ok(scoped.metrics.includes("pnl"));
  assert.ok(scoped.metrics.includes("balance_sheet"));
  assert.ok(scoped.metrics.includes("cash"));

  assert.equal(
    extractClientNameFromScenario("Client Meridian Packaging has just gone bankrupt"),
    "Meridian Packaging",
  );

  const followUp = resolveDirectIntent("Generate it.", [
    {
      id: "1",
      role: "user",
      content: "Create an engineering report for my boss",
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      role: "assistant",
      content: "I can prepare an engineering status report.",
      createdAt: new Date().toISOString(),
    },
  ]);
  assert.ok(followUp?.tool === "generateReportPdf" || followUp?.tool === "generateScopedBusinessPdf");

  console.log(
    `prove:ea-real: OK (${OPEN_QUESTIONS.length} open questions defer to model + getOrgContext + compositor primitives)\n`,
  );
}

runEaRealSuite().catch((error) => {
  console.error(error);
  process.exit(1);
});
