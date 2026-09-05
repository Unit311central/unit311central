import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  customDetailCategoryId,
  detailAttachmentsMetaFileName,
  detailDocxFileName,
  detailTasksFileName,
  detailTxtFileName,
  DETAIL_RECORD_ATTACHMENTS_FOLDER_NAME,
  getBuiltinDetailCategory,
  parseRecordAttachmentsManifest,
  parseUnit311DetailTasks,
  serializeRecordAttachmentsManifest,
  serializeUnit311DetailTasks,
  type InformationRepositoryRecordAttachment,
  type InformationRepositoryRecordAttachmentMeta,
  type InformationRepositoryRecordAttachmentsManifest,
  type Unit311DetailCategory,
  type Unit311DetailCategoryId,
  type Unit311DetailTask,
} from "@/lib/unit311-details-data";
import {
  isReservedRepositoryFolderName,
  isWolfModelTestingArchCategoryId,
  UNIT311_DETAILS_REPOSITORY_PROFILE,
  type InformationRepositoryProfile,
} from "@/lib/information-repository-profile";
import { DOMAIN_GO_LIVE_STORAGE_CATEGORY_ID } from "@/lib/domain-go-live-data";
import { MODULE_GO_LIVE_STORAGE_CATEGORY_ID } from "@/lib/module-go-live-data";
import {
  browseFolder,
  completeFileUpload,
  createFolder,
  deleteFile,
  getFileDownloadUrl,
  prepareFileUpload,
  requireFilesSupabase,
  uploadFile,
} from "@/lib/internal-files-service";
import { INTERNAL_FILES_BUCKET, type FileFolder } from "@/lib/internal-files-data";
import {
  resolveFilesWorkspaceId,
  type FilesWorkspaceScope,
} from "@/lib/files-workspace";

function isGoLiveStorageCategory(categoryId: string) {
  return (
    categoryId === MODULE_GO_LIVE_STORAGE_CATEGORY_ID ||
    categoryId === DOMAIN_GO_LIVE_STORAGE_CATEGORY_ID
  );
}

const VOICE_AND_VIDEO_DOC_PATH = "docs/VOICE_AND_VIDEO_ARCHITECTURE.md";
const EXECUTIVE_AI_DOC_PATH = "docs/EXECUTIVE_AI_PLATFORM.md";

function readSeedDetailContent(categoryId: string): string | null {
  const pathByCategory: Record<string, string> = {
    "voice-and-video": VOICE_AND_VIDEO_DOC_PATH,
    "ai-agent": EXECUTIVE_AI_DOC_PATH,
  };
  const relativePath = pathByCategory[categoryId];
  if (!relativePath) return null;
  try {
    return readFileSync(join(process.cwd(), relativePath), "utf8");
  } catch {
    return null;
  }
}

type DbFile = {
  id: string;
  name: string;
  storage_path: string;
};

export type Unit311DetailsFolderMap = Record<string, string>;

export type Unit311DetailsBootstrap = {
  rootFolderId: string;
  folders: Unit311DetailsFolderMap;
  categories: Unit311DetailCategory[];
};

