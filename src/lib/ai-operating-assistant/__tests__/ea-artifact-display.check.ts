/**
 * EA artifact display names — smoke tests.
 * Run: node --import tsx src/lib/ai-operating-assistant/__tests__/ea-artifact-display.check.ts
 */
import assert from "node:assert/strict";

import {
  abhiFinancialDeltaArtifactLabels,
  abhiRegulatoryImpactArtifactLabels,
  boardPackPdfArtifactLabels,
  eaPdfFilename,
  platformAccessArtifactLabels,
  projectHealthArtifactLabels,
} from "@/lib/ai-operating-assistant/ea-artifact-display";

assert.equal(
  eaPdfFilename("ABHI Board Deck — 14 August 2026"),
  "ABHI Board Deck — 14 August 2026.pdf",
);

const board = boardPackPdfArtifactLabels({
  workspaceSlug: "abhi",
  meetingDate: "2026-08-14",
});
assert.match(board.filename, /^ABHI Board Deck — 14 August 2026\.pdf$/);

const regulatory = abhiRegulatoryImpactArtifactLabels({ region: "UK", months: 6 });
assert.equal(
  regulatory.filename,
  "ABHI Regulatory Impact Report — UK Members — Past 6 Months.pdf",
);

const financial = abhiFinancialDeltaArtifactLabels({
  currentQuarterLabel: "Q2 2026",
  priorQuarterLabel: "Q1 2026",
});
assert.equal(
  financial.filename,
  "ABHI Financial Delta Report — Q2 2026 vs Q1 2026.pdf",
);

assert.equal(
  projectHealthArtifactLabels("abhi").filename,
  "ABHI Project Health Report — Active Projects.pdf",
);

assert.equal(
  platformAccessArtifactLabels("abhi").filename,
  "ABHI Platform Users & Access Report.pdf",
);

console.log("EA artifact display checks passed.");
