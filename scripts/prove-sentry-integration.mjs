#!/usr/bin/env node
/**
 * Verify Sentry integration by sending a controlled test event.
 *
 * Usage (local dev server running on port 3000):
 *   SENTRY_DSN=... NEXT_PUBLIC_SENTRY_DSN=... INTERNAL_FILES_SETUP_SECRET=... \
 *     node scripts/prove-sentry-integration.mjs
 *
 * Optional:
 *   SENTRY_BASE_URL=http://127.0.0.1:3000
 *   SENTRY_ENABLE_TEST_ROUTE=1   (required when NODE_ENV=production)
 */
import process from "node:process";

const baseUrl = (process.env.SENTRY_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const secret = process.env.INTERNAL_FILES_SETUP_SECRET?.trim();
const dsn = process.env.SENTRY_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

if (!dsn) {
  console.error("Missing SENTRY_DSN or NEXT_PUBLIC_SENTRY_DSN.");
  process.exit(1);
}
if (!secret) {
  console.error("Missing INTERNAL_FILES_SETUP_SECRET for the controlled test route.");
  process.exit(1);
}

const response = await fetch(`${baseUrl}/api/internal/sentry-test`, {
  method: "POST",
  headers: {
    "x-setup-secret": secret,
    host: "internal.localhost",
  },
});

const text = await response.text();
let payload;
try {
  payload = JSON.parse(text);
} catch {
  payload = { raw: text };
}

console.log("HTTP", response.status, payload);

if (!response.ok) {
  process.exit(1);
}

console.log(
  "Controlled event dispatched. Confirm in Sentry Issues: message contains 'Unit311 Sentry controlled test event'.",
);
