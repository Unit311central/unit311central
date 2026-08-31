/**
 * SAEC Discovery drafts — static checks for server-side draft persistence.
 * Run: node --import tsx src/lib/__tests__/saec-discovery-drafts.check.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/188_saec_discovery_drafts.sql"),
  "utf8",
);
assert.match(
  migration,
  /saec_discovery_drafts_workspace_user_unique/i,
  "drafts must enforce one active draft per user per workspace",
);

const draftService = fs.readFileSync(
  path.join(root, "src/lib/saec-discovery/draft-service.ts"),
  "utf8",
);
assert.match(draftService, /upsertSaecDiscoveryDraft/, "draft service must upsert drafts");
assert.match(draftService, /clearSaecDiscoveryDraft/, "draft service must clear drafts");
assert.match(
  draftService,
  /onConflict: "workspace_id,platform_user_id"/,
  "draft upsert must update the same row",
);

const draftRoute = fs.readFileSync(
  path.join(root, "src/app/api/saec-discovery/draft/route.ts"),
  "utf8",
);
assert.match(draftRoute, /export async function GET/, "draft API must support GET");
assert.match(draftRoute, /export async function PUT/, "draft API must support PUT");
assert.match(draftRoute, /export async function DELETE/, "draft API must support DELETE");

const submitRoute = fs.readFileSync(
  path.join(root, "src/app/api/saec-discovery/submit/route.ts"),
  "utf8",
);
assert.match(submitRoute, /clearSaecDiscoveryDraft/, "submit must clear active draft");

const feedbackRoute = fs.readFileSync(
  path.join(root, "src/app/api/internal/saec-discovery/feedback/route.ts"),
  "utf8",
);
assert.match(feedbackRoute, /getSaecDiscoveryDraftsForInternal/, "feedback API must return drafts");

const app = fs.readFileSync(
  path.join(root, "src/components/saec-discovery/SaecDiscoveryApp.tsx"),
  "utf8",
);
assert.doesNotMatch(app, /Save Draft/, "questionnaire must not expose Save Draft button");
assert.doesNotMatch(app, /<Save /, "questionnaire must not import Save icon for manual saves");
assert.match(app, /SERVER_SAVE_DEBOUNCE_MS = 750/, "auto-save must debounce ~750ms");
assert.match(app, /\/api\/saec-discovery\/draft/, "questionnaire must persist drafts server-side");

const feedback = fs.readFileSync(
  path.join(root, "src/components/testflighthub/SaecFeedbackWorkspace.tsx"),
  "utf8",
);
assert.match(feedback, /Drafts/, "feedback page must show drafts section");
assert.match(feedback, /Submissions/, "feedback page must show submissions section");
assert.match(feedback, /Last saved:/, "drafts must show last saved timestamp");
assert.match(feedback, /selectedDraft \? <ResponseBody/, "feedback must render only the selected draft");
assert.match(feedback, /selectedSubmission \? <ResponseBody/, "feedback must render only the selected submission");

console.log("ok  saec-discovery-drafts checks passed\n");