async function findAllFoldersByName(
  name: string,
  parentId: string | null,
  scope?: FilesWorkspaceScope,
): Promise<FileFolder[]> {
  const workspaceId = await resolveFilesWorkspaceId(scope);
  const supabase = requireFilesSupabase();
  let query = supabase
    .from("file_folders")
    .select("*")
    .eq("name", name)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (parentId === null) {
    query = query.is("parent_id", null);
  } else {
    query = query.eq("parent_id", parentId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    parentId: row.parent_id as string | null,
    categoryId: row.category_id as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}

async function findFolderByName(
  name: string,
  parentId: string | null,
  scope?: FilesWorkspaceScope,
): Promise<FileFolder | null> {
  const folders = await findAllFoldersByName(name, parentId, scope);
  return folders[0] ?? null;
}

/**
 * Merge sibling folders that share the same name into the oldest keeper.
 * Moves child folders + files, then deletes losers. Prevents Module Go-Live
 * from reading an empty duplicate while content lives in another folder.
 */
async function consolidateDuplicateFoldersByName(
  name: string,
  parentId: string | null,
  scope?: FilesWorkspaceScope,
): Promise<FileFolder | null> {
  const folders = await findAllFoldersByName(name, parentId, scope);
  if (folders.length === 0) return null;
  if (folders.length === 1) return folders[0];

  const keeper = folders[0];
  const losers = folders.slice(1);
  const workspaceId = await resolveFilesWorkspaceId(scope);
  const supabase = requireFilesSupabase();

  console.warn(
    `[unit311-details] Consolidating ${folders.length} duplicate folders name=${name} workspace=${workspaceId}; keeping ${keeper.id}`,
  );

  for (const loser of losers) {
    const { error: childMoveError } = await supabase
      .from("file_folders")
      .update({ parent_id: keeper.id, updated_at: new Date().toISOString() })
      .eq("parent_id", loser.id)
      .eq("workspace_id", workspaceId);
    if (childMoveError) throw new Error(childMoveError.message);

    const { data: loserFiles, error: listFilesError } = await supabase
      .from("file_objects")
      .select("id, name")
      .eq("folder_id", loser.id)
      .eq("workspace_id", workspaceId);
    if (listFilesError) throw new Error(listFilesError.message);

    for (const file of loserFiles ?? []) {
      const existingInKeeper = await findFilesInFolderByName(
        keeper.id,
        file.name as string,
        scope,
      );
      if (existingInKeeper.length > 0) {
        // Prefer the newest content when both folders have the same filename.
        const { data: loserMeta, error: loserMetaError } = await supabase
          .from("file_objects")
          .select("id, created_at")
          .eq("id", file.id as string)
          .eq("workspace_id", workspaceId)
          .limit(1);
        if (loserMetaError) throw new Error(loserMetaError.message);
        const loserCreated = String(loserMeta?.[0]?.created_at ?? "");
        const keeperFile = existingInKeeper[0];
        const { data: keeperMeta } = await supabase
          .from("file_objects")
          .select("created_at")
          .eq("id", keeperFile.id)
          .eq("workspace_id", workspaceId)
          .limit(1);
        const keeperCreated = String(keeperMeta?.[0]?.created_at ?? "");
        if (loserCreated > keeperCreated) {
          await deleteFile(keeperFile.id, scope);
          const { error: moveFileError } = await supabase
            .from("file_objects")
            .update({ folder_id: keeper.id, updated_at: new Date().toISOString() })
            .eq("id", file.id as string)
            .eq("workspace_id", workspaceId);
          if (moveFileError) throw new Error(moveFileError.message);
        } else {
          await deleteFile(file.id as string, scope);
        }
      } else {
        const { error: moveFileError } = await supabase
          .from("file_objects")
          .update({ folder_id: keeper.id, updated_at: new Date().toISOString() })
          .eq("id", file.id as string)
          .eq("workspace_id", workspaceId);
        if (moveFileError) throw new Error(moveFileError.message);
      }
    }

    const { error: deleteFolderError } = await supabase
      .from("file_folders")
      .delete()
      .eq("id", loser.id)
      .eq("workspace_id", workspaceId);
    if (deleteFolderError) throw new Error(deleteFolderError.message);
  }

  return keeper;
}

async function ensureFolder(
  name: string,
  parentId: string | null,
  scope?: FilesWorkspaceScope,
): Promise<FileFolder> {
  const consolidated = await consolidateDuplicateFoldersByName(name, parentId, scope);
  if (consolidated) return consolidated;
  try {
    return await createFolder(name, parentId, null, scope);
  } catch (error) {
    // Concurrent bootstrap can race; re-read / consolidate after insert conflicts.
    const raced = await consolidateDuplicateFoldersByName(name, parentId, scope);
    if (raced) return raced;
    throw error;
  }
}

async function listChildFolderMap(parentId: string, scope?: FilesWorkspaceScope) {
  const { entries } = await browseFolder({ folderId: parentId }, scope);
  // Prefer the oldest folder when duplicate names exist so lookups stay stable
  // with findFolderByName (created_at ascending).
  const map = new Map<string, { id: string; createdAt: string }>();
  for (const entry of entries) {
    if (entry.kind !== "folder") continue;
    const key = entry.item.name.toLowerCase();
    const createdAt = entry.item.createdAt;
    const existing = map.get(key);
    if (!existing || createdAt < existing.createdAt) {
      map.set(key, { id: entry.item.id, createdAt });
    }
  }
  return new Map([...map.entries()].map(([key, value]) => [key, value.id]));
}

async function listDetailCategories(
  rootFolderId: string,
  scope: FilesWorkspaceScope | undefined,
  profile: InformationRepositoryProfile,
): Promise<Unit311DetailCategory[]> {
  const { entries } = await browseFolder({ folderId: rootFolderId }, scope);
  const categories: Unit311DetailCategory[] = profile.builtinCategories.map((category) => ({
    ...category,
  }));

  for (const entry of entries) {
    if (entry.kind !== "folder") continue;

    const displayName = entry.item.name;
    if (isReservedRepositoryFolderName(displayName, profile)) {
      continue;
    }

    categories.push({
      id: customDetailCategoryId(displayName),
      label: displayName,
      folderName: displayName,
      builtin: false,
    });
  }

  return categories.sort((left, right) => {
    if (left.builtin && !right.builtin) return -1;
    if (!left.builtin && right.builtin) return 1;
    return left.label.localeCompare(right.label);
  });
}

async function resolveCategory(
  categoryId: string,
  rootFolderId: string,
  scope: FilesWorkspaceScope | undefined,
  profile: InformationRepositoryProfile,
): Promise<Unit311DetailCategory | null> {
  const categories = await listDetailCategories(rootFolderId, scope, profile);
  return categories.find((category) => category.id === categoryId) ?? null;
}

export async function ensureUnit311DetailsFolders(
  scope?: FilesWorkspaceScope,
  profile: InformationRepositoryProfile = UNIT311_DETAILS_REPOSITORY_PROFILE,
): Promise<Unit311DetailsBootstrap> {
  const root = await ensureFolder(profile.rootFolderName, null, scope);

  for (const category of profile.builtinCategories) {
    await ensureFolder(category.folderName, root.id, scope);
  }

  const categories = await listDetailCategories(root.id, scope, profile);
  const childFolders = await listChildFolderMap(root.id, scope);
  const folders: Unit311DetailsFolderMap = {};

  for (const category of categories) {
    const folderId = childFolders.get(category.folderName.toLowerCase());
    if (folderId) {
      folders[category.id] = folderId;
    }
  }

  return { rootFolderId: root.id, folders, categories };
}

async function readStorageText(storagePath: string): Promise<string> {
  const supabase = requireFilesSupabase();
  const { data, error } = await supabase.storage.from(INTERNAL_FILES_BUCKET).download(storagePath);
  if (error || !data) return "";
  return data.text();
}

async function findFilesInFolderByName(
  folderId: string,
  name: string,
  scope?: FilesWorkspaceScope,
): Promise<DbFile[]> {
  const workspaceId = await resolveFilesWorkspaceId(scope);
  const supabase = requireFilesSupabase();
  // Prefer newest when duplicates exist — never .maybeSingle() (PGRST116 on >1 row).
  const { data, error } = await supabase
    .from("file_objects")
    .select("id, name, storage_path, created_at")
    .eq("folder_id", folderId)
    .eq("name", name)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  const rows = data ?? [];
  if (rows.length > 1) {
    console.warn(
      `[unit311-details] Duplicate file_objects for workspace=${workspaceId} folder=${folderId} name=${name} count=${rows.length}; using newest.`,
    );
  }
  return rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    storage_path: row.storage_path as string,
  }));
}

