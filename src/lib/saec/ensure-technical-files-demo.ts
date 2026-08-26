import {
  SAEC_TECHNICAL_FILE_MASTERS,
  SAEC_TECHNICAL_FILES_DEMO,
} from "@/lib/saec/technical-files-demo-catalogue";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";

function db() {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  return createTenancyServerClient();
}

/** Seed demo technical files for OmniTransit when the workspace register is empty. */
export async function ensureSaecTechnicalFilesDemoCatalogue(workspaceId: string): Promise<void> {
  const client = db();
  const { count, error: countError } = await client
    .from("engineering_technical_files")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  if (countError) throw new Error(countError.message);
  if ((count ?? 0) > 0) return;

  const masters = SAEC_TECHNICAL_FILE_MASTERS.map((row) => ({
    id: row.id,
    workspace_id: workspaceId,
    title: row.title,
    description: row.description,
    program_ref: row.programRef,
    product_ref: row.productRef,
    status: "Active",
    created_by_name: "OmniTransit Engineering (demo)",
  }));

  const { error: masterError } = await client.from("engineering_masters").upsert(masters);
  if (masterError) throw new Error(masterError.message);

  for (const row of SAEC_TECHNICAL_FILES_DEMO) {
    const storagePath = `${workspaceId}/technical-files-demo/${row.fileId}/${row.fileName}`;
    const { error: fileError } = await client.from("engineering_technical_files").upsert({
      id: row.fileId,
      workspace_id: workspaceId,
      title: row.title,
      description: row.description,
      category: row.category,
      file_kind: "document",
      status: row.status,
      master_id: row.masterId,
      program_ref: row.programRef,
      product_ref: row.productRef,
      part_number: row.partNumber,
      drawing_number: row.drawingNumber,
      tags: row.tags,
      notes: "Demonstration record — not a regulated certification.",
      access_level: "standard",
      current_version_id: row.versionId,
      created_by_name: "OmniTransit Engineering (demo)",
    });
    if (fileError) throw new Error(fileError.message);

    const { error: versionError } = await client.from("engineering_technical_file_versions").upsert({
      id: row.versionId,
      workspace_id: workspaceId,
      technical_file_id: row.fileId,
      revision: row.revision,
      version_label: row.revision,
      file_name: row.fileName,
      storage_path: storagePath,
      mime_type: row.fileName.endsWith(".pdf") ? "application/pdf" : "application/octet-stream",
      extension: row.fileName.split(".").pop() ?? null,
      size_bytes: 0,
      is_current: true,
      uploaded_by_name: "OmniTransit Engineering (demo)",
      change_notes: "Demo catalogue seed",
    });
    if (versionError) throw new Error(versionError.message);
  }
}
