"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  deleteManagementAction,
  deleteManagementFunctionPack,
  deleteManagementMeeting,
  getManagementServerSnapshot,
  getManagementState,
  resolveManagementWorkspaceSlug,
  subscribeManagement,
  uploadManagementFunctionPack,
  upsertManagementAction,
  upsertManagementFunctionPack,
  upsertManagementMeeting,
  type UpsertManagementActionInput,
  type UpsertManagementFunctionPackInput,
  type UpsertManagementMeetingInput,
} from "@/lib/central-capabilities/management-store";

export function useManagementStore() {
  const slug = resolveManagementWorkspaceSlug();

  const state = useSyncExternalStore(
    useCallback((listener) => subscribeManagement(slug, listener), [slug]),
    () => getManagementState(slug),
    () => getManagementServerSnapshot(slug),
  );

  return {
    slug,
    state,
    upsertMeeting: (input: UpsertManagementMeetingInput) => upsertManagementMeeting(slug, input),
    deleteMeeting: (id: string) => deleteManagementMeeting(slug, id),
    upsertFunctionPack: (input: UpsertManagementFunctionPackInput) =>
      upsertManagementFunctionPack(slug, input),
    uploadFunctionPack: (packId: string, fileName: string) =>
      uploadManagementFunctionPack(slug, packId, fileName),
    deleteFunctionPack: (id: string) => deleteManagementFunctionPack(slug, id),
    upsertAction: (input: UpsertManagementActionInput) => upsertManagementAction(slug, input),
    deleteAction: (id: string) => deleteManagementAction(slug, id),
  };
}