async function findFileInFolder(
  folderId: string,
  name: string,
  scope?: FilesWorkspaceScope,
): Promise<DbFile | null> {
  const files = await findFilesInFolderByName(folderId, name, scope);
  if (files.length <= 1) return files[0] ?? null;

  // Repair: keep newest, delete older duplicates so future .single()-style
  // lookups and unique indexes stay healthy.
  for (const extra of files.slice(1)) {
    try {
      await deleteFile(extra.id, scope);
    } catch (error) {
      console.warn(
        `[unit311-details] Failed deleting duplicate file ${extra.id} (${name}):`,
        error,
      );
    }
  }
  return files[0] ?? null;
}

async function deleteNamedFilesInFolder(
  folderId: string,
  names: string[],
  scope?: FilesWorkspaceScope,
) {
  for (const name of names) {
    const files = await findFilesInFolderByName(folderId, name, scope);
    for (const file of files) {
      await deleteFile(file.id, scope);
    }
  }
}

async function deleteNamedFilesInFolderExcept(
  folderId: string,
  names: string[],
  keepIds: ReadonlySet<string>,
  scope?: FilesWorkspaceScope,
) {
  for (const name of names) {
    const files = await findFilesInFolderByName(folderId, name, scope);
    for (const file of files) {
      if (keepIds.has(file.id)) continue;
      await deleteFile(file.id, scope);
    }
  }
}

