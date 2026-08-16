"use client";

import type { ReactNode } from "react";

import {
  WorkspaceModuleHeader,
  WorkspaceSection,
  workspacePrimaryButtonClass,
  workspaceSecondaryButtonClass,
  type WorkspaceUiThemeId,
} from "@/components/workspace-ui";

export function CentralMarketingShell({
  title,
  description,
  moduleLabel,
  brandLabel,
  themeId,
  readOnly = false,
  actions,
  children,
}: {
  title: string;
  description: string;
  moduleLabel?: string;
  brandLabel?: string;
  themeId?: WorkspaceUiThemeId;
  readOnly?: boolean;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-5">
      <WorkspaceModuleHeader
        brandLabel={brandLabel}
        moduleLabel={moduleLabel}
        title={title}
        description={description}
        actions={actions}
        themeId={themeId}
      />
      {readOnly ? (
        <p className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-100/90">
          Read-only workspace provider view.
        </p>
      ) : null}
      {children}
    </div>
  );
}

export function CentralEntityList({
  title,
  emptyMessage,
  children,
}: {
  title: string;
  emptyMessage: string;
  children: ReactNode;
}) {
  return (
    <WorkspaceSection title={title}>
      {children ?? (
        <p className="text-sm text-white/45">{emptyMessage}</p>
      )}
    </WorkspaceSection>
  );
}

export { workspacePrimaryButtonClass, workspaceSecondaryButtonClass };
