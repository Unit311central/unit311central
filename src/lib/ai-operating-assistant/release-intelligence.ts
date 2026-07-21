import type { ReleaseFeature, ReleaseIntelligence } from "./executive-types";

/**
 * Release Intelligence — newly deployed features for returning-user tours.
 * Uses existing guided learning for the actual walkthrough.
 */

export const RELEASE_FEATURES: ReleaseFeature[] = [
  {
    id: "ai-guided-learning",
    title: "AI Guided Learning",
    summary: "Interactive Show Me Around tours that highlight real UI controls.",
    releasedAt: "2026-07-20T00:00:00.000Z",
    tourViewId: "home",
    highlightTargetIds: ["home-tiles", "ai-assistant", "platform-nav"],
  },
  {
    id: "executive-operating-assistant",
    title: "Executive Operating Assistant",
    summary: "Daily briefs, smart insights, workflows, and business health scoring.",
    releasedAt: "2026-07-21T00:00:00.000Z",
    tourViewId: "executive-assistant",
    highlightTargetIds: ["ea-tour", "ea-chat", "ai-assistant"],
  },
  {
    id: "workflow-registry",
    title: "Workflow guidance",
    summary: "Ask to onboard a client or create a project and get step-by-step UI guidance.",
    releasedAt: "2026-07-21T00:00:00.000Z",
    tourViewId: "clients",
    highlightTargetIds: ["clients-add", "clients-table"],
  },
];

export const RELEASE_STORAGE_KEY = "unit311-release-last-seen";
export const RELEASE_LAST_VISIT_KEY = "unit311-last-platform-visit";

export function listReleaseFeatures(): ReleaseFeature[] {
  return [...RELEASE_FEATURES].sort(
    (a, b) => new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime(),
  );
}

export function featuresSince(isoTimestamp: string | null | undefined): ReleaseFeature[] {
  if (!isoTimestamp) return listReleaseFeatures();
  const since = new Date(isoTimestamp).getTime();
  if (!Number.isFinite(since)) return listReleaseFeatures();
  return listReleaseFeatures().filter((feature) => new Date(feature.releasedAt).getTime() > since);
}

export function buildReleaseIntelligence(lastSeenIso: string | null): ReleaseIntelligence {
  const unseen = featuresSince(lastSeenIso);
  const count = unseen.length;
  return {
    unseenFeatures: unseen,
    offerTour: count > 0,
    message:
      count === 0
        ? "You are up to date with the latest Unit311 Central features."
        : count === 1
          ? "One new feature has been added since your last visit. Would you like a 90-second guided tour?"
          : `${count} new features have been added since your last visit. Would you like a 90-second guided tour?`,
    tourViewId: unseen[0]?.tourViewId ?? "home",
  };
}

export function readLastSeenRelease(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(RELEASE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function markReleaseSeen(iso = new Date().toISOString()) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RELEASE_STORAGE_KEY, iso);
    window.localStorage.setItem(RELEASE_LAST_VISIT_KEY, iso);
  } catch {
    // ignore
  }
}

export function readLastPlatformVisit(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(RELEASE_LAST_VISIT_KEY);
  } catch {
    return null;
  }
}

export function markPlatformVisit(iso = new Date().toISOString()) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RELEASE_LAST_VISIT_KEY, iso);
  } catch {
    // ignore
  }
}