async function buildDetailDocxBuffer(
  label: string,
  content: string,
  repositoryLabel = UNIT311_DETAILS_REPOSITORY_PROFILE.rootFolderName,
): Promise<Buffer> {
  const lines = content.split(/\r?\n/);
  const children = [
    new Paragraph({
      text: `${label} — ${repositoryLabel}`,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 240 },
    }),
    ...lines.map(
      (line) =>
        new Paragraph({
          children: [new TextRun({ text: line })],
          spacing: { after: 120 },
        }),
    ),
  ];

  const doc = new Document({
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}

function toUploadFile(name: string, buffer: Buffer, mimeType: string) {
  const bytes = Uint8Array.from(buffer);
  const blob = new Blob([bytes], { type: mimeType });
  return new File([blob], name, { type: mimeType });
}

export async function createUnit311DetailSection(
  name: string,
  scope?: FilesWorkspaceScope,
  profile: InformationRepositoryProfile = UNIT311_DETAILS_REPOSITORY_PROFILE,
) {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Section name is required.");
  }
  if (trimmed.length > 80) {
    throw new Error("Section name must be 80 characters or fewer.");
  }

  const root = await ensureFolder(profile.rootFolderName, null, scope);

  if (isReservedRepositoryFolderName(trimmed, profile)) {
    throw new Error("This name is already used by a standard section.");
  }

  const existing = await findFolderByName(trimmed, root.id, scope);
  if (existing) {
    throw new Error("A section with this name already exists.");
  }

  const folder = await createFolder(trimmed, root.id, null, scope);
  const category: Unit311DetailCategory = {
    id: customDetailCategoryId(trimmed),
    label: trimmed,
    folderName: trimmed,
    builtin: false,
  };

  return {
    category,
    folderId: folder.id,
    rootFolderId: root.id,
  };
}

export async function loadUnit311DetailContent(
  categoryId: string,
  scope?: FilesWorkspaceScope,
  profile: InformationRepositoryProfile = UNIT311_DETAILS_REPOSITORY_PROFILE,
) {
  const bootstrap = await ensureUnit311DetailsFolders(scope, profile);
  const category = await resolveCategory(categoryId, bootstrap.rootFolderId, scope, profile);
  if (!category) {
    throw new Error("Unknown category.");
  }

  const folderId = bootstrap.folders[categoryId];
  if (!folderId) {
    throw new Error("Category folder not found.");
  }

  const txtName = detailTxtFileName(category.label);
  const [txtFile, tasks] = await Promise.all([
    findFileInFolder(folderId, txtName, scope),
    loadTasksFromFolder(folderId, category.label, scope),
  ]);
  let content = txtFile ? await readStorageText(txtFile.storage_path) : "";

  if (!content.trim() && profile.id === UNIT311_DETAILS_REPOSITORY_PROFILE.id) {
    const seed = readSeedDetailContent(categoryId);
    if (seed?.trim()) {
      await saveUnit311DetailContent(categoryId, seed, scope, profile);
      content = seed;
    }
  }

  return {
    categoryId,
    label: category.label,
    content,
    folderId,
    tasks,
  };
}

