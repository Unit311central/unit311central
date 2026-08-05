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
  // Always prefer the latest module order from defaults for the invite page.
  // Editable copy (headline/questions/etc.) still comes from memory when present.
  const stored = sanitizeOverviewContent(memoryContent());
  const defaults = defaultOnwardAirOverviewContent();
  return {
    ...stored,
    modules: defaults.modules,
  };
}

export async function writeOnwardAirOverviewContent(
  next: OnwardAirOverviewEditableContent,
): Promise<OnwardAirOverviewEditableContent> {
  const content = sanitizeOverviewContent(next);
  globalThis.__onwardAirOverviewPageContent = content;
  return content;
}
