/**
 * Golden NL questions for CEO / CFO / COO / Sales / Engineering / CTO.
 * Ensures each routes to a live tool (or an honest live-gap refusal) — never silent none.
 *
 * Run: node --import tsx src/lib/ai-operating-assistant/__tests__/persona-real-answers.check.ts
 */
import assert from "node:assert/strict";
import { isEaGeneralIntentMode } from "../ea-general-mode";
import { resolveDirectIntent } from "../intent-router";
import { resolveExecutivePersona, getRoleFocusProfile } from "../role-awareness";

type Case = {
  persona: string;
  question: string;
  expectTool: string | string[];
  expectReasonIncludes?: string;
};

const CASES: Case[] = [
  // CEO
  { persona: "ceo", question: "Summarise the business", expectTool: "queryBusiness" },
  { persona: "ceo", question: "What needs my decision today?", expectTool: "queryBusiness" },
  { persona: "ceo", question: "What are the biggest risks?", expectTool: "getSmartInsights" },
  { persona: "ceo", question: "How much cash do we have?", expectTool: "getCashPosition" },
  { persona: "ceo", question: "Show the sales pipeline", expectTool: "searchCRM" },
  // CFO
  { persona: "cfo", question: "Which invoices are overdue?", expectTool: "searchInvoices" },
  { persona: "cfo", question: "Who owes us the most?", expectTool: "searchInvoices" },
  { persona: "cfo", question: "What is our cash position?", expectTool: "getCashPosition" },
  { persona: "cfo", question: "Show recent expenses", expectTool: "searchExpenses" },
  { persona: "cfo", question: "What is our monthly burn?", expectTool: "queryBusiness" },
  // COO
  { persona: "coo", question: "Which projects are at risk?", expectTool: "getSmartInsights" },
  { persona: "coo", question: "Which projects are behind schedule?", expectTool: "getSmartInsights" },
  { persona: "coo", question: "What is our delivery status?", expectTool: "searchProjects" },
  { persona: "coo", question: "Summarise operating status", expectTool: "queryBusiness" },
  // Sales
  { persona: "sales", question: "Show hot leads", expectTool: "searchCRM" },
  { persona: "sales", question: "What is in the sales pipeline?", expectTool: "searchCRM" },
  { persona: "sales", question: "Who should I call today?", expectTool: "searchCRM" },
  { persona: "sales", question: "Biggest opportunities", expectTool: "searchCRM" },
  // Engineering
  { persona: "engineering", question: "Which projects are slipping?", expectTool: ["getSmartInsights", "searchProjects"] },
  { persona: "engineering", question: "Show live projects", expectTool: "searchProjects" },
  { persona: "engineering", question: "What are the delivery blockers?", expectTool: "searchProjects" },
  // CTO
  { persona: "cto", question: "What is platform health?", expectTool: "getBusinessHealth" },
  { persona: "cto", question: "What are the technical blockers?", expectTool: "getBusinessHealth" },
  { persona: "cto", question: "Which projects are at risk?", expectTool: "getSmartInsights" },
  // Honest gaps (must still route — tool refuses mock)
  { persona: "coo", question: "Who is on leave today?", expectTool: "searchLeave" },
  { persona: "ceo", question: "Show performance reviews", expectTool: "searchPerformanceReviews" },
];

function main() {
  // Persona mapping smoke
  assert.equal(resolveExecutivePersona("c-suite", "Alex CEO", ["Exec"]), "ceo");
  assert.equal(resolveExecutivePersona("c-suite", "Sam", ["Finance"]), "cfo");
  assert.equal(resolveExecutivePersona("manager", "Pat", ["Operations"]), "coo");
  assert.equal(resolveExecutivePersona("manager", "Lee", ["Sales"]), "sales");
  assert.equal(resolveExecutivePersona("manager", "Kim", ["Engineering"]), "engineering");
  assert.equal(resolveExecutivePersona("c-suite", "Jordan CTO", ["Technology"]), "cto");
  assert.ok(getRoleFocusProfile("cfo").label.includes("CFO"));
  assert.ok(getRoleFocusProfile("sales").answerDomains.includes("sales_opportunities"));

  let failed = 0;
  if (isEaGeneralIntentMode()) {
    console.log(
      `skipped ${CASES.length} legacy routing cases (real EA mode — use prove:ea-real)`,
    );
  } else {
  for (const testCase of CASES) {
    const intent = resolveDirectIntent(testCase.question, []);
    const expected = Array.isArray(testCase.expectTool)
      ? testCase.expectTool
      : [testCase.expectTool];
    if (!intent || !expected.includes(intent.tool)) {
      failed += 1;
      console.error(
        `FAIL [${testCase.persona}] "${testCase.question}" → ${intent?.tool ?? "null"} (expected ${expected.join("|")})`,
      );
    } else {
      console.log(`ok  [${testCase.persona}] ${intent.tool} ← ${testCase.question}`);
    }
  }

  if (!isEaGeneralIntentMode() && failed > 0) {
    console.error(`\n${failed} golden question(s) failed routing.`);
    process.exit(1);
  }
  if (!isEaGeneralIntentMode()) {
  console.log(`\nAll ${CASES.length} golden questions route to live tools.`);
  }
}

main();
