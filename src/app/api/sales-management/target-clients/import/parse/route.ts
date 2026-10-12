import { NextRequest, NextResponse } from "next/server";

import { getRequestHost } from "@/lib/app-domains";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import {
  TARGET_CLIENTS_IMPORT_MAX_FILE_BYTES,
  TARGET_CLIENTS_IMPORT_MAX_ROWS,
  parseTargetClientsCsv,
} from "@/lib/target-clients-import";
import { parseTargetClientsXlsxBuffer } from "@/lib/target-clients-import-xlsx.server";
import { assertTargetClientsApiHost } from "@/lib/target-clients";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

function assertInternalCentralWorkspace(slug: string) {
  if (slug !== INTERNAL_WORKSPACE_SLUG) {
    throw new Error("Target Clients is only available on the internal Unit311Central workspace.");
  }
}

function extensionOf(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : "";
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    assertTargetClientsApiHost(getRequestHost(request));
    assertInternalCentralWorkspace(workspace.slug);

    const form = await request.formData();
    const file = form.get("file");
    const sheetName = String(form.get("sheet") ?? "").trim() || undefined;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Select a CSV or Excel file to import." }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "The selected file is empty." }, { status: 400 });
    }
    if (file.size > TARGET_CLIENTS_IMPORT_MAX_FILE_BYTES) {
      return NextResponse.json(
        {
          error: `File exceeds the ${Math.round(TARGET_CLIENTS_IMPORT_MAX_FILE_BYTES / (1024 * 1024))} MB limit.`,
        },
        { status: 400 },
      );
    }

    const ext = extensionOf(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    let parsed: { headers: string[]; rows: string[][]; sheetNames?: string[] };
    if (ext === "csv") {
      const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
      parsed = parseTargetClientsCsv(text);
    } else if (ext === "xlsx") {
      try {
        parsed = parseTargetClientsXlsxBuffer(buffer, sheetName);
      } catch {
        return NextResponse.json(
          { error: "Could not read this Excel file. Try saving as .xlsx or use CSV." },
          { status: 400 },
        );
      }
    } else if (ext === "xls") {
      return NextResponse.json(
        { error: "Legacy .xls is not supported. Save the file as .xlsx or CSV." },
        { status: 400 },
      );
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Upload .csv or .xlsx." },
        { status: 400 },
      );
    }

    if (parsed.headers.length === 0 || parsed.headers.every((h) => !h.trim())) {
      return NextResponse.json({ error: "No column headings found in the spreadsheet." }, { status: 400 });
    }

    if (parsed.rows.length === 0) {
      return NextResponse.json({ error: "No data rows found below the header row." }, { status: 400 });
    }

    if (parsed.rows.length > TARGET_CLIENTS_IMPORT_MAX_ROWS) {
      return NextResponse.json(
        {
          error: `Spreadsheet has too many rows (max ${TARGET_CLIENTS_IMPORT_MAX_ROWS}). Split the file and import in batches.`,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      headers: parsed.headers,
      rows: parsed.rows,
      rowCount: parsed.rows.length,
      sheetNames: parsed.sheetNames ?? [],
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Parse failed.";
    let status = 500;
    if (message.includes("Authentication required") || message.includes("Session")) {
      status = 401;
    } else if (message.includes("only available on the internal")) {
      status = 403;
    }
    return NextResponse.json({ error: message }, { status });
  }
}
