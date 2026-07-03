#!/usr/bin/env node
/**
 * Configure Zoho Mail env vars on the unit311 Vercel project.
 * Password is read from UNIT311_ZOHO_PASSWORD — never commit credentials.
 */
import { spawnSync } from "node:child_process";
import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const password = process.env.UNIT311_ZOHO_PASSWORD?.trim();
if (!password) {
  console.error("Set UNIT311_ZOHO_PASSWORD before running this script.");
  process.exit(1);
}

function vercelEnvAdd(name, value, environment = "production") {
  const tmp = join(root, ".unit311-zoho-env-tmp");
  writeFileSync(tmp, value, "utf8");
  try {
    const result = spawnSync(
      "cmd",
      ["/c", `type "${tmp}" | npx vercel env add ${name} ${environment} --force --yes`],
      { cwd: root, encoding: "utf8", shell: false },
    );
    const combined = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    if (result.status !== 0 && !/already exists/i.test(combined)) {
      console.error(`Failed to set ${name}:`, combined);
      process.exit(1);
    }
    console.log(`${name}: set`);
  } finally {
    if (existsSync(tmp)) unlinkSync(tmp);
  }
}

console.log("Linking unit311 project…");
spawnSync("npx", ["vercel", "link", "--project", "unit311", "--yes"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

const targets = [
  ["ZOHO_INFO_EMAIL", "info@unit311central.com"],
  ["ZOHO_INFO_PASSWORD", password],
  ["ZOHO_IMAP_HOST", "imap.zoho.eu"],
  ["ZOHO_SMTP_HOST", "smtp.zoho.eu"],
  ["ZOHO_IMAP_PORT", "993"],
  ["ZOHO_SMTP_PORT", "465"],
];

for (const [name, value] of targets) {
  vercelEnvAdd(name, value);
}

console.log("Redeploying unit311 production…");
spawnSync("npx", ["vercel", "--prod", "--yes"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

console.log("Done. Mailbox: info@unit311central.com");
