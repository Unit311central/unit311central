/**
 * SAEC Discovery submissions — static checks for multi-submit behaviour.
 * Run: node --import tsx src/lib/__tests__/saec-discovery-submissions.check.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/187_saec_discovery_submissions_multiple.sql"),
  "utf8",
);
assert.match(
  migration,
  /drop constraint if exists saec_discovery_submissions_workspace_unique/i,
  "migration must drop workspace unique constraint",
);

const service = fs.readFileSync(
  path.join(root, "src/lib/saec-discovery/submissions-service.ts"),
  "utf8",
);
assert.match(service, /\.insert\(payload\)/, "submit must insert a new row");
assert.doesNotMatch(service, /\.upsert\(/, "submit must not upsert by workspace");
assert.match(
  service,
  /getSaecDiscoverySubmissionsForInternal/,
  "internal feedback must load all submissions",
);

const app = fs.readFileSync(
  path.join(root, "src/components/saec-discovery/SaecDiscoveryApp.tsx"),
  "utf8",
);
assert.doesNotMatch(
  app,
  /Submit again to update the stored response/,
  "client must not warn about overwriting submissions",
);
assert.doesNotMatch(app, /Save Draft/, "client must not expose Save Draft button");
assert.match(app, /kind === "reporting"\s*\?\s*"overflow-y-auto"/, "Reporting must allow vertical scroll in main panel");

const feedback = fs.readFileSync(
  path.join(root, "src/components/testflighthub/SaecFeedbackWorkspace.tsx"),
  "utf8",
);
assert.match(feedback, /submissions\.map/, "SAEC Feedback must render multiple submissions");
assert.match(feedback, /drafts\.map/, "SAEC Feedback must render server-side drafts");

console.log("ok  saec-discovery-submissions checks passed\n");
