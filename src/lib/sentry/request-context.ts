import * as Sentry from "@sentry/nextjs";

import {
  isInternalDomainHost,
  parseClientPlatformSubdomainSafe,
} from "@/lib/app-domains";
import { isSentryEnabled } from "@/lib/sentry/config";
import { demoWorkspaceSlug, resolveRuntimeSurface } from "@/lib/runtime-surface";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";

export type SentryRequestContextInput = {
  host?: string | null;
  workspaceSlug?: string | null;
};

function resolveWorkspaceSlugFromHost(host: string | null | undefined): string | null {
  if (!host) return null;
  if (isInternalDomainHost(host)) return INTERNAL_WORKSPACE_SLUG;
  const customer = parseClientPlatformSubdomainSafe(host);
  if (customer) return customer;
  const surface = resolveRuntimeSurface(host);
  if (surface === "demo") return demoWorkspaceSlug();
  return null;
}

/** Attach non-sensitive tenancy tags for central Unit311 monitoring. */
export function applySentryRequestContext(input: SentryRequestContextInput = {}): void {
  if (!isSentryEnabled()) return;

  const host = input.host?.trim().toLowerCase() || null;
  const hostSurface = resolveRuntimeSurface(host);
  const workspaceSlug =
    input.workspaceSlug?.trim().toLowerCase() ||
    resolveWorkspaceSlugFromHost(host) ||
    undefined;

  Sentry.setTag("host_surface", hostSurface);
  if (workspaceSlug) {
    Sentry.setTag("workspace_slug", workspaceSlug);
  }
  if (hostSurface === "internal") {
    Sentry.setTag("unit311_control_plane", "internal");
  }

  Sentry.setContext("unit311", {
    host_surface: hostSurface,
    workspace_slug: workspaceSlug ?? null,
    internal_control_plane: hostSurface === "internal",
  });
}

/** Client-side tags from the browser hostname (no PII). */
export function applySentryBrowserRequestContext(): void {
  if (typeof window === "undefined" || !isSentryEnabled()) return;
  applySentryRequestContext({ host: window.location.hostname });
}