export async function saveUnit311DetailContent(
  categoryId: string,
  content: string,
  scope?: FilesWorkspaceScope,
  profile: InformationRepositoryProfile = UNIT311_DETAILS_REPOSITORY_PROFILE,
) {
  const bootstrap = await ensureUnit311DetailsFolders(scope, profile);
  const category = await resolveCategory(categoryId, bootstrap.rootFolderId, scope, profile);
  if (!category) {
    throw new Error("Unknown category.");
  }

  const folderId = bootstrap.folders[categoryId];
  if (!folderId) {
    throw new Error("Category folder not found.");
  }

  const docxName = detailDocxFileName(category.label);
  const txtName = detailTxtFileName(category.label);
  const txtBuffer = Buffer.from(content, "utf8");

  if (txtBuffer.length === 0) {
    await deleteNamedFilesInFolder(folderId, [docxName, txtName], scope);
    return {
      categoryId,
      label: category.label,
      folderId,
      docxFileId: null,
      docxFileName: docxName,
    };
  }

  // TXT is the machine-readable source of truth — write first, then retire old
  // copies. Never delete-before-write: a failed upload would wipe the register
  // and Module Go-Live would silently fall back to catalogue defaults.
  const txtFile = await uploadFile(
    {
      file: toUploadFile(txtName, txtBuffer, "text/plain"),
      folderId,
      categoryId: null,
    },
    scope,
  );

  const keepIds = new Set<string>([txtFile.id]);
  let docxFileId: string | null = null;

  try {
    const docxBuffer = await buildDetailDocxBuffer(category.label, content, profile.rootFolderName);
    const docxFile = await uploadFile(
      {
        file: toUploadFile(
          docxName,
          docxBuffer,
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ),
        folderId,
        categoryId: null,
      },
      scope,
    );
    docxFileId = docxFile.id;
    keepIds.add(docxFile.id);
  } catch (error) {
    console.warn(
      `[unit311-details] DOCX export failed after TXT save for ${categoryId}; TXT register is intact.`,
      error,
    );
  }

  await deleteNamedFilesInFolderExcept(folderId, [docxName, txtName], keepIds, scope);

  return {
    categoryId,
    label: category.label,
    folderId,
    docxFileId,
    docxFileName: docxName,
  };
}

async function loadTasksFromFolder(
  folderId: string,
  label: string,
  scope?: FilesWorkspaceScope,
): Promise<Unit311DetailTask[]> {
  const tasksFile = await findFileInFolder(folderId, detailTasksFileName(label), scope);
  if (!tasksFile) return [];
  const raw = await readStorageText(tasksFile.storage_path);
  return parseUnit311DetailTasks(raw);
}

export async function saveUnit311DetailTasks(
  categoryId: string,
  tasks: Unit311DetailTask[],
  scope?: FilesWorkspaceScope,
  profile: InformationRepositoryProfile = UNIT311_DETAILS_REPOSITORY_PROFILE,
) {
  const bootstrap = await ensureUnit311DetailsFolders(scope, profile);
  const category = await resolveCategory(categoryId, bootstrap.rootFolderId, scope, profile);
  if (!category) {
    throw new Error("Unknown category.");
  }

  const folderId = bootstrap.folders[categoryId];
  if (!folderId) {
    throw new Error("Category folder not found.");
  }

  const tasksName = detailTasksFileName(category.label);
  await deleteNamedFilesInFolder(folderId, [tasksName], scope);

  const normalized = tasks
    .map((task) => ({
      id: task.id,
      title: task.title.trim(),
      done: task.done,
      createdAt: task.createdAt,
    }))
    .filter((task) => task.title.length > 0);

  if (normalized.length > 0) {
    const buffer = Buffer.from(serializeUnit311DetailTasks(normalized), "utf8");
    await uploadFile(
      {
        file: toUploadFile(tasksName, buffer, "application/json"),
        folderId,
        categoryId: null,
      },
      scope,
    );
  }

  return {
    categoryId,
    label: category.label,
    folderId,
    tasksFileName: tasksName,
    taskCount: normalized.length,
  };
}

