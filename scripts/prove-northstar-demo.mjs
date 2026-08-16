/**
 * Northstar Demo prove suite — static + fixture checks (no browser).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

// Host + workspace
const appDomains = read("src/lib/app-domains.ts");
assert.match(appDomains, /DEMO_SITE_HOST/);
assert.match(appDomains, /DEMO_WORKSPACE_SLUG\s*=\s*"demo"/);

// No CorpCentre in demo paths
const demoNav = read("src/lib/demo/nav.ts");
assert.doesNotMatch(demoNav, /corpcentre/i);
assert.match(demoNav, /fundraising-dashboard/);
assert.match(demoNav, /board-dashboard/);

// Northstar seed constants
const company = read("scripts/demo-enterprise/company.mjs");
assert.match(company, /Northstar Industrial Technologies/);
assert.doesNotMatch(company, /Meridian Atlas/);
assert.doesNotMatch(company, /CorpCentre/i);

// Fixtures
const fixtures = JSON.parse(read("src/lib/demo-enterprise/fixtures.generated.json"));
assert.match(String(fixtures.company?.legalName ?? ""), /Northstar/);
assert.ok(fixtures.narrative?.arrGbp >= 4_000_000);
assert.ok((fixtures.summary?.employees ?? 0) >= 20);

// Routes + components
assert.match(read("src/middleware.ts"), /\/board/);
assert.match(read("src/middleware.ts"), /\/demo-client-portal/);
assert.match(read("src/app/portals/page.tsx"), /demo/);
assert.match(read("src/components/demo/NorthstarCompanyOverview.tsx"), /Northstar/);
assert.match(read("src/components/demo/DemoClientPortal.tsx"), /Meridian Packaging/);

// Read-only + reset
assert.match(read("src/lib/demo/read-only.ts"), /demo@unit311central\.com/);
assert.match(read("src/lib/demo/read-only.ts"), /admin@unit311central\.com/);
assert.match(read("src/app/api/demo/reset/route.ts"), /export async function POST/);

// Intelligence 4 domains
const intelDemo = read("src/lib/intelligence/workspace-packs/demo.ts");
assert.match(intelDemo, /workspace-signals/);
assert.match(intelDemo, /market-radar/);
assert.match(intelDemo, /customer-health/);
assert.match(intelDemo, /supply-chain/);

// EA Northstar prompts
assert.match(read("src/lib/ai-operating-assistant/workspace-packs/demo-pack.ts"), /margin fall/);

// No OA/Talanton/ABHI specialist leakage in demo board
const boardData = read("src/lib/demo/board-data.ts");
assert.match(boardData, /Elena Hart/);
assert.doesNotMatch(boardData, /AbhiBoard/);

console.log("prove:northstar-demo: OK");
