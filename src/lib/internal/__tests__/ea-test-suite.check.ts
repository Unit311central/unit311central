/**
 * Run: npm run prove:internal-ea
 */
import { runInternalEaTestSuite } from "@/lib/internal/ea-test-suite";

async function main() {
  const report = await runInternalEaTestSuite();
  for (const section of report.sections) {
    console.log(`\n=== ${section.title} ===`);
    for (const testCase of section.cases) {
      const mark = testCase.status === "pass" ? "ok " : "FAIL";
      console.log(`${mark}  ${testCase.label}${testCase.detail ? ` (${testCase.detail})` : ""}`);
      if (testCase.error) console.error(`     ${testCase.error}`);
    }
  }
  console.log(
    `\n${report.ok ? "All" : "Some"} Internal EA checks ${report.ok ? "passed" : "failed"} (${report.passed}/${report.total}, ${report.durationMs}ms, ${report.version}).\n`,
  );
  if (!report.ok) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
