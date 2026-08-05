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
  const stored = sanitizeOverviewContent(memoryContent());
  const defaults = defaultOnwardAirOverviewContent();
  return {
    ...stored,
    modules: defaults.modules,
    highlights: defaults.highlights,
    highlightsTitle: defaults.highlightsTitle,
    highlightsIntro: defaults.highlightsIntro,
    agenda: defaults.agenda,
    agendaTitle: defaults.agendaTitle,
    agendaIntro: defaults.agendaIntro,
  };
}

export async function writeOnwardAirOverviewContent(
  next: OnwardAirOverviewEditableContent,
): Promise<OnwardAirOverviewEditableContent> {
  const content = sanitizeOverviewContent(next);
  globalThis.__onwardAirOverviewPageContent = content;
  return content;
}
