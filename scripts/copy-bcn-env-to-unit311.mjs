/**
 * @deprecated Legacy migration script — copied env from barcelonadronecenter → unit311.
 *
 * Canonical production: Vercel project `unit311central` only.
 * See docs/PRODUCTION_DEPLOYMENT.md
 */
import { UNIT311_VERCEL_PROJECT_NAME } from "./assert-canonical-unit311-repo.mjs";

console.error("BLOCKED: scripts/copy-bcn-env-to-unit311.mjs is deprecated.");
console.error(`  Canonical Vercel project: ${UNIT311_VERCEL_PROJECT_NAME}`);
console.error("  Do not copy env to legacy projects barcelonadronecenter or unit311.");
process.exit(1);
