/**
 * Internal Files upload ceiling.
 *
 * Run: npx tsx src/lib/__tests__/internal-files-upload-limit.check.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { INTERNAL_FILES_MAX_BYTES } from "@/lib/internal-files-data";
import { MIGRATION_SATISFACTION_PROBES } from "@/lib/migration-satisfaction-probes";
import { UNIT311_PENDING_MIGRATIONS } from "@/lib/unit311-pending-migrations";

const MIGRATION = "supabase/migrations/224_internal_files_upload_limit.sql";
const LIMIT_BYTES = 500 * 1024 * 1024;

assert.equal(INTERNAL_FILES_MAX_BYTES, LIMIT_BYTES);
assert.equal(Math.floor(INTERNAL_FILES_MAX_BYTES / (1024 * 1024)), 500);

const sql = readFileSync(MIGRATION, "utf8");
assert.match(sql, /file_size_limit = 524288000/);
assert.match(sql, /id = 'internal-files'/);

assert.ok((UNIT311_PENDING_MIGRATIONS as readonly string[]).includes(MIGRATION));
assert.match(MIGRATION_SATISFACTION_PROBES[MIGRATION] ?? "", /524288000/);
assert.match(MIGRATION_SATISFACTION_PROBES[MIGRATION] ?? "", /internal-files/);

console.log("internal-files-upload-limit.check.ts — all assertions passed.");
