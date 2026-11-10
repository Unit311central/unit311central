import { INTERNAL_FILES_MAX_BYTES } from "@/lib/internal-files-data";
import { UNIT311_CENTRAL_PROJECT_REF } from "@/lib/unit311-pending-migrations";

const STORAGE_CONFIG_PATH = "/config/storage";
/** Supabase project default. Files at or under this already upload. */
export const PROJECT_UPLOAD_FLOOR_BYTES = 50 * 1024 * 1024;

/** True when the Supabase project cap is below the Internal Files ceiling. */
export function projectUploadLimitNeedsRaise(
  currentBytes: number,
  minimumBytes = INTERNAL_FILES_MAX_BYTES,
): boolean {
  return !Number.isFinite(currentBytes) || currentBytes < minimumBytes;
}

function storageProjectRef(): string {
  const fromEnv = process.env.SUPABASE_PROJECT_REF?.trim();
  if (fromEnv) return fromEnv;
  const url = process.env.SUPABASE_URL?.trim() ?? "";
  const match = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
  if (match?.[1]) return match[1];
  return UNIT311_CENTRAL_PROJECT_REF;
}

function readFileSizeLimit(body: unknown): number {
  if (!body || typeof body !== "object") return 0;
  const record = body as { fileSizeLimit?: unknown; file_size_limit?: unknown };
  const value = record.fileSizeLimit ?? record.file_size_limit;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

let raisedLimit: Promise<void> | null = null;

/**
 * The internal-files bucket allows 500 MB, but Supabase still rejects anything
 * over the project upload cap (50 MB until it is raised). Raise that cap before
 * a file that would hit it. Smaller uploads skip this so a management-token
 * problem cannot block files that already store.
 */
export function ensureInternalFilesProjectUploadLimit(fileBytes: number): Promise<void> {
  if (fileBytes <= PROJECT_UPLOAD_FLOOR_BYTES) return Promise.resolve();
  if (!raisedLimit) {
    raisedLimit = raiseProjectUploadLimit(INTERNAL_FILES_MAX_BYTES).catch((error) => {
      raisedLimit = null;
      throw error;
    });
  }
  return raisedLimit;
}

async function raiseProjectUploadLimit(minimumBytes: number): Promise<void> {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim() ?? "";
  if (token.length < 20) {
    throw new Error(
      "The storage upload limit is still 50 MB. The server cannot raise it until SUPABASE_ACCESS_TOKEN is set.",
    );
  }

  const url = `https://api.supabase.com/v1/projects/${storageProjectRef()}${STORAGE_CONFIG_PATH}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  const current = await fetch(url, { headers, cache: "no-store" });
  const currentText = await current.text();
  if (!current.ok) {
    throw new Error(
      `Could not read the storage upload limit (${current.status}). ${clip(currentText)}`,
    );
  }

  let currentBody: unknown = {};
  try {
    currentBody = currentText ? JSON.parse(currentText) : {};
  } catch {
    currentBody = {};
  }
  if (!projectUploadLimitNeedsRaise(readFileSizeLimit(currentBody), minimumBytes)) return;

  const updated = await fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ fileSizeLimit: minimumBytes }),
  });
  if (!updated.ok) {
    throw new Error(
      `Could not raise the storage upload limit (${updated.status}). ${clip(await updated.text())}`,
    );
  }
}

function clip(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 180);
}
