import "server-only";

import { INTERNAL_FILES_BUCKET } from "@/lib/internal-files-data";
import { requireFilesSupabase } from "@/lib/internal-files-service";

export async function uploadSalesQuoteTermsPdf(options: {
  workspaceId: string;
  quoteId: string;
  filename: string;
  bytes: Buffer;
}): Promise<{ storagePath: string; filename: string }> {
  const supabase = requireFilesSupabase();
  const safeName = options.filename.replace(/[^\w.\-()+ ]+/g, "_").slice(0, 180);
  const storagePath = `sales-quotes/${options.workspaceId}/${options.quoteId}/terms/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from(INTERNAL_FILES_BUCKET).upload(storagePath, options.bytes, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) throw new Error(error.message);
  return { storagePath, filename: safeName };
}

export async function downloadSalesQuoteTermsPdf(storagePath: string): Promise<Uint8Array | null> {
  const supabase = requireFilesSupabase();
  const { data, error } = await supabase.storage.from(INTERNAL_FILES_BUCKET).download(storagePath);
  if (error || !data) return null;
  const buffer = Buffer.from(await data.arrayBuffer());
  return new Uint8Array(buffer);
}

export async function deleteSalesQuoteTermsPdf(storagePath: string | null | undefined) {
  if (!storagePath?.trim()) return;
  const supabase = requireFilesSupabase();
  await supabase.storage.from(INTERNAL_FILES_BUCKET).remove([storagePath]);
}
