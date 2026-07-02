import { readFileSync } from "node:fs";
import { join } from "node:path";

import pg from "pg";

const { Client } = pg;

const migrations = [
  { table: "competitors", path: "supabase/migrations/007_create_competitors.sql" },
  { table: "internal_whiteboard", path: "supabase/migrations/008_create_internal_whiteboard.sql" },
];

async function tableExists(client, tableName) {
  const result = await client.query(
    `select exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = $1
    ) as exists`,
    [tableName],
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

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();

    for (const migration of migrations) {
      if (await tableExists(client, migration.table)) {
        console.log(`Already exists: ${migration.table}`);
        continue;
      }

      const sql = readFileSync(join(process.cwd(), migration.path), "utf8");
      await client.query(sql);
      await client.query(`notify pgrst, 'reload schema'`);
      console.log(`Applied migration: ${migration.table}`);
    }
  } finally {
    await client.end().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
