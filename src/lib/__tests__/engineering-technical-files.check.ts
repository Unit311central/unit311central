/**
 * Engineering Technical Files product capability checks.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  classifyTechnicalFile,
  inferCategoryFromKind,
  isModelViewerFormat,
  isThreeJsModelFormat,
  supportsBrowserPreview,
} from "@/lib/engineering-technical-files/file-types";
import { UNIT311_PENDING_MIGRATIONS } from "@/lib/unit311-pending-migrations";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/158_engineering_technical_files.sql"),
  "utf8",
);
assert.match(migration, /engineering_technical_files/);
assert.match(migration, /engineering_technical_file_versions/);
assert.match(migration, /engineering_masters/);
assert.match(migration, /workspace_id uuid not null/);

assert.ok(
  UNIT311_PENDING_MIGRATIONS.includes("supabase/migrations/158_engineering_technical_files.sql"),
  "migration 158 must be in pending migrations allowlist",
);

const pdf = classifyTechnicalFile("drawing.pdf");
assert.equal(pdf.preview, "native");
assert.equal(pdf.kind, "pdf");

const step = classifyTechnicalFile("part.step");
assert.equal(step.preview, "download_only");
assert.equal(step.kind, "cad");

const stl = classifyTechnicalFile("model.stl");
assert.equal(stl.preview, "native");
assert.ok(isThreeJsModelFormat("stl"));
assert.ok(isModelViewerFormat("glb"));
assert.ok(supportsBrowserPreview("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"));
assert.equal(supportsBrowserPreview("step"), false);

assert.equal(inferCategoryFromKind("cad"), "CAD");
assert.equal(inferCategoryFromKind("model_3d"), "3D Model");

const navCentral = readFileSync(
  join(process.cwd(), "src/lib/platform-workspaces/central-product-nav.ts"),
  "utf8",
);
assert.match(navCentral, /Technical Files/);
assert.match(navCentral, /engineering-technical-files/);
assert.doesNotMatch(navCentral, /interfaceworx/i);
assert.doesNotMatch(navCentral, /onwardair.*technical files/i);

const access = readFileSync(join(process.cwd(), "src/lib/access-presets.ts"), "utf8");
assert.match(access, /engineering-technical-files/);

const dashboard = readFileSync(
  join(process.cwd(), "src/components/testflighthub/InternalOperationsDashboard.tsx"),
  "utf8",
);
assert.match(dashboard, /engineering-technical-files/);
assert.match(dashboard, /EngineeringTechnicalFilesWorkspace/);

const service = readFileSync(
  join(process.cwd(), "src/lib/engineering-technical-files/service.ts"),
  "utf8",
);
assert.match(service, /eq\("workspace_id", ws\)/);
assert.match(service, /engineering_technical_file_events/);
assert.match(service, /is_current: false/);
assert.match(service, /INTERNAL_FILES_BUCKET/);

console.log("ok  engineering-technical-files checks passed\n");
