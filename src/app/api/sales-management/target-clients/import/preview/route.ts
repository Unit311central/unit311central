import { NextRequest, NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/supabase/server";
import {
  TARGET_CLIENTS_IMPORT_MAX_ROWS,
  applyColumnMapping,
  buildCrmDuplicateKeysFromLeads,
  previewImportRows,
  type TargetClientImportField,
} from "@/lib/target-clients-import";
import {
  requireTargetClientsApiContext,
  targetClientsErrorResponse,
} from "@/lib/target-clients-api-context";
import { type AddTargetClientFormValues } from "@/lib/target-clients";
import { listCrmLeadContactKeysForImport } from "@/lib/target-clients-service";

export const dynamic = "force-dynamic";

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
    const workspace = await requireTargetClientsApiContext(request);
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
    return targetClientsErrorResponse(error);
  }
}
