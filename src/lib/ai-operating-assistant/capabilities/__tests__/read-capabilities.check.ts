/**
 * Central read capability registry — deterministic routing tests (no server-only chain).
 * Run: node --import tsx src/lib/ai-operating-assistant/capabilities/__tests__/read-capabilities.check.ts
 */
import assert from "node:assert/strict";

import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { ONWARDAIR_SLUG } from "@/lib/onwardair-surface";
import { ABHI_SLUG } from "@/lib/abhi-surface";
import { TALANTON_IMPACT_SLUG } from "@/lib/talanton-surface";

import { normalizeEaMessage } from "../message-normalize";
import { resolveReadCapability, resetReadCapabilitiesForTests } from "../read-registry";
import { resetEaExecutionTelemetryForTests } from "../execution-telemetry";

function businessFor(slug: string): AssistantBusinessContext {
  return {
    user: { id: "u1", username: "ceo", displayName: "CEO", userType: "internal" },
    organisation: { id: "org", name: "Test Org" },
    workspace: { id: "ws", name: slug, slug },
    page: { activeView: "executive-assistant", label: "EA" },
    selection: {},
    permissions: {
      roleView: "c-suite",
      canAccessFinancials: true,
      canAccessUsers: true,
      canAccessStrategy: true,
      canAccessHr: true,
      allowedViews: null,
      readOnlyMode: false,
    },
    generatedAt: new Date().toISOString(),
  };
}

function assertBankBalance(slug: string) {
  const business = businessFor(slug);
  const prompts = [
    "what is our bank balance",
    "how much cash do we have",
    "give me the bank balence",
    "what's in the bank",
  ];
  for (const prompt of prompts) {
    const cap = resolveReadCapability(prompt, business);
    assert.ok(cap && !("denied" in cap), `${slug}: ${prompt}`);
    assert.equal(cap.capability.id, "financials.cashPosition.read");
    assert.equal(cap.capability.tool, "getCashPosition");
    assert.equal(cap.capability.deterministic, true);
    assert.equal(cap.capability.skipSynthesis, true);
  }
}

function main() {
  resetReadCapabilitiesForTests();
  resetEaExecutionTelemetryForTests();

  assert.equal(
    normalizeEaMessage("give me every emploassd at Bristol"),
    "give me every employees at bristol",
  );

  const cross = resolveReadCapability(
    "Show me Talanton's customers",
    businessFor(DEMO_WORKSPACE_SLUG),
  );
  assert.ok(cross && "denied" in cross && cross.reason === "cross_workspace");

  assertBankBalance(DEMO_WORKSPACE_SLUG);
  assertBankBalance(ONWARDAIR_SLUG);
  assertBankBalance(ABHI_SLUG);
  assertBankBalance(TALANTON_IMPACT_SLUG);

  const headcount = resolveReadCapability("How many employees do we have?", businessFor(DEMO_WORKSPACE_SLUG));
  assert.ok(headcount && !("denied" in headcount));
  assert.equal(headcount.capability.id, "hr.employees.count.read");

  const denied = resolveReadCapability("what is our bank balance", {
    ...businessFor(DEMO_WORKSPACE_SLUG),
    permissions: {
      ...businessFor(DEMO_WORKSPACE_SLUG).permissions,
      canAccessFinancials: false,
    },
  });
  assert.ok(denied && "denied" in denied && denied.reason === "permission");

  console.log("read-capabilities.check.ts: all passed");
}

main();
