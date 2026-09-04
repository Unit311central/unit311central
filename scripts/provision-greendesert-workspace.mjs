#!/usr/bin/env node
/**
 * Provision Green Desert workspace admin + module enablement.
 * Applies migration 204 logic via Supabase when run against a configured project.
 *
 * Usage:
 *   node scripts/provision-greendesert-workspace.mjs
 *
 * Credentials after provision:
 *   admin@greendesert.unit311central.com / Reactor20206$
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationPath = join(
  __dirname,
  "../supabase/migrations/204_greendesert_workspace_enablement_hr.sql",
);

console.log("Green Desert workspace provisioning");
console.log("Run migration 204 against your Supabase project:");
console.log("");
console.log(readFileSync(migrationPath, "utf8"));
console.log("");
console.log("Admin login: admin@greendesert.unit311central.com / Reactor20206$");
