import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";

import {
  internalFilesTablesExist,
  runInternalFilesMigration,
} from "@/lib/internal-files-migration";

export const dynamic = "force-dynamic";

function getDatabaseUrl() {
  return process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL ?? null;
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.INTERNAL_FILES_SETUP_SECRET;
  if (!secret) {
    return false;
  }

  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) {
    return true;
  }

  return request.headers.get("x-setup-secret") === secret;
}

export async function GET() {
  const dbUrl = getDatabaseUrl();
  const hasSecret = Boolean(process.env.INTERNAL_FILES_SETUP_SECRET);

  if (!dbUrl) {
    return NextResponse.json(
      {
        ready: false,
        error:
          "SUPABASE_DB_URL is not set. Add your Supabase database connection string to Vercel.",
      },
      { status: 503 },
    );
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    const exists = await internalFilesTablesExist(client);

    return NextResponse.json({
      ready: true,
      tablesExist: exists,
      canRunSetup: hasSecret,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database connection failed";
    return NextResponse.json({ ready: false, error: message }, { status: 500 });
  } finally {
    await client.end().catch(() => undefined);
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    return NextResponse.json(
      {
        error:
          "SUPABASE_DB_URL is not set. Add your Supabase database connection string to Vercel.",
      },
      { status: 503 },
    );
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();

    const alreadyExists = await internalFilesTablesExist(client);
    if (alreadyExists) {
      return NextResponse.json({
        ok: true,
        alreadyApplied: true,
        message: "Internal files tables already exist.",
      });
    }

    await runInternalFilesMigration(client);

    return NextResponse.json({
      ok: true,
      alreadyApplied: false,
      message: "Internal files migration applied successfully.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Migration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await client.end().catch(() => undefined);
  }
}
