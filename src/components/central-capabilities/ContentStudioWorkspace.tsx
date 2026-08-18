"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Presentation } from "lucide-react";

import {
  canEditContentStudioTemplates,
  getVisibleContentStudioFunctions,
  managementAccessFromEntitlements,
} from "@/lib/central-capabilities/access";
import { CONTENT_STUDIO_FUNCTIONS, getContentStudioTemplates } from "@/lib/central-capabilities/content-studio-placeholder";
import type { ContentStudioFunctionId } from "@/lib/central-capabilities/types";
import {
  WorkspaceEmpty,
  WorkspaceKpiTile,
  WorkspaceModuleHeader,
  WorkspaceSection,
  WorkspaceStatusPill,
  workspaceSecondaryButtonClass,
} from "@/components/workspace-ui";
import { useOperatorEntitlements } from "@/components/testflighthub/OperatorEntitlementsProvider";
import { cn } from "@/lib/utils";

import {
  centralSubnavAsideClass,
  centralSubnavItemClass,
  ComingSoonButton,
  PlaceholderBadge,
} from "./CentralSubnavShell";

function statusClass(status: string) {
  if (status === "approved") return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
  if (status === "review") return "border-amber-400/30 bg-amber-500/15 text-amber-100";
  return "border-white/15 bg-white/[0.05] text-white/60";
}

export default function ContentStudioWorkspace() {
  const entitlements = useOperatorEntitlements();
  const access = useMemo(
    () =>
      managementAccessFromEntitlements({
        roleView: entitlements.roleView,
        roles: entitlements.roles,
        departments: entitlements.departments,
      }),
    [entitlements.departments, entitlements.roleView, entitlements.roles],
  );

  const visibleFunctionIds = useMemo(
    () => getVisibleContentStudioFunctions(access),
    [access],
  );
  const visibleFunctions = useMemo(
    () => CONTENT_STUDIO_FUNCTIONS.filter((node) => visibleFunctionIds.includes(node.id)),
    [visibleFunctionIds],
  );

  const [activeFunction, setActiveFunction] = useState<ContentStudioFunctionId | null>(null);
  const selectedId = activeFunction ?? visibleFunctions[0]?.id ?? null;
  const selectedNode = visibleFunctions.find((node) => node.id === selectedId) ?? null;
  const templates = selectedId ? getContentStudioTemplates(selectedId) : [];
  const canEdit = canEditContentStudioTemplates(access);

  return (
    <div className="space-y-5">
      <WorkspaceModuleHeader
        brandLabel="Unit311 Central"
        moduleLabel="Business Productivity"
        title="Content Studio"
        description="Approved templates for professional, on-brand presentations and marketing collateral. Central capability across workspaces — board decks remain in Board."
      />

      {visibleFunctions.length === 0 ? (
        <WorkspaceSection title="Content Studio" subtitle="Permission-aware template library.">
          <WorkspaceEmpty message="No Content Studio functions are visible for your role. Contact an administrator if you need access." />
        </WorkspaceSection>
      ) : (
        <div className="grid min-h-[32rem] gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <nav aria-label="Content Studio functions" className={centralSubnavAsideClass()}>
            <p className="px-1 pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/50">
              Functions
            </p>
            <ul className="space-y-1">
              {visibleFunctions.map((node) => {
                const active = node.id === selectedId;
                return (
                  <li key={node.id}>
                    <button
                      type="button"
                      onClick={() => setActiveFunction(node.id)}
                      className={centralSubnavItemClass(active)}
                    >
                      <span className="min-w-0 flex-1 truncate">{node.label}</span>
                      {active ? <ChevronRight className="h-4 w-4 shrink-0 opacity-70" /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="min-w-0 space-y-4">
            {selectedNode ? (
              <WorkspaceSection
                title={selectedNode.label}
                subtitle={selectedNode.description}
                actions={<PlaceholderBadge>Templates placeholder</PlaceholderBadge>}
              >
                <div className="mb-4 grid gap-3 sm:grid-cols-3">
                  <WorkspaceKpiTile label="Templates" value={String(templates.length)} />
                  <WorkspaceKpiTile
                    label="Approved"
                    value={String(templates.filter((t) => t.status === "approved").length)}
                  />
                  <WorkspaceKpiTile label="Output types" value="Presentations · Collateral" />
                </div>

                <div className="mb-3 flex items-center gap-2 text-sm text-white/55">
                  <Presentation className="h-4 w-4" />
                  Templates available for {selectedNode.label}
                </div>

                <div className="grid gap-3">
                  {templates.map((template) => (
                    <article
                      key={template.id}
                      className="rounded-xl border border-white/10 bg-[#0b1524]/80 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-white">{template.name}</h3>
                          <p className="mt-1 max-w-2xl text-sm text-white/55">
                            {template.description}
                          </p>
                          <p className="mt-2 text-xs text-white/40">
                            Last updated: {template.lastUpdated}
                          </p>
                        </div>
                        <WorkspaceStatusPill className={statusClass(template.status)}>
                          {template.status}
                        </WorkspaceStatusPill>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" className={workspaceSecondaryButtonClass()}>
                          View
                        </button>
                        {canEdit && template.canEdit ? (
                          <button type="button" className={workspaceSecondaryButtonClass()}>
                            Edit
                          </button>
                        ) : null}
                        <ComingSoonButton label="Generate" />
                      </div>
                    </article>
                  ))}
                </div>
              </WorkspaceSection>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