export async function getUnit311DetailsOverview(
  scope?: FilesWorkspaceScope,
  profile: InformationRepositoryProfile = UNIT311_DETAILS_REPOSITORY_PROFILE,
) {
  if (profile.id === UNIT311_DETAILS_REPOSITORY_PROFILE.id) {
    try {
      const { getCurrentWorkspace } = await import("@/lib/workspace-context");
      const { isDemoWiseWorkspaceSlug } = await import("@/lib/treasury/bank-provider");
      const { getDemoEnterpriseFixtures } = await import("@/lib/demo-enterprise");
      const workspace = await getCurrentWorkspace();
      if (isDemoWiseWorkspaceSlug(workspace?.slug ?? null)) {
        const fixtures = getDemoEnterpriseFixtures();
        const categories = fixtures.details.categories.map((row) => ({
          id: `custom-${row.id}` as const,
          label: row.label,
          folderName: row.label,
          builtin: false as const,
        }));
        const contents: Record<string, string> = {};
        const tasks: Record<string, Unit311DetailTask[]> = {};
        for (const row of fixtures.details.categories) {
          contents[`custom-${row.id}`] = row.content;
          tasks[`custom-${row.id}`] = [];
        }
        return {
          rootFolderId: "demo-mag-details-root",
          folders: Object.fromEntries(categories.map((c) => [c.id, `demo-folder-${c.id}`])),
          categories,
          contents,
          tasks,
        };
      }
    } catch (error) {
      console.warn("[unit311-details] Demo overview short-circuit failed", error);
    }
  }

  // Folder bootstrap only — do not read every section's storage files here.
  // Content/tasks load on category select so the Details grid appears immediately.
  await ensureUnit311DetailsFolders(scope, profile);

  if (profile.id === UNIT311_DETAILS_REPOSITORY_PROFILE.id) {
    // Ensure the Cyber Resilience Act section button/folder exists (no duplicate).
    try {
      const { ensureCyberResilienceActSection } = await import(
        "@/lib/unit311-details-doc-pack-service"
      );
      await ensureCyberResilienceActSection(scope);
    } catch (error) {
      console.warn("[unit311-details] CRA section ensure failed", error);
    }
  }

  const latest = await ensureUnit311DetailsFolders(scope, profile);

  return {
    rootFolderId: latest.rootFolderId,
    folders: latest.folders,
    categories: latest.categories.filter(
      (category) => !isGoLiveStorageCategory(category.id),
    ),
    contents: {} as Record<string, string>,
    tasks: {} as Record<string, Unit311DetailTask[]>,
  };
}

export function parseUnit311DetailCategoryId(value: string | null): Unit311DetailCategoryId | null {
  if (!value?.trim()) return null;

  const trimmed = value.trim();
  if (getBuiltinDetailCategory(trimmed)) {
    return trimmed as Unit311DetailCategoryId;
  }

  if (isWolfModelTestingArchCategoryId(trimmed)) {
    return trimmed as Unit311DetailCategoryId;
  }

  if (trimmed.startsWith("custom-") && trimmed.length > "custom-".length) {
    return trimmed as Unit311DetailCategoryId;
  }

  return null;
}

