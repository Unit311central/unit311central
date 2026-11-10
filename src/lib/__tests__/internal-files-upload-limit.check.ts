/**
 * Internal Files upload ceiling.
 *
 * Run: npx tsx src/lib/__tests__/internal-files-upload-limit.check.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { INTERNAL_FILES_MAX_BYTES } from "@/lib/internal-files-data";
import { projectUploadLimitNeedsRaise } from "@/lib/internal-files-storage-limit";
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

assert.equal(projectUploadLimitNeedsRaise(50 * 1024 * 1024), true);
assert.equal(projectUploadLimitNeedsRaise(171 * 1024 * 1024), true);
assert.equal(projectUploadLimitNeedsRaise(INTERNAL_FILES_MAX_BYTES), false);
assert.equal(projectUploadLimitNeedsRaise(Number.NaN), true);

const prepareSource = readFileSync("src/lib/internal-files-service.ts", "utf8");
assert.match(prepareSource, /ensureInternalFilesProjectUploadLimit\(options\.size\)/);
const limitSource = readFileSync("src/lib/internal-files-storage-limit.ts", "utf8");
assert.match(limitSource, /fileSizeLimit: minimumBytes/);
assert.match(limitSource, /fileBytes <= PROJECT_UPLOAD_FLOOR_BYTES/);

console.log("internal-files-upload-limit.check.ts — all assertions passed.");
