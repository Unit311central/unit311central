/**
 * Central semantic EA architecture — acceptance tests.
 * Run: npm run prove:ea-semantic
 */
import assert from "node:assert/strict";

import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { TALANTON_IMPACT_SLUG } from "@/lib/talanton-surface";
import { ensureCentralApplicationModel } from "@/lib/central-application-model/registry";
import { planEvidenceGathering } from "@/lib/central-application-model/evidence-planner";
import {
  getWorkspaceEnablement,
  isModuleEnabledInWorkspace,
  resetWorkspaceEnablementCacheForTests,
} from "@/lib/central-application-model/workspace-enablement";
import { resetCentralApplicationModelForTests } from "@/lib/central-application-model/registry";
import { resolveSemanticCapability } from "@/lib/central-application-model/resolver";
import { resetReadCapabilitiesForTests } from "@/lib/ai-operating-assistant/capabilities/read-registry";
import { getAssistantAction } from "@/lib/ai-operating-assistant/actions/registry";
import { registerAllActionModules } from "@/lib/ai-operating-assistant/actions/register-all-modules";
import { resolveReadCapability } from "@/lib/ai-operating-assistant/capabilities/read-registry";

function businessFor(slug: string, overrides?: Partial<AssistantBusinessContext["permissions"]>): AssistantBusinessContext {
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
      ...overrides,
    },
    generatedAt: new Date().toISOString(),
  };
}

async function main() {
  resetCentralApplicationModelForTests();
  resetReadCapabilitiesForTests();
  resetWorkspaceEnablementCacheForTests();
  ensureCentralApplicationModel();
  registerAllActionModules();

  const demo = businessFor(DEMO_WORKSPACE_SLUG);
  const talanton = businessFor(TALANTON_IMPACT_SLUG);

  // A. Bank balance — deterministic capability match
  const bankCap = resolveReadCapability("what is our bank balance", demo);
  assert.ok(bankCap && !("denied" in bankCap));
  assert.equal(bankCap.capability.id, "financials.cashPosition.read");
  assert.equal(bankCap.capability.tool, "getCashPosition");

  // B/C. Headcount + typo
  const typo = resolveSemanticCapability("how many emploassd do we have?", demo);
  assert.ok(typo && !("denied" in typo));
  assert.equal(typo.binding.id, "hr.employees.count.read");

  // D. Cross-workspace denied
  const cross = resolveSemanticCapability("Show me Talanton portfolio companies", demo);
  assert.ok(cross && "denied" in cross);

  // E. Funds disabled in Demo
  assert.equal(isModuleEnabledInWorkspace("funds", DEMO_WORKSPACE_SLUG), false);
  const fundsAsk = resolveSemanticCapability("What is our fund performance and capital deployed?", demo);
  assert.ok(fundsAsk && "denied" in fundsAsk && fundsAsk.reason === "module_disabled");

  // F. Portfolio enabled in Talanton
  assert.equal(isModuleEnabledInWorkspace("portfolio-companies", TALANTON_IMPACT_SLUG), true);
  const portfolio = resolveSemanticCapability(
    "Which portfolio companies need attention?",
    talanton,
  );
  assert.ok(portfolio && !("denied" in portfolio));

  // G. Cross-module composite match
  const crossMatch = resolveSemanticCapability(
    "Which customers have overdue invoices and open support tickets?",
    demo,
  );
  assert.ok(crossMatch && !("denied" in crossMatch));
  assert.equal(crossMatch.binding.id, "cross.clients.overdueInvoicesOpenTickets.read");

  // H. Strategic → evidence plan
  const strategic = planEvidenceGathering("What happens if our biggest client leaves?", demo);
  assert.ok(strategic);
  assert.ok(strategic.tools.length > 0);

  // I. Employee growth chart capability
  const growth = resolveSemanticCapability("Show employee growth", demo);
  assert.ok(growth && !("denied" in growth));
  assert.equal(growth.binding.id, "hr.employees.growth.read");
  assert.equal(growth.binding.supportsVisualisation, true);

  // K. Create invoice action registered
  const invoiceAction = getAssistantAction("finance.createInvoice");
  assert.ok(invoiceAction, "finance.createInvoice must be registered");

  // L. Content Studio capability
  const content = resolveSemanticCapability(
    "Create a weekly management deck using our approved template",
    demo,
  );
  assert.ok(content && !("denied" in content));
  assert.equal(content.binding.id, "content.deck.create");

  // M. Generic workspace enablement
  const newWs = getWorkspaceEnablement("newcustomer");
  assert.ok(newWs.enabledModuleIds.size > 5, "generic workspace should enable core modules");

  // Workspace enablement differs Talanton vs Demo
  const demoModules = getWorkspaceEnablement(DEMO_WORKSPACE_SLUG);
  const talModules = getWorkspaceEnablement(TALANTON_IMPACT_SLUG);
  assert.ok(demoModules.enabledModuleIds.has("fundraising"));
  assert.ok(!talModules.enabledModuleIds.has("fundraising"));
  assert.ok(talModules.enabledModuleIds.has("funds"));

  console.log("semantic-architecture.check.ts: all passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
