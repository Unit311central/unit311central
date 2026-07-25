/**
 * End-to-end answer-path smoke for 6 personas.
 * Run: node --import tsx src/lib/ai-operating-assistant/__tests__/persona-answer-smoke.check.ts
 */
import assert from "node:assert/strict";
import { resolveDirectIntent } from "../intent-router";
import { resolveExecutivePersona, getRoleFocusProfile } from "../role-awareness";
import {
  searchLeave,
  searchPerformanceReviews,
  searchInventory,
} from "../platform-tools";
import type { AssistantBusinessContext } from "../types";
import type { AssistantToolExecutionContext } from "../tool-result";

const business: AssistantBusinessContext = {
  user: { id: "u-test", username: "tester", displayName: "Test CFO", userType: "internal" },
  organisation: { id: null, name: "Unit311" },
  workspace: { id: null, name: "Unit311 Central", slug: "unit311" },
  page: { activeView: "executive-assistant", label: "EA", pathname: null },
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
    roles: ["Exec"],
    departments: ["Finance"],
    allowedViews: null,
  },
  generatedAt: new Date().toISOString(),
};

const ctx: AssistantToolExecutionContext = { business };

const PERSONA_MAP: Array<{
  label: string;
  roleView: string;
  displayName: string;
  departments: string[];
  expect: string;
}> = [
  { label: "CEO", roleView: "c-suite", displayName: "Alex CEO", departments: ["Exec"], expect: "ceo" },
  { label: "CFO", roleView: "c-suite", displayName: "Sam", departments: ["Finance"], expect: "cfo" },
  { label: "COO", roleView: "manager", displayName: "Pat", departments: ["Operations"], expect: "coo" },
  { label: "Sales", roleView: "manager", displayName: "Lee", departments: ["Sales"], expect: "sales" },
  { label: "Engineering", roleView: "manager", displayName: "Kim", departments: ["Engineering"], expect: "engineering" },
  { label: "CTO", roleView: "c-suite", displayName: "Jordan CTO", departments: ["Technology"], expect: "cto" },
];

const QUESTIONS: Array<{ q: string; tool: string }> = [
  { q: "Summarise the business", tool: "queryBusiness" },
  { q: "Which invoices are overdue?", tool: "searchInvoices" },
  { q: "Show hot leads", tool: "searchCRM" },
  { q: "Which projects are at risk?", tool: "getSmartInsights" },
  { q: "How much cash do we have?", tool: "getCashPosition" },
  { q: "What is platform health?", tool: "getBusinessHealth" },
  { q: "Who is on leave today?", tool: "searchLeave" },
];

async function main() {
  console.log("\n=== Persona mapping ===");
  for (const row of PERSONA_MAP) {
    const persona = resolveExecutivePersona(row.roleView, row.displayName, row.departments);
    assert.equal(persona, row.expect, `${row.label} → ${persona}`);
    const focus = getRoleFocusProfile(persona);
    console.log(`ok  ${row.label.padEnd(12)} → ${persona.padEnd(12)} (${focus.label})`);
  }

  console.log("\n=== NL → live tool routing ===");
  for (const row of QUESTIONS) {
    const intent = resolveDirectIntent(row.q, []);
    assert.ok(intent, `no intent for: ${row.q}`);
    assert.equal(intent!.tool, row.tool, `${row.q} → ${intent!.tool}`);
    console.log(`ok  ${intent!.tool.padEnd(24)} ← ${row.q}`);
  }

  console.log("\n=== Mock refusals (must NOT invent data) ===");
  const leave = await searchLeave({}, ctx);
  assert.equal(leave.status, "error");
  assert.match(String(leave.error), /live business data/i);
  console.log("ok  searchLeave refuses mock");

  const reviews = await searchPerformanceReviews({}, ctx);
  assert.equal(reviews.status, "error");
  assert.match(String(reviews.error), /live business data/i);
  console.log("ok  searchPerformanceReviews refuses mock");

  const inventory = await searchInventory({}, ctx);
  assert.equal(inventory.status, "error");
  assert.match(String(inventory.error), /live business data/i);
  console.log("ok  searchInventory refuses mock");

  console.log("\nPASS — 6 personas map, questions route, mocks blocked.\n");
}

main().catch((error) => {
  console.error("\nFAIL", error);
  process.exit(1);
});
