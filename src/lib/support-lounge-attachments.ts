/** Shared Support Lounge attachment rules (client + server). */

export const LOUNGE_MAX_ATTACHMENT_BYTES = 100 * 1024 * 1024;

export const LOUNGE_ATTACHMENT_ACCEPT =
  "image/*,audio/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.rtf,.zip,.mp3,.mp4,.m4a,.wav,.webm,.ogg,.jpeg,.jpg,.png,.gif,.webp";

const LOUNGE_ATTACHMENT_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "ppt",
  "pptx",
  "xls",
  "xlsx",
  "csv",
  "txt",
  "rtf",
  "zip",
  "mp3",
  "mp4",
  "m4a",
  "wav",
  "webm",
  "ogg",
  "jpeg",
  "jpg",
  "png",
  "gif",
  "webp",
]);

export function loungeAttachmentExtension(fileName: string) {
  const parts = fileName.trim().toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

export function isAllowedLoungeAttachment(file: { name: string; type?: string | null; size: number }) {
  if (file.size > LOUNGE_MAX_ATTACHMENT_BYTES) {
    return { ok: false as const, error: "Attachments must be 100 MB or smaller." };
  }
  const ext = loungeAttachmentExtension(file.name);
  const mime = (file.type || "").toLowerCase();
  const mimeOk =
    !mime ||
    mime.startsWith("image/") ||
    mime.startsWith("audio/") ||
    mime.startsWith("video/") ||
    mime.includes("pdf") ||
    mime.includes("msword") ||
    mime.includes("officedocument") ||
    mime.includes("ms-excel") ||
    mime.includes("ms-powerpoint") ||
    mime.includes("spreadsheet") ||
    mime.includes("presentation") ||
    mime.includes("text/") ||
    mime.includes("zip") ||
    mime === "application/octet-stream";
  if (ext && !LOUNGE_ATTACHMENT_EXTENSIONS.has(ext) && !mimeOk) {
    return {
      ok: false as const,
      error:
        "Unsupported file type. Use images, PDF, Office docs, txt, csv, zip, mp3, mp4, or similar.",
    };
  }
  return { ok: true as const };
}
