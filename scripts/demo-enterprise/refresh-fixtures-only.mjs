/**
 * Regenerate Demo fixtures JSON only (no Supabase wipe/seed).
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildEnterpriseGraph } from "./build-graph.mjs";
import { writeDemoFixtures } from "./fixtures/write-demo-fixtures.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");
const seed = Number(process.env.DEMO_ENTERPRISE_SEED ?? 3112025);

const graph = buildEnterpriseGraph({ seed, employees: 25, clients: 100 });
console.log(
  `Graph: ${graph.employees.length} employees, ${graph.clients.length} clients, ${graph.projects.length} projects, ${graph.invoices.length} invoices`,
);
const fixturesPath = writeDemoFixtures(ROOT, graph);
console.log(`Wrote Demo fixtures → ${fixturesPath}`);
