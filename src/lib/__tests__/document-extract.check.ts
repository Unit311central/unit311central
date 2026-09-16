/**
 * Document extract — PDF fallback strategies wired for LMS course generation.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.join(process.cwd(), "src/lib/document-extract.ts"), "utf8");

assert.match(
  source,
  /toWorkerSafePdfBytes\(buf\)/,
  "unpdf must receive a copied ArrayBuffer",
);
assert.match(source, /isPdfWorkerTransferError/, "pdf.js worker transfer errors must be caught");
assert.match(source, /extractPdfTextViaOpenAi/, "Scanned PDFs must fall back to OpenAI OCR");
assert.doesNotMatch(source, /extractTextItems/, "Do not multi-pass unpdf — workers detach buffers");
assert.match(
  source,
  /Could not extract text from this PDF/,
  "Empty PDF extraction must return actionable guidance",
);

console.log("ok  document-extract checks passed\n");
