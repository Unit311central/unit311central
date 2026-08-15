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

export const TqmsSection = WorkspaceSection;
export const TqmsKpiTile = WorkspaceKpiTile;
export const TqmsStatusPill = WorkspaceStatusPill;
export const TqmsEmpty = WorkspaceEmpty;
export const TqmsSlideOver = WorkspaceSlideOver;

export function tqmsPrimaryButtonClass(disabled?: boolean) {
  return cn(workspacePrimaryButtonClass(disabled));
}

export function tqmsSecondaryButtonClass(disabled?: boolean) {
  return cn(workspaceSecondaryButtonClass(disabled));
}

export function tqmsInputClass() {
  return workspaceInputClass();
}

export function tqmsLabelClass() {
  return workspaceLabelClass();
}
