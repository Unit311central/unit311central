import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 0) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(resolve(process.cwd(), ".env.local"));
loadEnv(resolve(process.cwd(), ".env.deploy.pull"));

const secret = process.env.INTERNAL_FILES_SETUP_SECRET;
if (!secret) {
  console.error("Missing INTERNAL_FILES_SETUP_SECRET");
  process.exit(1);
}

const url =
  process.env.MIGRATION_APPLY_URL ||
  "https://internal.unit311central.com/api/internal/apply-unit311central-pending-migrations";

const response = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
  },
  body: "{}",
});

const text = await response.text();
console.log(response.status, text.slice(0, 4000));
if (!response.ok) process.exit(1);
