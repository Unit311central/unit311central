import { NextRequest, NextResponse } from "next/server";

import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { TARGET_CLIENTS_IMPORT_MAX_ROWS } from "@/lib/target-clients-import";
import {
  requireTargetClientsApiContext,
  targetClientsErrorResponse,
} from "@/lib/target-clients-api-context";
import {
  validateAddTargetClientForm,
  type AddTargetClientFormValues,
} from "@/lib/target-clients";
import { importTargetClientsBatch } from "@/lib/target-clients-service";

export const dynamic = "force-dynamic";

type ImportBody = {
  rows?: Array<AddTargetClientFormValues & { sourceRowNumber: number }>;
};

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const workspace = await requireTargetClientsApiContext(request);
    const body = (await request.json()) as ImportBody;
    const rows = body.rows ?? [];
    if (rows.length === 0) {
      return NextResponse.json({ error: "No rows selected for import." }, { status: 400 });
    }
    if (rows.length > TARGET_CLIENTS_IMPORT_MAX_ROWS) {
      return NextResponse.json(
        { error: `Too many rows (max ${TARGET_CLIENTS_IMPORT_MAX_ROWS}).` },
        { status: 400 },
      );
    }

    for (const row of rows) {
      const values: AddTargetClientFormValues = {
        companyName: String(row.companyName ?? ""),
        website: String(row.website ?? ""),
        sector: String(row.sector ?? ""),
        contactName: String(row.contactName ?? ""),
        contactPosition: String(row.contactPosition ?? ""),
        email: String(row.email ?? ""),
      };
      const fieldErrors = validateAddTargetClientForm(values);
      if (Object.keys(fieldErrors).length > 0) {
        return NextResponse.json(
          {
            error: `Row ${row.sourceRowNumber}: validation failed before import.`,
            fieldErrors,
          },
          { status: 400 },
        );
      }
    }

    const results = await importTargetClientsBatch(
      rows.map((row) => ({
        sourceRowNumber: row.sourceRowNumber,
        values: {
          companyName: String(row.companyName ?? ""),
          website: String(row.website ?? ""),
          sector: String(row.sector ?? ""),
          contactName: String(row.contactName ?? ""),
          contactPosition: String(row.contactPosition ?? ""),
          email: String(row.email ?? ""),
        },
      })),
      { workspaceId: workspace.id },
    );

    const imported = results.filter((r) => r.status === "imported");
    const skipped = results.filter((r) => r.status === "skipped");

    return NextResponse.json({
      importedCount: imported.length,
      skippedCount: skipped.length,
      results,
    });
  } catch (error) {
    return targetClientsErrorResponse(error);
  }
}
