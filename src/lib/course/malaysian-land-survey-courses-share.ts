import { INTERNAL_FILES_BUCKET } from "@/lib/internal-files-data";
import { requireFilesSupabase } from "@/lib/internal-files-service";
import {
  choosePublicCourseFolder,
  MALAYSIAN_LAND_SURVEY_COURSES_FOLDER_NAME,
} from "@/lib/course/malaysian-land-survey-courses-share-path";
import { WOLF_CENTRAL_SLUG } from "@/lib/wolf/wolf-surface";
import { findWorkspaceBySlug } from "@/lib/workspace-host";

const FILE_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SIGNED_URL_SECONDS = 60 * 60;

export type PublicCourseFile = {
  id: string;
  name: string;
  extension: string | null;
  mimeType: string | null;
  sizeBytes: number;
  updatedAt: string;
};

export type PublicCourseFolderListing = {
  folderName: string;
  files: PublicCourseFile[];
};

type FolderRow = { id: string; updated_at: string };
type FileRow = {
  id: string;
  name: string;
  folder_id: string;
  storage_path: string;
  mime_type: string | null;
  extension: string | null;
  size_bytes: number;
  updated_at: string;
};

export async function listMalaysianLandSurveyCourseFiles(): Promise<PublicCourseFolderListing | null> {
  const located = await loadCourseFolderFiles();
  if (!located) return null;
  return {
    folderName: MALAYSIAN_LAND_SURVEY_COURSES_FOLDER_NAME,
    files: located.files
      .map(toPublicFile)
      .sort((left, right) => left.name.localeCompare(right.name, "en")),
  };
}

export async function createMalaysianLandSurveyCourseDownload(
  fileId: string,
): Promise<{ url: string; name: string } | null> {
  if (!FILE_ID.test(fileId)) return null;
  const located = await loadCourseFolderFiles();
  const file = located?.files.find((entry) => entry.id === fileId);
  if (!file) return null;

  const supabase = requireFilesSupabase();
  const { data, error } = await supabase.storage
    .from(INTERNAL_FILES_BUCKET)
    .createSignedUrl(file.storage_path, SIGNED_URL_SECONDS, {
      download: downloadFileName(file.name),
    });
  if (error || !data?.signedUrl) return null;
  return { url: data.signedUrl, name: file.name };
}

async function loadCourseFolderFiles(): Promise<{ files: FileRow[] } | null> {
  const workspace = await findWorkspaceBySlug(WOLF_CENTRAL_SLUG);
  if (!workspace) return null;

  const supabase = requireFilesSupabase();
  const { data: folderData, error: folderError } = await supabase
    .from("file_folders")
    .select("id, updated_at")
    .eq("workspace_id", workspace.id)
    .eq("name", MALAYSIAN_LAND_SURVEY_COURSES_FOLDER_NAME);
  if (folderError) throw new Error(folderError.message);

  const folders = (folderData ?? []) as FolderRow[];
  if (folders.length === 0) return null;

  const { data: fileData, error: fileError } = await supabase
    .from("file_objects")
    .select("id, name, folder_id, storage_path, mime_type, extension, size_bytes, updated_at")
    .eq("workspace_id", workspace.id)
    .in(
      "folder_id",
      folders.map((folder) => folder.id),
    );
  if (fileError) throw new Error(fileError.message);

  const files = (fileData ?? []) as FileRow[];
  const folderId = choosePublicCourseFolder(
    folders.map((folder) => {
      const inFolder = files.filter((file) => file.folder_id === folder.id);
      return {
        id: folder.id,
        updatedAt: folder.updated_at,
        fileCount: inFolder.length,
        hasCourseTwo: inFolder.some((file) => /^course 2\./i.test(file.name)),
      };
    }),
  );
  if (!folderId) return null;
  return { files: files.filter((file) => file.folder_id === folderId) };
}

function toPublicFile(file: FileRow): PublicCourseFile {
  return {
    id: file.id,
    name: file.name,
    extension: file.extension,
    mimeType: file.mime_type,
    sizeBytes: file.size_bytes,
    updatedAt: file.updated_at,
  };
}

function downloadFileName(name: string): string {
  const cleaned = name.replace(/[\r\n"]/g, "").trim();
  return cleaned || "download";
}
