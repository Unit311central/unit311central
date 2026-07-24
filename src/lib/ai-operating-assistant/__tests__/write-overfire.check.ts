/**
 * Regression: CEO read questions must NOT become write Approve plans.
 * Run: node --import tsx src/lib/ai-operating-assistant/__tests__/write-overfire.check.ts
 */
import assert from "node:assert/strict";
import { classifyKnowledgeDomain } from "../knowledge-domains";
import {
  extractBusinessEntity,
  hasExplicitWriteIntent,
  isInterrogativeRead,
  resolveBusinessActionIntent,
} from "../intent-action-resolver";
import { registerAllActionModules } from "../actions/register-all-modules";
import type { AssistantBusinessContext } from "../types";

registerAllActionModules();

const business: AssistantBusinessContext = {
  user: { id: "verify-user", username: "verify", displayName: "Verify", userType: "internal" },
  organisation: { id: null, name: null },
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
  },
  generatedAt: new Date().toISOString(),
};

const READS = [
  "How healthy is our client portfolio?",
  "Any clients going quiet on us?",
  "Give me a one-line status on clients.",
  "Which new clients joined this month?",
  "Which clients are marked inactive?",
  "Who owns the relationship for each major client?",
  "What discovery meetings do I have this week?",
  "Which clients are mid-onboarding?",
  "What does onboarding cover in Unit311?",
  "What's blocking onboarding for Coastal LiDAR?",
  "Surface anything blocking survey delivery this week.",
  "Summarise the business.",
  "What requires my attention today?",
];

const WRITES = [
  "We've signed Acme Engineering Ltd.",
  "Create a client called Northwind Aerial",
  "Create a project for them called Site Survey",
  "Archive the test client",
  "Add a contact called Sam Lee to Acme",
  "Update the primary contact for Venturi",
];

async function main() {
  for (const prompt of READS) {
    assert.equal(
      hasExplicitWriteIntent(prompt),
      false,
      `write intent should be false: ${prompt}`,
    );
    assert.equal(
      isInterrogativeRead(prompt),
      true,
      `should be interrogative read: ${prompt}`,
    );
    const domain = classifyKnowledgeDomain(prompt).domain;
    assert.notEqual(domain, "write", `domain must not be write: ${prompt} → ${domain}`);
    const entity = extractBusinessEntity(prompt);
    if (entity) {
      assert.ok(
        !/^(How|What|Which|Who|Any|Give|Surface)$/i.test(entity),
        `bad entity "${entity}" from: ${prompt}`,
      );
    }
    const intent = await resolveBusinessActionIntent(prompt, business, []);
    assert.equal(
      intent.kind,
      "none",
      `must not propose write for: ${prompt} → ${JSON.stringify(intent)}`,
    );
  }

  for (const prompt of WRITES) {
    assert.equal(
      hasExplicitWriteIntent(prompt),
      true,
      `write intent should be true: ${prompt}`,
    );
  }

  // Signed client still extracts a real company name.
  assert.equal(extractBusinessEntity("We've signed Acme Engineering Ltd."), "Acme Engineering Ltd");
  assert.equal(
    extractBusinessEntity("Create a client called Northwind Aerial"),
    "Northwind Aerial",
  );

  // Question words never become entities.
  assert.equal(extractBusinessEntity("How healthy is our client portfolio?"), null);
  assert.equal(extractBusinessEntity("Any clients going quiet on us?"), null);
  assert.equal(extractBusinessEntity("What discovery meetings do I have this week?"), null);

  console.log(
    JSON.stringify(
      {
        ok: true,
        readsChecked: READS.length,
        writesChecked: WRITES.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
