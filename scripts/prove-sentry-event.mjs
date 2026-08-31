#!/usr/bin/env node
/**
 * Send a controlled Sentry test event directly (no HTTP server required).
 *
 * Usage:
 *   SENTRY_DSN=https://... node scripts/prove-sentry-event.mjs
 *
 * Confirms the DSN reaches Sentry ingest when credentials are provided.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
if (!dsn) {
  console.error("Set SENTRY_DSN or NEXT_PUBLIC_SENTRY_DSN to verify ingest.");
  process.exit(1);
}

const release = process.env.SENTRY_RELEASE?.trim() || process.env.VERCEL_GIT_COMMIT_SHA?.trim();

Sentry.init({
  dsn,
  environment: process.env.SENTRY_ENVIRONMENT?.trim() || "development",
  release,
  tracesSampleRate: 0,
  sendDefaultPii: false,
});

Sentry.setTag("host_surface", "internal");
Sentry.setTag("workspace_slug", "unit311");
Sentry.setTag("unit311_control_plane", "internal");
Sentry.setTag("sentry_test", "controlled");

Sentry.captureException(new Error("Unit311 Sentry controlled test event (direct SDK)"), {
  extra: { purpose: "post-integration verification", script: "prove-sentry-event.mjs" },
});

const flushed = await Sentry.flush(5000);
console.log("flush:", flushed);
console.log(
  "If flush is true, check Sentry Issues for 'Unit311 Sentry controlled test event (direct SDK)'.",
);
process.exit(flushed ? 0 : 1);
