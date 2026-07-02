#!/usr/bin/env node
/**
 * Copy Zoho env vars from Drone Catalyst to BCN Vercel (BCN mailbox addresses).
 * Reads password from ../dronecatalyst/.env.zoho.pull (vercel env pull).
 */
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const sourcePath = join(root, "..", "dronecatalyst", ".env.zoho.pull");

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function vercelEnvAdd(name, value, environment = "production") {
  const result = spawnSync(
    "npx",
    ["vercel", "env", "add", name, environment, "--yes"],
    {
      cwd: root,
      input: value,
      encoding: "utf8",
      shell: true,
    },
  );
  if (result.status !== 0) {
    const combined = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    if (/already exists/i.test(combined)) {
      console.log(`${name}: already set (skipped)`);
      return;
    }
    console.error(`Failed to set ${name}:`, combined);
    process.exit(1);
  }
  console.log(`${name}: set`);
}

const source = parseEnvFile(sourcePath);
const password = source.ZOHO_INFO_PASSWORD?.trim() || source.ZOHO_PAUL_PASSWORD?.trim();

if (!password) {
  console.error(`Missing ZOHO password in ${sourcePath}`);
  console.error("Run: cd ../dronecatalyst && npx vercel env pull .env.zoho.pull --environment=production");
  process.exit(1);
}

const targets = [
  ["ZOHO_INFO_EMAIL", "info@barcelonadronecenter.com"],
  ["ZOHO_INFO_PASSWORD", password],
  ["ZOHO_PAUL_EMAIL", "paul.fotheringham@barcelonadronecenter.com"],
  ["ZOHO_PAUL_PASSWORD", password],
];

for (const [name, value] of targets) {
  vercelEnvAdd(name, value);
}

console.log("Done. Redeploy BCN for env vars to take effect.");
