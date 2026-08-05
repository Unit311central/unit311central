import {
  type OnwardAirOverviewEditableContent,
  defaultOnwardAirOverviewContent,
  sanitizeOverviewContent,
} from "@/lib/onwardair/overview-demo";

declare global {
  // Ambient `var` required for globalThis augmentation.
  var __onwardAirOverviewPageContent: OnwardAirOverviewEditableContent | undefined;
}

function memoryContent(): OnwardAirOverviewEditableContent {
  if (!globalThis.__onwardAirOverviewPageContent) {
    globalThis.__onwardAirOverviewPageContent = defaultOnwardAirOverviewContent();
  }
  return globalThis.__onwardAirOverviewPageContent;
}

export async function readOnwardAirOverviewContent(): Promise<OnwardAirOverviewEditableContent> {
  // Always prefer shipped defaults for invite-page copy so deploys are not stuck
  // behind a warm serverless memory blob from an older revision.
  const defaults = defaultOnwardAirOverviewContent();
  const stored = sanitizeOverviewContent(memoryContent());
  return {
    ...defaults,
    // Keep only non-invite fields from memory if ever needed later.
    modules: defaults.modules,
    previewHint: stored.previewHint || defaults.previewHint,
  };
}

export async function writeOnwardAirOverviewContent(
  next: OnwardAirOverviewEditableContent,
): Promise<OnwardAirOverviewEditableContent> {
  const content = sanitizeOverviewContent(next);
  globalThis.__onwardAirOverviewPageContent = content;
  return content;
}
