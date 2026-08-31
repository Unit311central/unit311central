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
  /saec_discovery_drafts_workspace_owner_unique/i,
  "draft migration must enforce one active draft per workspace owner",
);

const draftsService = fs.readFileSync(
  path.join(root, "src/lib/saec-discovery/drafts-service.ts"),
  "utf8",
);
assert.match(draftsService, /upsert\(payload/, "draft save must upsert one active draft");
assert.match(draftsService, /clearSaecDiscoveryDraftForOwner/, "draft service must clear active draft");
assert.match(
  draftsService,
  /owner_user_id: input\.ownerUserId/,
  "draft persistence must scope by owner user id",
);

const draftRoute = fs.readFileSync(
  path.join(root, "src/app/api/saec-discovery/draft/route.ts"),
  "utf8",
);
assert.match(draftRoute, /export async function GET/, "draft API must support GET");
assert.match(draftRoute, /export async function PUT/, "draft API must support PUT");
assert.match(draftRoute, /export async function DELETE/, "draft API must support DELETE");

const submitService = fs.readFileSync(
  path.join(root, "src/lib/saec-discovery/submissions-service.ts"),
  "utf8",
);
assert.match(
  submitService,
  /clearSaecDiscoveryDraftForOwner/,
  "submit must clear the active server draft",
);
assert.match(
  submitService,
  /getSaecDiscoveryFeedbackForInternal/,
  "internal feedback must load drafts and submissions together",
);
assert.match(
  submitService,
  /deleteSaecDiscoverySubmissionForInternal/,
  "internal feedback must support deleting submissions",
);
assert.match(
  submitService,
  /updateSaecDiscoverySubmissionForInternal/,
  "internal feedback must support editing submissions",
);

const internalSubmissionRoute = fs.readFileSync(
  path.join(root, "src/app/api/internal/saec-discovery/submissions/[id]/route.ts"),
  "utf8",
);
assert.match(internalSubmissionRoute, /export async function DELETE/, "internal submission route must support DELETE");
assert.match(internalSubmissionRoute, /export async function PATCH/, "internal submission route must support PATCH");

const app = fs.readFileSync(
  path.join(root, "src/components/saec-discovery/SaecDiscoveryApp.tsx"),
  "utf8",
);
assert.match(app, /AUTO_SAVE_DEBOUNCE_MS = 750/, "questionnaire must debounce auto-save at 750ms");
assert.doesNotMatch(app, /Save Draft/, "questionnaire must not expose Save Draft button");
assert.doesNotMatch(app, />Save</, "questionnaire must not expose section Save button");
assert.match(app, /\/api\/saec-discovery\/draft/, "questionnaire must persist drafts server-side");
const shell = fs.readFileSync(
  path.join(root, "src/components/saec-discovery/SaecDiscoveryShell.tsx"),
  "utf8",
);
assert.match(shell, /\/api\/saec-discovery\/access/, "shell must verify SAEC workspace access");

const accessService = fs.readFileSync(
  path.join(root, "src/lib/saec-discovery/access-service.ts"),
  "utf8",
);
assert.match(
  accessService,
  /authorizeUserForWorkspace/,
  "SAEC discovery access must require SAEC workspace authorization",
);

const feedback = fs.readFileSync(
  path.join(root, "src/components/testflighthub/SaecFeedbackWorkspace.tsx"),
  "utf8",
);
assert.match(feedback, /ListDivider label="Drafts"/, "SAEC Feedback must show Drafts section");
assert.match(feedback, /ListDivider label="Submissions"/, "SAEC Feedback must show Submissions section");
assert.match(feedback, /Last saved:/, "SAEC Feedback must label draft timestamps as Last saved");
assert.match(feedback, /Submitted:/, "SAEC Feedback must label submission timestamps as Submitted");
assert.match(feedback, /setSelection/, "SAEC Feedback must allow selecting a draft or submission");
assert.match(feedback, /Refresh/, "SAEC Feedback must provide a refresh control");
assert.match(feedback, /deleteSubmission/, "SAEC Feedback must support deleting submissions");
assert.match(feedback, /deleteDraft/, "SAEC Feedback must support removing drafts");

console.log("ok  saec-discovery-drafts checks passed\n");
