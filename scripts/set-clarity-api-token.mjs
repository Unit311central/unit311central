/**
 * Set CLARITY_API_TOKEN on Vercel Production (+ optional Preview).
 *
 * Usage:
 *   node scripts/set-clarity-api-token.mjs --token=YOUR_TOKEN
 *   $env:CLARITY_API_TOKEN="..."; node scripts/set-clarity-api-token.mjs
 *
 * Generate token: Clarity project → Settings → Data Export → Generate new API token
 * Project: https://clarity.microsoft.com/projects/view/xvt6yldo67/settings
 */
import { spawnSync } from "node:child_process";

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (arg.startsWith("--token=")) out.token = arg.slice("--token=".length);
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const token = (args.token || process.env.CLARITY_API_TOKEN || "").trim();
if (!token) {
  console.error(
    "Missing token. Pass --token=... or set CLARITY_API_TOKEN.\n" +
      "Create it in Clarity → Settings → Data Export for project xvt6yldo67.",
  );
  process.exit(1);
}

function setEnv(environment) {
  const result = spawnSync(
    "npx",
    ["vercel", "env", "add", "CLARITY_API_TOKEN", environment],
    {
      input: `${token}\n`,
      encoding: "utf8",
      shell: true,
    },
  );
  console.log(`--- ${environment} ---`);
  console.log(result.stdout || "");
  console.error(result.stderr || "");
  if (result.status !== 0) {
    console.error(`Failed to set CLARITY_API_TOKEN for ${environment}`);
    process.exit(result.status || 1);
  }
}

// Remove existing then add is safer, but vercel env add may prompt on conflict.
// Prefer force via remove + add.
for (const environment of ["production", "preview"]) {
  spawnSync("npx", ["vercel", "env", "rm", "CLARITY_API_TOKEN", environment, "-y"], {
    encoding: "utf8",
    shell: true,
  });
  setEnv(environment);
}

console.log("CLARITY_API_TOKEN configured. Redeploy Production for the API route to pick it up.");
