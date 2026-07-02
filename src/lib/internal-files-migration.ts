import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { ClientBase } from "pg";

export const INTERNAL_FILES_MIGRATION_PATH =
  "supabase/migrations/002_create_internal_files.sql";

export function readInternalFilesMigrationSql() {
  const path = join(process.cwd(), INTERNAL_FILES_MIGRATION_PATH);
  return readFileSync(path, "utf8");
}

export async function runInternalFilesMigration(client: ClientBase) {
  const sql = readInternalFilesMigrationSql();
  await client.query(sql);
}

export async function internalFilesTablesExist(client: ClientBase) {
  const result = await client.query<{ exists: boolean }>(
    `select exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = 'file_folders'
    ) as exists`,
  );

  return result.rows[0]?.exists === true;
}
