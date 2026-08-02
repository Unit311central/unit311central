/**
 * Extract plain text from PDF / DOCX / text buffers for AI course generation.
 */

export type ExtractedDocument = {
  text: string;
  mimeType: string;
  fileName: string;
  pageHint?: number;
};

function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractTextFromBuffer(
  bytes: ArrayBuffer | Buffer | Uint8Array,
  fileName: string,
  mimeType?: string | null,
): Promise<ExtractedDocument> {
  const name = fileName || "document";
  const lower = name.toLowerCase();
  const mime = (mimeType || "").toLowerCase();
  const buf = Buffer.isBuffer(bytes)
    ? bytes
    : Buffer.from(bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes);

  if (
    mime.includes("wordprocessingml") ||
    lower.endsWith(".docx") ||
    mime === "application/msword"
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: buf });
    const text = normalizeText(result.value || "");
    if (!text) throw new Error("Could not extract text from Word document.");
    return { text, mimeType: mime || "application/vnd.openxmlformats-officedocument.wordprocessingml.document", fileName: name };
  }

  if (mime.includes("pdf") || lower.endsWith(".pdf")) {
    const { extractText } = await import("unpdf");
    const data = new Uint8Array(buf);
    const result = await extractText(data, { mergePages: true });
    const text = normalizeText(
      Array.isArray(result.text) ? result.text.join("\n\n") : String(result.text ?? ""),
    );
    if (!text) throw new Error("Could not extract text from PDF.");
    return {
      text,
      mimeType: "application/pdf",
      fileName: name,
      pageHint: typeof result.totalPages === "number" ? result.totalPages : undefined,
    };
  }

  if (mime.startsWith("text/") || lower.endsWith(".txt") || lower.endsWith(".md")) {
    const text = normalizeText(buf.toString("utf8"));
    if (!text) throw new Error("Empty text document.");
    return { text, mimeType: mime || "text/plain", fileName: name };
  }

  // Last resort: try UTF-8
  const fallback = normalizeText(buf.toString("utf8"));
  if (fallback.length > 40) {
    return { text: fallback, mimeType: mime || "application/octet-stream", fileName: name };
  }
  throw new Error("Unsupported file type. Upload a PDF or Word (.docx) document.");
}

/** Cap text for LLM prompts while keeping head + tail of long policies. */
export function clipDocumentText(text: string, maxChars = 28000): string {
  const cleaned = normalizeText(text);
  if (cleaned.length <= maxChars) return cleaned;
  const head = Math.floor(maxChars * 0.7);
  const tail = maxChars - head - 80;
  return `${cleaned.slice(0, head)}\n\n[…document continues…]\n\n${cleaned.slice(-tail)}`;
}
