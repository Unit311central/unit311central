/**
 * Full Talanton EA suite (not just intents).
 * Run: npm run prove:talanton-ea
 */
import { runTalantonEaTestSuite } from "@/lib/talanton/ea-test-suite";

async function main() {
  const report = await runTalantonEaTestSuite();
  for (const section of report.sections) {
    console.log(`\n=== ${section.title} ===`);
    for (const testCase of section.cases) {
      const mark = testCase.status === "pass" ? "ok " : "FAIL";
      console.log(`${mark}  ${testCase.label}${testCase.detail ? ` (${testCase.detail})` : ""}`);
      if (testCase.error) console.error(`     ${testCase.error}`);
    }
  }
  console.log(
    `\n${report.ok ? "All" : "Some"} Talanton EA checks ${report.ok ? "passed" : "failed"} (${report.passed}/${report.total}, ${report.durationMs}ms, ${report.version}).\n`,
  );
  if (!report.ok) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
