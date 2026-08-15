"use client";

import { cn } from "@/lib/utils";

import {
  WorkspaceEmpty,
  WorkspaceKpiTile,
  WorkspaceSection,
  WorkspaceSlideOver,
  WorkspaceStatusPill,
  workspaceInputClass,
  workspaceLabelClass,
  workspacePrimaryButtonClass,
  workspaceSecondaryButtonClass,
} from "@/components/workspace-ui";

export const WsSection = WorkspaceSection;
export const WsKpiTile = WorkspaceKpiTile;
export const WsStatusPill = WorkspaceStatusPill;
export const WsEmpty = WorkspaceEmpty;
export const WsSlideOver = WorkspaceSlideOver;

export function WsPrimaryButtonClass(disabled?: boolean) {
  return cn(workspacePrimaryButtonClass(disabled));
}

export function WsSecondaryButtonClass(disabled?: boolean) {
  return cn(workspaceSecondaryButtonClass(disabled));
}

export function WsInputClass() {
  return workspaceInputClass();
}

export function WsLabelClass() {
  return workspaceLabelClass();
}
