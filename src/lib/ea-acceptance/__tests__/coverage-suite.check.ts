/**
 * Run: npm run prove:ea-coverage
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { countNorthstarEaTestQuestions } from "@/lib/demo/ea-module-test-bank";
import {
  buildEaCoverageMatrix,
  formatCoverageReportMarkdown,
} from "@/lib/ea-acceptance/coverage-matrix";
import { runEaAcceptanceSuite } from "@/lib/ea-acceptance/run-suite";
import { formatTriageMarkdown, triageAcceptanceResults } from "@/lib/ea-acceptance/triage";

async function main() {
  const demoBankCount = countNorthstarEaTestQuestions();
  const coverage = buildEaCoverageMatrix({ demoBankQuestionCount: demoBankCount });
  const live = process.env.EA_ACCEPTANCE_LIVE === "1";
  const acceptance = await runEaAcceptanceSuite({ executeTools: live });

  const triageReports = acceptance.workspaces.map((ws) => ({
    slug: ws.slug,
    triage: triageAcceptanceResults(ws.slug, ws.cases),
  }));

  const coverageMd = formatCoverageReportMarkdown(coverage);
  const triageMd = formatTriageMarkdown(triageReports);

  console.log(coverageMd);
  console.log("\n---\n");
  console.log(triageMd);

  const outDir = join(process.cwd(), "docs", "ea");
  writeFileSync(join(outDir, "EA_ACCEPTANCE_COVERAGE_REPORT.md"), coverageMd, "utf8");
  writeFileSync(join(outDir, "EA_ACCEPTANCE_TRIAGE_REPORT.md"), triageMd, "utf8");

  console.log(
    `\nAcceptance: ${acceptance.passed}/${acceptance.total} passed (${acceptance.durationMs}ms, live=${live}).`,
  );
  console.log(
    `Coverage: ${coverage.totals.covered} nav functions with semantic caps, ${coverage.totals.uncovered} without.`,
  );
  console.log(`Reports written to docs/ea/EA_ACCEPTANCE_COVERAGE_REPORT.md and EA_ACCEPTANCE_TRIAGE_REPORT.md`);

  if (!acceptance.ok) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
