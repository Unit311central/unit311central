import assert from "node:assert/strict";

import { isIntelligenceOperationsView } from "@/lib/intelligence/views";
import { CENTRAL_INTELLIGENCE_TOOL_DEFINITIONS } from "@/lib/intelligence/ea-tools";
import { bootstrapIntelligenceWorkspacePacks } from "@/lib/intelligence/workspace-packs";

bootstrapIntelligenceWorkspacePacks();

assert.equal(isIntelligenceOperationsView("oa-competitor-intelligence"), true);
assert.equal(isIntelligenceOperationsView("demo-intelligence"), true);
assert.equal(isIntelligenceOperationsView("demo-market-radar"), true);
assert.equal(isIntelligenceOperationsView("financials"), false);
assert.equal(CENTRAL_INTELLIGENCE_TOOL_DEFINITIONS.length, 3);

console.log("intelligence/deploy-ready.check.ts: all assertions passed");
