/**
 * @deprecated Legacy migration script — targeted obsolete Vercel project `unit311`.
 *
 * Canonical production: Vercel project `unit311central` (Git deploy from Unit311central/unit311central).
 * Do not run this script; it would link/copy env to the wrong project.
 *
 * See docs/PRODUCTION_DEPLOYMENT.md and docs/VERCEL_ARCHITECTURE.md
 */
import {
  CANONICAL_GITHUB_SLUG,
  UNIT311_VERCEL_PROJECT_NAME,
} from "./assert-canonical-unit311-repo.mjs";

console.error("BLOCKED: scripts/provision-unit311-vercel.mjs is deprecated.");
console.error(`  Canonical Vercel project: ${UNIT311_VERCEL_PROJECT_NAME}`);
console.error(`  Canonical GitHub repo:   ${CANONICAL_GITHUB_SLUG}`);
console.error("  Manage production env via: npx vercel env --project unit311central");
console.error("  See docs/PRODUCTION_DEPLOYMENT.md");
process.exit(1);
