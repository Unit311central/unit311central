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
  "Each unpdf call must copy PDF bytes — workers detach the ArrayBuffer",
);
assert.match(source, /extractPdfTextWithUnpdf/, "PDF extraction must use unpdf fallback strategies");
assert.match(source, /extractTextItems/, "PDF extraction must fall back to structured text items");
assert.match(source, /extractPdfTextViaOpenAi/, "Scanned PDFs must attempt OpenAI OCR fallback");
assert.match(
  source,
  /Could not extract text from this PDF/,
  "Empty PDF extraction must return actionable guidance",
);

console.log("ok  document-extract checks passed\n");
