import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import {
  isPlatformDefaultDocumentLogoSlug,
  resolveWorkspaceDocumentLogoPreview,
  UNIT311_DOCUMENT_LOGO_PNG_PATH,
  UNIT311_DOCUMENT_LOGO_SVG_PATH,
} from "@/lib/workspace-document-logo-data";

assert.equal(isPlatformDefaultDocumentLogoSlug("unit311"), true);
assert.equal(isPlatformDefaultDocumentLogoSlug("onwardair"), false);

const preview = resolveWorkspaceDocumentLogoPreview({
  workspaceSlug: "unit311",
  record: { storagePath: null },
});
assert.equal(preview.previewUrl, UNIT311_DOCUMENT_LOGO_SVG_PATH);
assert.equal(preview.isDefault, true);

const svgPath = join(process.cwd(), "public", UNIT311_DOCUMENT_LOGO_SVG_PATH.replace(/^\//, ""));
const pngPath = join(process.cwd(), "public", UNIT311_DOCUMENT_LOGO_PNG_PATH.replace(/^\//, ""));
assert.ok(existsSync(svgPath));
assert.ok(existsSync(pngPath));
const png = readFileSync(pngPath);
assert.ok(png.length > 10_000);
assert.equal(png[0], 0x89);

console.log("ok  workspace-document-logo");
