/**
 * Remaining failure-bucket regressions (platform leak, capability Q, unsupported write).
 * Run: node --import tsx src/lib/ai-operating-assistant/__tests__/remaining-fail-buckets.check.ts
 */
import assert from "node:assert/strict";
import { classifyKnowledgeDomain } from "../knowledge-domains";
import { answerPlatformQuestion } from "../application-catalogue";
import { answerCapabilityQuestion } from "../actions/capability-service";
import { resolveOrchestrationRoute } from "../action-orchestration";
import { registerAllActionModules } from "../actions/register-all-modules";
import type { AssistantBusinessContext } from "../types";

registerAllActionModules();

const business: AssistantBusinessContext = {
  user: { id: "u", username: "u", displayName: "U", userType: "internal" },
  organisation: { id: null, name: null },
  workspace: { id: null, name: "W", slug: "w" },
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

async function main() {
  // Platform catalogue must not steal live-data list/show questions.
  for (const prompt of [
    "List our office locations.",
    "Show our corporate bank accounts.",
    "Show the current cap table.",
    "Explain our current share classes.",
  ]) {
    assert.equal(
      answerPlatformQuestion(prompt),
      null,
      `platform must not answer: ${prompt}`,
    );
    const domain = classifyKnowledgeDomain(prompt).domain;
    assert.equal(domain, "business", `expected business domain for: ${prompt} → ${domain}`);
    const route = await resolveOrchestrationRoute(prompt, [], business);
    assert.equal(route.kind, "tool", `expected tool route for: ${prompt} → ${route.kind}`);
    if (route.kind === "tool") {
      assert.equal(route.intent.tool, "queryBusiness", prompt);
    }
  }

  // Capability questions should return catalogue content.
  for (const prompt of [
    "What can you do from the home screen?",
    "What can you help me with as Executive Assistant?",
    "What can you do with employee records?",
  ]) {
    const answered = answerCapabilityQuestion(prompt, { business });
    assert.ok(answered, `capability answer missing for: ${prompt}`);
    assert.match(
      answered.answer,
      /Action Registry|registered capability|I can |Registered business objects/i,
      prompt,
    );
  }

  // Unsupported writes must be honest, not silent/platform.
  const unsupported = await resolveOrchestrationRoute(
    "Move the Riverside corridor deal to negotiation.",
    [],
    business,
  );
  assert.equal(unsupported.kind, "capability_answer", unsupported.kind);
  if (unsupported.kind === "capability_answer") {
    assert.match(
      unsupported.message,
      /don't have a registered write action/i,
      unsupported.message.slice(0, 200),
    );
  }

  console.log(JSON.stringify({ ok: true }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
