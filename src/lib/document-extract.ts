/**
 * Extract plain text from PDF / DOCX / text buffers for AI course generation.
 */

export type ExtractedDocument = {
  text: string;
  mimeType: string;
  fileName: string;
  pageHint?: number;
};

const PDF_OCR_MAX_BYTES = 15 * 1024 * 1024;

/**
 * pdf.js workers transfer the PDF bytes ArrayBuffer between threads. Node 21+
 * rejects pooled/non-transferable buffers — always copy to a fresh ArrayBuffer.
 */
function toWorkerSafePdfBytes(buf: Buffer): Uint8Array {
  return new Uint8Array(Buffer.from(buf));
}

function isPdfWorkerTransferError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Cannot transfer object of unsupported type") ||
    message.includes("Cannot clone object of unsupported type") ||
    message.includes("DataCloneError")
  );
}

function toExtractBuffer(bytes: ArrayBuffer | Buffer | Uint8Array): Buffer {
  if (Buffer.isBuffer(bytes)) {
    return Buffer.from(bytes);
  }
  if (bytes instanceof ArrayBuffer) {
    return Buffer.from(new Uint8Array(bytes));
  }
  return Buffer.from(bytes);
}

function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractPdfTextWithUnpdf(buf: Buffer): Promise<{
  text: string;
  totalPages?: number;
}> {
  const { extractText } = await import("unpdf");

  // Single unpdf pass — workers detach buffers; retries and multi-pass calls fail on Node 21+.
  try {
    const merged = await extractText(toWorkerSafePdfBytes(buf), { mergePages: true });
    const text = normalizeText(
      Array.isArray(merged.text) ? merged.text.join("\n\n") : String(merged.text ?? ""),
    );
    return { text, totalPages: merged.totalPages };
  } catch (error) {
    if (isPdfWorkerTransferError(error)) {
      return { text: "" };
    }
    throw error;
  }
}

async function extractPdfTextViaOpenAi(buf: Buffer, fileName: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return "";
  }
  if (buf.byteLength > PDF_OCR_MAX_BYTES) {
    return "";
  }

  const { createAssistantResponse } = await import("@/lib/ai-operating-assistant/openai-client");
  const model = process.env.OPENAI_DOCUMENT_OCR_MODEL?.trim() || "gpt-4o-mini";
  const base64 = buf.toString("base64");

  const response = await createAssistantResponse(
    {
      model,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_file",
              filename: fileName || "document.pdf",
              file_data: `data:application/pdf;base64,${base64}`,
              detail: "high",
            },
            {
              type: "input_text",
              text: "Extract all readable text from this PDF in natural reading order. Return plain text only with no commentary.",
            },
          ],
        },
      ],
    },
    { callSite: "lms.document-extract.pdf-ocr" },
  );

  return normalizeText(String((response as { output_text?: string }).output_text ?? ""));
}

async function extractPdfText(buf: Buffer, fileName: string): Promise<ExtractedDocument> {
  const unpdfResult = await extractPdfTextWithUnpdf(buf);
  if (unpdfResult.text.length >= 80) {
    return {
      text: unpdfResult.text,
      mimeType: "application/pdf",
      fileName,
      pageHint: unpdfResult.totalPages,
    };
  }

  // Scanned PDFs and pdf.js worker transfer failures — OpenAI reads the file directly.
  try {
    const ocrText = await extractPdfTextViaOpenAi(buf, fileName);
    if (ocrText.length >= 80) {
      return {
        text: ocrText,
        mimeType: "application/pdf",
        fileName,
      };
    }
  } catch (error) {
    if (!isPdfWorkerTransferError(error)) {
      throw error;
    }
  }

  if (unpdfResult.text.length > 0) {
    return {
      text: unpdfResult.text,
      mimeType: "application/pdf",
      fileName,
      pageHint: unpdfResult.totalPages,
    };
  }

  throw new Error(
    "Could not extract text from this PDF. Upload a text-based PDF or a Word (.docx) file, or use a smaller scanned document.",
  );
}

export async function extractTextFromBuffer(
  bytes: ArrayBuffer | Buffer | Uint8Array,
  fileName: string,
  mimeType?: string | null,
): Promise<ExtractedDocument> {
  const name = fileName || "document";
  const lower = name.toLowerCase();
  const mime = (mimeType || "").toLowerCase();
  const buf = toExtractBuffer(bytes);

  if (
    mime.includes("wordprocessingml") ||
    lower.endsWith(".docx") ||
    mime === "application/msword"
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: buf });
    const text = normalizeText(result.value || "");
    if (!text) throw new Error("Could not extract text from Word document.");
    return {
      text,
      mimeType: mime || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileName: name,
    };
  }

  if (mime.includes("pdf") || lower.endsWith(".pdf")) {
    return extractPdfText(buf, name);
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
