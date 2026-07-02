import { readFileSync } from "node:fs";
import { join } from "node:path";

import pg from "pg";

const { Client } = pg;

const migrationPath = join(
  process.cwd(),
  "supabase/migrations/002_create_internal_files.sql",
);

async function tablesExist(client) {
  const result = await client.query(
    `select exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = 'file_folders'
    ) as exists`,
  );

  return result.rows[0]?.exists === true;
}

async function main() {
  const dbUrl = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error(
      "Missing SUPABASE_DB_URL. Copy the URI from Supabase → Project Settings → Database → Connection string.",
    );
    process.exit(1);
  }

  const sql = readFileSync(migrationPath, "utf8");
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();

    if (await tablesExist(client)) {
      console.log("Internal files tables already exist. Nothing to do.");
      return;
    }

    await client.query(sql);
    console.log("Migration applied: file_categories, file_folders, file_objects, internal-files bucket.");
  } finally {
    await client.end().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