export async function listUnit311DetailsRootEntries(
  scope?: FilesWorkspaceScope,
  profile: InformationRepositoryProfile = UNIT311_DETAILS_REPOSITORY_PROFILE,
) {
  const { rootFolderId } = await ensureUnit311DetailsFolders(scope, profile);
  return browseFolder({ folderId: rootFolderId }, scope);
}

async function resolveCategoryContext(
  categoryId: string,
  scope?: FilesWorkspaceScope,
  profile: InformationRepositoryProfile = UNIT311_DETAILS_REPOSITORY_PROFILE,
) {
  const bootstrap = await ensureUnit311DetailsFolders(scope, profile);
  const category = await resolveCategory(categoryId, bootstrap.rootFolderId, scope, profile);
  if (!category) {
    throw new Error("Unknown category.");
  }
  const folderId = bootstrap.folders[categoryId];
  if (!folderId) {
    throw new Error("Category folder not found.");
  }
  return { category, folderId };
}

async function loadAttachmentsManifest(
  sectionFolderId: string,
  label: string,
  scope?: FilesWorkspaceScope,
): Promise<InformationRepositoryRecordAttachmentsManifest> {
  const metaFile = await findFileInFolder(
    sectionFolderId,
    detailAttachmentsMetaFileName(label),
    scope,
  );
  if (!metaFile) return { version: 1, items: [] };
  const raw = await readStorageText(metaFile.storage_path);
  return parseRecordAttachmentsManifest(raw);
}

async function saveAttachmentsManifest(
  sectionFolderId: string,
  label: string,
  manifest: InformationRepositoryRecordAttachmentsManifest,
  scope?: FilesWorkspaceScope,
) {
  const metaName = detailAttachmentsMetaFileName(label);
  await deleteNamedFilesInFolder(sectionFolderId, [metaName], scope);
  if (manifest.items.length === 0) return;
  const buffer = Buffer.from(serializeRecordAttachmentsManifest(manifest), "utf8");
  await uploadFile(
    {
      file: toUploadFile(metaName, buffer, "application/json"),
      folderId: sectionFolderId,
      categoryId: null,
    },
    scope,
  );
}

async function ensureRecordAttachmentsFolder(
  sectionFolderId: string,
  scope?: FilesWorkspaceScope,
) {
  return ensureFolder(DETAIL_RECORD_ATTACHMENTS_FOLDER_NAME, sectionFolderId, scope);
}

export async function listInformationRepositoryRecordAttachments(
  categoryId: string,
  scope?: FilesWorkspaceScope,
  profile: InformationRepositoryProfile = UNIT311_DETAILS_REPOSITORY_PROFILE,
): Promise<{ attachmentsFolderId: string; attachments: InformationRepositoryRecordAttachment[] }> {
  const { category, folderId } = await resolveCategoryContext(categoryId, scope, profile);
  const attachmentsFolder = await ensureRecordAttachmentsFolder(folderId, scope);
  const manifest = await loadAttachmentsManifest(folderId, category.label, scope);
  const manifestById = new Map(manifest.items.map((item) => [item.fileId, item]));
  const { entries } = await browseFolder({ folderId: attachmentsFolder.id }, scope);
  const files = entries.filter((entry) => entry.kind === "file").map((entry) => entry.item);

  const attachments = await Promise.all(
    files.map(async (file) => {
      const meta = manifestById.get(file.id);
      const download = await getFileDownloadUrl(file.id, scope);
      return {
        id: file.id,
        name: meta?.displayName || file.name,
        caption: meta?.caption ?? "",
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        uploadedAt: file.createdAt,
        url: download.url,
      } satisfies InformationRepositoryRecordAttachment;
    }),
  );

  attachments.sort((left, right) => {
    const leftOrder = manifestById.get(left.id)?.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = manifestById.get(right.id)?.sortOrder ?? Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return right.uploadedAt.localeCompare(left.uploadedAt);
  });

  return {
    attachmentsFolderId: attachmentsFolder.id,
    attachments,
  };
}

