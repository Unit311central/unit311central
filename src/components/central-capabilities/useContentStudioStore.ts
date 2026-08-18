"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  applyContentStudioAssistantPrompt,
  archiveContentStudioContent,
  deleteContentStudioContent,
  duplicateContentStudioContent,
  getContentStudioServerSnapshot,
  getContentStudioState,
  resolveContentStudioWorkspaceSlug,
  subscribeContentStudio,
  upsertContentStudioContent,
  type UpsertContentStudioContentInput,
} from "@/lib/central-capabilities/content-studio-store";

export function useContentStudioStore() {
  const slug = resolveContentStudioWorkspaceSlug();

  const state = useSyncExternalStore(
    useCallback((listener) => subscribeContentStudio(slug, listener), [slug]),
    () => getContentStudioState(slug),
    () => getContentStudioServerSnapshot(slug),
  );

  return {
    slug,
    state,
    upsertContent: (input: UpsertContentStudioContentInput) => upsertContentStudioContent(slug, input),
    duplicateContent: (id: string) => duplicateContentStudioContent(slug, id),
    archiveContent: (id: string) => archiveContentStudioContent(slug, id),
    deleteContent: (id: string) => deleteContentStudioContent(slug, id),
    applyAssistantPrompt: applyContentStudioAssistantPrompt,
  };
}
