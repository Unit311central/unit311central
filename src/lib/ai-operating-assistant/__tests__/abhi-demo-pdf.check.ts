/**
 * ABHI EA demo PDF asks B–E — routing and artifact smoke tests.
 * Run: node --import tsx src/lib/ai-operating-assistant/__tests__/abhi-demo-pdf.check.ts
 */
import assert from "node:assert/strict";

import {
  ABHI_EA_DEMO_PDF_PROMPTS,
  resolveAbhiEaPdfIntent,
} from "@/lib/abhi/ea-pdf-intents";
import {
  generateAbhiPlatformAccessPdfTool,
  generateAbhiProjectHealthPdfTool,
  generateAbhiQuarterlyFinancialDeltaPdfTool,
  generateAbhiRegulatoryImpactPdfTool,
} from "@/lib/abhi/ea-pdf-tools";
import { resolveAbhiBoardPackIntent } from "@/lib/abhi/board-pack-intent";
import { resolveOrchestrationRoute } from "@/lib/ai-operating-assistant/action-orchestration";
import { buildAbhiRegulatoryPeriodReportData } from "@/lib/abhi/regulatory-intelligence";
import { buildAbhiRegulatoryPeriodImpactPdf } from "@/lib/abhi/regulatory-brief-pdf";
import {
  assessProjectHealth,
  buildProjectHealthRows,
} from "@/lib/ai-operating-assistant/project-health-pdf-service";
import {
  getLastCompletedCalendarQuarter,
  getPriorQuarter,
  parseReportPeriod,
} from "@/lib/ai-operating-assistant/report-period";
import {
  loadQuarterlyDeltaBundle,
  renderQuarterlyDeltaPdf,
} from "@/lib/ai-operating-assistant/quarterly-delta-pdf-service";
import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import type { InternalProject } from "@/lib/projects-data";

function abhiBusiness(overrides?: Partial<AssistantBusinessContext["permissions"]>): AssistantBusinessContext {
  return {
    user: {
      id: "u-test",
      username: "demo@abhi.org.uk",
      displayName: "ABHI Demo",
      userType: "operator",
    },
    organisation: { id: "org-abhi", name: "ABHI" },
    workspace: { id: "ws-abhi", name: "ABHI", slug: "abhi" },
    page: { activeView: "executive-assistant", label: "Executive Assistant" },
    selection: {},
    permissions: {
      roleView: "executive",
      canAccessFinancials: true,
      canAccessUsers: true,
      canAccessStrategy: true,
      canAccessHr: true,
      ...overrides,
    },
    generatedAt: new Date().toISOString(),
  };
}

const sampleProject: InternalProject = {
  id: "p1",
  name: "WHX Pavilion Delivery",
  clientId: "c1",
  clientName: "ABHI Events",
  site: null,
  region: "UK",
  operator: "Ops",
  phase: "live",
  startDate: "2026-01-01",
  endDate: "2026-09-01",
  progressPct: 35,
  notes: "Risk: supplier lead times",
  createdAt: "2026-01-01",
  updatedAt: "2026-08-01",
};

async function main() {
  for (const [key, prompt] of Object.entries(ABHI_EA_DEMO_PDF_PROMPTS)) {
    const intent = resolveAbhiEaPdfIntent(prompt);
    assert.ok(intent, `missing intent for ${key}`);
    const route = await resolveOrchestrationRoute(prompt, [], abhiBusiness());
    assert.equal(route.kind, "tool", `orchestration not tool for ${key}`);
    if (route.kind === "tool") {
      assert.equal(route.intent.tool, intent.tool, `tool mismatch for ${key}`);
    }
  }

  assert.equal(
    resolveAbhiBoardPackIntent("Create me a board deck for tomorrow in a PDF.")?.tool,
    "boardpack.generate",
    "board deck ask must still route to boardpack.generate",
  );

  const period = parseReportPeriod(ABHI_EA_DEMO_PDF_PROMPTS.financialDelta);
  assert.equal(period.kind, "quarter");
  const lastQ = getLastCompletedCalendarQuarter();
  const priorQ = getPriorQuarter(lastQ);
  assert.notDeepEqual(lastQ, priorQ);

  const reportData = buildAbhiRegulatoryPeriodReportData([], { months: 6, region: "UK" });
  const regulatoryPdf = buildAbhiRegulatoryPeriodImpactPdf(reportData);
  assert.equal(Buffer.from(regulatoryPdf).slice(0, 4).toString(), "%PDF");

  const health = assessProjectHealth(sampleProject);
  assert.equal(health.band, "Red");
  assert.ok(buildProjectHealthRows([sampleProject]).length === 1);

  const deltaBundle = await loadQuarterlyDeltaBundle({ canAccessFinancials: true });
  const deltaPdf = await renderQuarterlyDeltaPdf({
    bundle: deltaBundle,
    userId: "u-test",
    organisationName: "ABHI",
    workspaceSlug: "abhi",
    requestPreview: ABHI_EA_DEMO_PDF_PROMPTS.financialDelta,
  });
  assert.equal(deltaPdf.bytes.slice(0, 4).toString(), "%PDF");
  assert.ok(deltaBundle.rows.length >= 3);

  const ctx = { business: abhiBusiness() };
  const regulatoryResult = await generateAbhiRegulatoryImpactPdfTool(
    { question: ABHI_EA_DEMO_PDF_PROMPTS.regulatory, months: 6, region: "UK" },
    ctx,
  );
  assert.equal((regulatoryResult as { status?: string }).status, "ok");

  const financialResult = await generateAbhiQuarterlyFinancialDeltaPdfTool(
    { question: ABHI_EA_DEMO_PDF_PROMPTS.financialDelta },
    ctx,
  );
  assert.equal((financialResult as { status?: string }).status, "ok");

  const projectResult = await generateAbhiProjectHealthPdfTool(
    { question: ABHI_EA_DEMO_PDF_PROMPTS.projectHealth },
    ctx,
  );
  assert.equal((projectResult as { status?: string }).status, "ok");

  const accessResult = await generateAbhiPlatformAccessPdfTool(
    { question: ABHI_EA_DEMO_PDF_PROMPTS.platformAccess },
    ctx,
  );
  assert.ok(
    (accessResult as { status?: string }).status === "ok" ||
      (accessResult as { status?: string }).status === "error",
    "platform access may fail without Supabase but must not throw",
  );

  const forbiddenFinancial = await generateAbhiQuarterlyFinancialDeltaPdfTool(
    { question: ABHI_EA_DEMO_PDF_PROMPTS.financialDelta },
    { business: abhiBusiness({ canAccessFinancials: false }) },
  );
  assert.equal((forbiddenFinancial as { status?: string }).status, "error");

  console.log("All ABHI demo PDF checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
