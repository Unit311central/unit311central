/**
 * Sentry central monitoring config — Unit311 Central only.
 * Run: npm run prove:sentry-config
 */
import assert from "node:assert/strict";

import {
  buildSentryClientOptions,
  buildSentryEdgeOptions,
  buildSentryServerOptions,
  resolveSentryEnvironment,
  resolveSentryRelease,
} from "@/lib/sentry/config";
import { scrubSentryEvent } from "@/lib/sentry/scrub-event";
import { applySentryRequestContext } from "@/lib/sentry/request-context";
import type { ErrorEvent } from "@sentry/nextjs";

assert.equal(resolveSentryEnvironment(), "development");

const priorSha = process.env.VERCEL_GIT_COMMIT_SHA;
process.env.VERCEL_GIT_COMMIT_SHA = "abc123deadbeef";
assert.equal(resolveSentryRelease(), "abc123deadbeef");
if (priorSha === undefined) delete process.env.VERCEL_GIT_COMMIT_SHA;
else process.env.VERCEL_GIT_COMMIT_SHA = priorSha;

const server = buildSentryServerOptions();
assert.equal(server.tracesSampleRate, 0);
assert.equal(server.sendDefaultPii, false);
assert.equal(typeof server.beforeSend, "function");

const scrubbed = scrubSentryEvent({
  message: "Contact tom@unit311central.com",
  request: {
    cookies: { dc_platform_session: "secret" },
    headers: { Authorization: "Bearer secret" },
  },
  user: { email: "tom@unit311central.com", id: "user-1" },
  extra: { password: "hunter2" },
} as unknown as ErrorEvent);
assert.ok(scrubbed);
assert.equal(scrubbed.request?.cookies, undefined);
assert.equal(scrubbed.user?.email, undefined);
assert.equal(scrubbed.extra?.password, "[Filtered]");
assert.match(String(scrubbed.message), /\[redacted-email\]/);

applySentryRequestContext({ host: "internal.unit311central.com" });
applySentryRequestContext({ host: "onwardair.unit311central.com" });

assert.equal(buildSentryEdgeOptions().tracesSampleRate, 0);
assert.equal(buildSentryClientOptions().tracesSampleRate, 0);

console.log("sentry-config.check.ts: ok");
