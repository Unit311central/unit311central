import type { BrowserOptions, EdgeOptions, NodeOptions } from "@sentry/nextjs";

import { scrubSentryEvent } from "@/lib/sentry/scrub-event";

/** Server-side DSN (preferred). Falls back to public DSN when set. */
export function getSentryDsn(): string | undefined {
  const dsn =
    process.env.SENTRY_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  return dsn || undefined;
}

export function isSentryEnabled(): boolean {
  return Boolean(getSentryDsn());
}

/**
 * Sentry `environment` — Vercel tier when deployed, otherwise Node env.
 * Internal vs workspace traffic is tagged separately (`host_surface`, `workspace_slug`).
 */
export function resolveSentryEnvironment(): string {
  const vercelEnv = process.env.VERCEL_ENV?.trim();
  if (vercelEnv === "production" || vercelEnv === "preview") return vercelEnv;
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

/** Git commit SHA from Vercel, or explicit override for local prove runs. */
export function resolveSentryRelease(): string | undefined {
  const override = process.env.SENTRY_RELEASE?.trim();
  if (override) return override;
  const sha = process.env.VERCEL_GIT_COMMIT_SHA?.trim();
  return sha || undefined;
}

function sharedInitOptions(): Pick<
  NodeOptions & BrowserOptions & EdgeOptions,
  "dsn" | "enabled" | "environment" | "release" | "tracesSampleRate" | "beforeSend"
> {
  return {
    dsn: getSentryDsn(),
    enabled: isSentryEnabled(),
    environment: resolveSentryEnvironment(),
    release: resolveSentryRelease(),
    // Error monitoring only — no performance/trace volume until Platform Intelligence needs it.
    tracesSampleRate: 0,
    beforeSend(event) {
      return scrubSentryEvent(event);
    },
  };
}

export function buildSentryServerOptions(): NodeOptions {
  return {
    ...sharedInitOptions(),
    // Avoid sending request bodies / cookies from API routes by default.
    sendDefaultPii: false,
  };
}

export function buildSentryEdgeOptions(): EdgeOptions {
  return {
    ...sharedInitOptions(),
    sendDefaultPii: false,
  };
}

export function buildSentryClientOptions(): BrowserOptions {
  return {
    ...sharedInitOptions(),
    sendDefaultPii: false,
  };
}
