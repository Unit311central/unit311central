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
    "Which modules are enabled for us?",
    "Which modules are ready to go live?",
    "Which modules still need owner sign-off?",
    "Where are SOPs stored for flight ops?",
    "Which careers listings are live?",
    "Which tools still need API credentials?",
    "Give me a security brief on external access.",
    "Preview how the nav wordmark looks today.",
    "Which environments are production-critical?",
    "Are MFA and identity policies complete?",
    "Is vendor sync enabled?",
  ]) {
    assert.equal(
      answerPlatformQuestion(prompt),
      null,
      `platform must not answer: ${prompt}`,
    );
    const domain = classifyKnowledgeDomain(prompt).domain;
    assert.ok(
      domain === "business" || domain === "unknown",
      `expected business/unknown for: ${prompt} → ${domain}`,
    );
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

  // CRM stage moves are registered — instant execute or ask for missing fields.
  const crmStage = await resolveOrchestrationRoute(
    "Move the Riverside corridor deal to Hot.",
    [],
    business,
  );
  assert.ok(
    crmStage.kind === "need_info" ||
      crmStage.kind === "capability_answer" ||
      crmStage.kind === "tool",
    `expected CRM write route, got ${crmStage.kind}`,
  );
  if (crmStage.kind === "capability_answer") {
    assert.ok(
      !/approve/i.test(crmStage.message),
      `CRM reply must not ask to approve: ${crmStage.message.slice(0, 160)}`,
    );
  }

  // Unsupported treasury wires must be honest, not mapped onto CRM/client writes.
  const unsupported = await resolveOrchestrationRoute(
    "Wire £50,000 from our main account to a supplier in Dubai tonight.",
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