export async function prepareInformationRepositoryRecordAttachmentUpload(
  categoryId: string,
  name: string,
  size: number,
  scope?: FilesWorkspaceScope,
  profile: InformationRepositoryProfile = UNIT311_DETAILS_REPOSITORY_PROFILE,
) {
  const { folderId } = await resolveCategoryContext(categoryId, scope, profile);
  const attachmentsFolder = await ensureRecordAttachmentsFolder(folderId, scope);
  return prepareFileUpload(
    {
      name,
      size,
      folderId: attachmentsFolder.id,
    },
    scope,
  );
}

export async function completeInformationRepositoryRecordAttachmentUpload(
  categoryId: string,
  input: {
    name: string;
    storagePath: string;
    mimeType: string | null;
    size: number;
    caption?: string;
  },
  scope?: FilesWorkspaceScope,
  profile: InformationRepositoryProfile = UNIT311_DETAILS_REPOSITORY_PROFILE,
) {
  const { category, folderId } = await resolveCategoryContext(categoryId, scope, profile);
  const attachmentsFolder = await ensureRecordAttachmentsFolder(folderId, scope);
  const file = await completeFileUpload(
    {
      name: input.name,
      storagePath: input.storagePath,
      folderId: attachmentsFolder.id,
      categoryId: null,
      mimeType: input.mimeType,
      size: input.size,
    },
    scope,
  );

  const manifest = await loadAttachmentsManifest(folderId, category.label, scope);
  const nextOrder =
    manifest.items.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;
  const nextItem: InformationRepositoryRecordAttachmentMeta = {
    fileId: file.id,
    caption: input.caption?.trim() ?? "",
    displayName: input.name.trim(),
    sortOrder: nextOrder,
  };
  await saveAttachmentsManifest(
    folderId,
    category.label,
    { version: 1, items: [...manifest.items, nextItem] },
    scope,
  );

  const download = await getFileDownloadUrl(file.id, scope);
  return {
    id: file.id,
    name: nextItem.displayName,
    caption: nextItem.caption,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    uploadedAt: file.createdAt,
    url: download.url,
  } satisfies InformationRepositoryRecordAttachment;
}

export async function updateInformationRepositoryRecordAttachment(
  categoryId: string,
  fileId: string,
  patch: { caption?: string; displayName?: string },
  scope?: FilesWorkspaceScope,
  profile: InformationRepositoryProfile = UNIT311_DETAILS_REPOSITORY_PROFILE,
) {
  const { category, folderId } = await resolveCategoryContext(categoryId, scope, profile);
  const manifest = await loadAttachmentsManifest(folderId, category.label, scope);
  const index = manifest.items.findIndex((item) => item.fileId === fileId);
  if (index < 0) {
    throw new Error("Attachment not found.");
  }
  const current = manifest.items[index];
  const nextItems = [...manifest.items];
  nextItems[index] = {
    ...current,
    caption: patch.caption !== undefined ? patch.caption.trim() : current.caption,
    displayName:
      patch.displayName !== undefined ? patch.displayName.trim() || current.displayName : current.displayName,
  };
  await saveAttachmentsManifest(folderId, category.label, { version: 1, items: nextItems }, scope);
  const listed = await listInformationRepositoryRecordAttachments(categoryId, scope, profile);
  const attachment = listed.attachments.find((item) => item.id === fileId);
  if (!attachment) throw new Error("Attachment not found.");
  return attachment;
}

export async function deleteInformationRepositoryRecordAttachment(
  categoryId: string,
  fileId: string,
  scope?: FilesWorkspaceScope,
  profile: InformationRepositoryProfile = UNIT311_DETAILS_REPOSITORY_PROFILE,
) {
  const { category, folderId } = await resolveCategoryContext(categoryId, scope, profile);
  await deleteFile(fileId, scope);
  const manifest = await loadAttachmentsManifest(folderId, category.label, scope);
  await saveAttachmentsManifest(
    folderId,
    category.label,
    { version: 1, items: manifest.items.filter((item) => item.fileId !== fileId) },
    scope,
  );
  return { deleted: true, fileId };
}
