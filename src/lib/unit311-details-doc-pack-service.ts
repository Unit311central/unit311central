import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  CYBER_RESILIENCE_ACT_CATEGORY_ID,
  CYBER_RESILIENCE_ACT_LABEL,
  findDocPackForCategory,
  type Unit311DetailDocPack,
  type Unit311DetailDocPackEntry,
} from "@/lib/unit311-details-doc-packs";
import {
  createUnit311DetailSection,
  ensureUnit311DetailsFolders,
  parseUnit311DetailCategoryId,
} from "@/lib/unit311-details-service";
import {
  browseFolder,
  deleteFile,
  requireFilesSupabase,
  uploadFile,
} from "@/lib/internal-files-service";
import { INTERNAL_FILES_BUCKET } from "@/lib/internal-files-data";
import type { FilesWorkspaceScope } from "@/lib/files-workspace";
import { resolveFilesWorkspaceId } from "@/lib/files-workspace";

export type Unit311DetailPackDocument = {
  id: string;
  title: string;
  fileName: string;
  order: number;
  fileId: string | null;
  content: string;
};

function toUploadFile(name: string, buffer: Buffer, mimeType: string) {
  const bytes = Uint8Array.from(buffer);
  return new File([bytes], name, { type: mimeType });
}

function readSourceMarkdown(entry: Unit311DetailDocPackEntry): string {
  try {
    return readFileSync(join(process.cwd(), entry.sourcePath), "utf8");
  } catch {
    return `# ${entry.title}\n\nSource file missing at \`${entry.sourcePath}\`.\n`;
  }
}

async function readStorageText(storagePath: string): Promise<string> {
  const supabase = requireFilesSupabase();
  const { data, error } = await supabase.storage
    .from(INTERNAL_FILES_BUCKET)
    .download(storagePath);
  if (error || !data) throw new Error(error?.message ?? "Failed to download document.");
  return Buffer.from(await data.arrayBuffer()).toString("utf8");
}

async function findFileByName(
  folderId: string,
  fileName: string,
  scope?: FilesWorkspaceScope,
) {
  const { entries } = await browseFolder({ folderId }, scope);
  const match = entries.find(
    (entry) => entry.kind === "file" && entry.item.name === fileName,
  );
  return match?.kind === "file" ? match.item : null;
}

/**
 * Ensure the Cyber Resilience Act section exists without creating a duplicate
 * button when a custom section with that label is already present.
 */
export async function ensureCyberResilienceActSection(scope?: FilesWorkspaceScope) {
  const bootstrap = await ensureUnit311DetailsFolders(scope);
  const existing = bootstrap.categories.find(
    (category) =>
      category.id === CYBER_RESILIENCE_ACT_CATEGORY_ID ||
      category.label.trim().toLowerCase() === CYBER_RESILIENCE_ACT_LABEL.toLowerCase() ||
      category.folderName.trim().toLowerCase() === CYBER_RESILIENCE_ACT_LABEL.toLowerCase(),
  );
  if (existing) {
    return {
      category: existing,
      folderId: bootstrap.folders[existing.id] ?? null,
      created: false,
    };
  }

  const created = await createUnit311DetailSection(CYBER_RESILIENCE_ACT_LABEL, scope);
  return {
    category: created.category,
    folderId: created.folderId,
    created: true,
  };
}

