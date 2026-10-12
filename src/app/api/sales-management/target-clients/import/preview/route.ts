import { NextRequest, NextResponse } from "next/server";

import { getRequestHost } from "@/lib/app-domains";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import {
  TARGET_CLIENTS_IMPORT_MAX_ROWS,
  applyColumnMapping,
  buildCrmDuplicateKeysFromLeads,
  previewImportRows,
  type TargetClientImportField,
} from "@/lib/target-clients-import";
import { assertTargetClientsApiHost, type AddTargetClientFormValues } from "@/lib/target-clients";
import { listCrmLeadContactKeysForImport } from "@/lib/target-clients-service";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

function assertInternalCentralWorkspace(slug: string) {
  if (slug !== INTERNAL_WORKSPACE_SLUG) {
    throw new Error("Target Clients is only available on the internal Unit311Central workspace.");
  }
}

type PreviewBody = {
  headers?: string[];
  rows?: string[][];
  mapping?: Partial<Record<TargetClientImportField, number>>;
  mappedRows?: Array<AddTargetClientFormValues & { sourceRowNumber: number }>;
};

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    assertTargetClientsApiHost(getRequestHost(request));
    assertInternalCentralWorkspace(workspace.slug);

    const body = (await request.json()) as PreviewBody;
    let mappedRows = body.mappedRows;

    if (!mappedRows?.length) {
      const headers = body.headers ?? [];
      const rows = body.rows ?? [];
      const mapping = body.mapping ?? {};
      if (!headers.length || !rows.length) {
        return NextResponse.json({ error: "Spreadsheet data and mapping are required." }, { status: 400 });
      }
      if (mapping.companyName == null || mapping.companyName < 0) {
        return NextResponse.json({ error: "Company Name column mapping is required." }, { status: 400 });
      }
      mappedRows = applyColumnMapping(headers, rows, mapping);
    }

    if (mappedRows.length > TARGET_CLIENTS_IMPORT_MAX_ROWS) {
      return NextResponse.json(
        { error: `Too many rows (max ${TARGET_CLIENTS_IMPORT_MAX_ROWS}).` },
        { status: 400 },
      );
    }

    const crmKeys = buildCrmDuplicateKeysFromLeads(
      await listCrmLeadContactKeysForImport({ workspaceId: workspace.id }),
    );
    const previews = previewImportRows(mappedRows, crmKeys);

    const summary = {
      total: previews.length,
      ready: previews.filter((p) => p.status === "ready").length,
      duplicateCrm: previews.filter((p) => p.status === "duplicate_crm").length,
      duplicateFile: previews.filter((p) => p.status === "duplicate_file").length,
      errors: previews.filter((p) => p.status === "error").length,
    };

    return NextResponse.json({ previews, summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Preview failed.";
    let status = 500;
    if (message.includes("Authentication required") || message.includes("Session")) {
      status = 401;
    } else if (message.includes("only available on the internal")) {
      status = 403;
    }
    return NextResponse.json({ error: message }, { status });
  }
}
