/**
 * Prove GitHub main branch protection requires Web CI (Track A item 5).
 *
 * Usage:
 *   npm run prove:branch-protection
 *   GH_TOKEN=<read-token> node scripts/prove-github-branch-protection.mjs
 */
const token = process.env.GH_TOKEN?.trim() || process.env.GITHUB_TOKEN?.trim() || "";
const repository = process.env.REPOSITORY?.trim() || "Unit311central/unit311central";
const requiredContext = "Typecheck and build";

if (!token) {
  console.error(
    "prove:branch-protection: GH_TOKEN not set — cannot verify GitHub API. " +
      "Run .github/workflows/configure-branch-protection.yml (workflow_dispatch) once, " +
      "or set GH_TOKEN with repo admin scope.",
  );
  process.exit(1);
}

const [owner, repo] = repository.split("/");
const response = await fetch(
  `https://api.github.com/repos/${owner}/${repo}/branches/main/protection`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  },
);

if (response.status === 404) {
  console.error("prove:branch-protection: FAILED — main has no branch protection configured.");
  process.exit(1);
}

if (!response.ok) {
  const text = await response.text();
  console.error(`prove:branch-protection: GitHub API ${response.status}: ${text}`);
  process.exit(1);
}

const protection = await response.json();
const contexts =
  protection?.required_status_checks?.contexts ??
  protection?.required_status_checks?.checks?.map((check) => check.context) ??
  [];

if (!contexts.includes(requiredContext)) {
  console.error(
    `prove:branch-protection: FAILED — missing required check "${requiredContext}". ` +
      `Found: ${contexts.join(", ") || "(none)"}`,
  );
  process.exit(1);
}

console.log(`prove:branch-protection: OK — main requires "${requiredContext}"`);