export async function syncDocPackToFolder(
  pack: Unit311DetailDocPack,
  folderId: string,
  scope?: FilesWorkspaceScope,
) {
  await resolveFilesWorkspaceId(scope);
  const synced: Array<{ id: string; fileName: string; fileId: string }> = [];

  for (const entry of pack.documents) {
    const content = readSourceMarkdown(entry);
    const buffer = Buffer.from(content, "utf8");
    const existing = await findFileByName(folderId, entry.fileName, scope);
    if (existing) {
      await deleteFile(existing.id, scope);
    }
    const uploaded = await uploadFile(
      {
        file: toUploadFile(entry.fileName, buffer, "text/markdown"),
        folderId,
        categoryId: null,
      },
      scope,
    );
    synced.push({ id: entry.id, fileName: entry.fileName, fileId: uploaded.id });
  }

  // Keep a concise index in the section details.txt so Edit Notes remains useful.
  const indexBody = [
    `# ${pack.label}`,
    "",
    "This Unit311 Details section contains the Cyber Resilience Act documentation pack.",
    "",
    "Open a document from the list on the left to review each control area.",
    "",
    "## Documents",
    "",
    ...pack.documents.map((doc) => `- ${doc.title}`),
    "",
    "Source of truth also lives in the repository under `docs/cyber-resilience-act/`.",
    "",
  ].join("\n");

  const { saveUnit311DetailContent } = await import("@/lib/unit311-details-service");
  const categoryId =
    parseUnit311DetailCategoryId(pack.categoryIds[0] ?? null) ??
    CYBER_RESILIENCE_ACT_CATEGORY_ID;
  await saveUnit311DetailContent(categoryId, indexBody, scope);

  return { syncedCount: synced.length, documents: synced };
}

export async function ensureDocPackForCategory(
  categoryId: string,
  label?: string | null,
  folderName?: string | null,
  scope?: FilesWorkspaceScope,
) {
  const pack = findDocPackForCategory({ categoryId, label, folderName });
  if (!pack) return null;

  const bootstrap = await ensureUnit311DetailsFolders(scope);
  let folderId = bootstrap.folders[categoryId] ?? null;
  let resolvedCategoryId = categoryId;

  if (!folderId && pack.id === "cyber-resilience-act") {
    const ensured = await ensureCyberResilienceActSection(scope);
    folderId = ensured.folderId;
    resolvedCategoryId = ensured.category.id;
  }

  if (!folderId) return null;

  await syncDocPackToFolder(pack, folderId, scope);
  return listDocPackDocuments(resolvedCategoryId, label, folderName, scope);
}

export async function listDocPackDocuments(
  categoryId: string,
  label?: string | null,
  folderName?: string | null,
  scope?: FilesWorkspaceScope,
  options?: { allowAutoSync?: boolean },
): Promise<{
  packId: string;
  packLabel: string;
  documents: Unit311DetailPackDocument[];
} | null> {
  const pack = findDocPackForCategory({ categoryId, label, folderName });
  if (!pack) return null;
  const allowAutoSync = options?.allowAutoSync !== false;

  const bootstrap = await ensureUnit311DetailsFolders(scope);
  const folderId = bootstrap.folders[categoryId];
  if (!folderId) {
    return {
      packId: pack.id,
      packLabel: pack.label,
      documents: pack.documents.map((entry) => ({
        id: entry.id,
        title: entry.title,
        fileName: entry.fileName,
        order: entry.order,
        fileId: null,
        content: readSourceMarkdown(entry),
      })),
    };
  }

  const documents: Unit311DetailPackDocument[] = [];
  for (const entry of pack.documents) {
    const existing = await findFileByName(folderId, entry.fileName, scope);
    let content = readSourceMarkdown(entry);
    if (existing) {
      try {
        content = await readStorageText(existing.storagePath);
      } catch {
        // Fall back to repo source if storage read fails.
      }
    }
    documents.push({
      id: entry.id,
      title: entry.title,
      fileName: entry.fileName,
      order: entry.order,
      fileId: existing?.id ?? null,
      content,
    });
  }

  const missing = documents.filter((doc) => !doc.fileId);
  if (missing.length > 0 && allowAutoSync) {
    await syncDocPackToFolder(pack, folderId, scope);
    return listDocPackDocuments(categoryId, label, folderName, scope, {
      allowAutoSync: false,
    });
  }

  return {
    packId: pack.id,
    packLabel: pack.label,
    documents: documents.sort((a, b) => a.order - b.order),
  };
}
