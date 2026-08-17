/**
 * Configure required CI checks on main (Track A item 5).
 *
 * Usage:
 *   GH_TOKEN=<admin-pat> node scripts/apply-github-branch-protection.mjs
 *   # or workflow_dispatch: .github/workflows/configure-branch-protection.yml
 */
const token = process.env.GH_TOKEN?.trim() || process.env.GITHUB_TOKEN?.trim() || "";
const repository = process.env.REPOSITORY?.trim() || process.env.GITHUB_REPOSITORY?.trim() || "";

if (!token) {
  console.error("GH_TOKEN or GITHUB_TOKEN is required.");
  process.exit(1);
}
if (!repository.includes("/")) {
  console.error("REPOSITORY or GITHUB_REPOSITORY must be owner/repo.");
  process.exit(1);
}

const [owner, repo] = repository.split("/");
const requiredContext = "Typecheck and build";

const payload = {
  required_status_checks: {
    strict: true,
    contexts: [requiredContext],
  },
  enforce_admins: false,
  required_pull_request_reviews: null,
  restrictions: null,
  allow_force_pushes: false,
  allow_deletions: false,
  block_creations: false,
  required_conversation_resolution: false,
};

const response = await fetch(
  `https://api.github.com/repos/${owner}/${repo}/branches/main/protection`,
  {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  },
);

const text = await response.text();
if (!response.ok) {
  console.error(`Branch protection update failed (${response.status}):`, text);
  process.exit(1);
}

console.log("Branch protection applied on main:");
console.log(text);
console.log(`Required status check: ${requiredContext}`);
