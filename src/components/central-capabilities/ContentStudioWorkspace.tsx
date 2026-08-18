"use client";

import { useMemo, useState } from "react";
import { ChevronRight, FileText, Layers } from "lucide-react";

import {
  canEditContentStudioTemplates,
  getVisibleContentStudioFunctions,
  managementAccessFromEntitlements,
} from "@/lib/central-capabilities/access";
import { CONTENT_STUDIO_FUNCTIONS, getContentStudioTemplates } from "@/lib/central-capabilities/content-studio-placeholder";
import type { ContentStudioFunctionId, ContentStudioTemplatePlaceholder } from "@/lib/central-capabilities/types";
import {
  WorkspaceEmpty,
  WorkspaceModuleHeader,
  WorkspaceSection,
  WorkspaceStatusPill,
  workspaceSecondaryButtonClass,
} from "@/components/workspace-ui";
import { useOperatorEntitlements } from "@/components/testflighthub/OperatorEntitlementsProvider";
import { cn } from "@/lib/utils";

import { centralSubnavAsideClass, centralSubnavItemClass } from "./CentralSubnavShell";
import { ContentStudioCreateContent } from "./ContentStudioCreateContent";
import { useContentStudioStore } from "./useContentStudioStore";

const CONTENT_STUDIO_SUBTITLE =
  "Create and maintain approved company content from master templates — presentations, decks, and collateral.";

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

  const { state, duplicateContent, archiveContent, deleteContent } = useContentStudioStore();
  const visibleFunctionIds = useMemo(() => getVisibleContentStudioFunctions(access), [access]);
  const visibleFunctions = useMemo(
    () => CONTENT_STUDIO_FUNCTIONS.filter((node) => visibleFunctionIds.includes(node.id)),
    [visibleFunctionIds],
  );

  const [activeFunction, setActiveFunction] = useState<ContentStudioFunctionId | null>(null);
  const [createTemplate, setCreateTemplate] = useState<ContentStudioTemplatePlaceholder | null>(null);
  const [editContentId, setEditContentId] = useState<string | null>(null);

  const selectedId = activeFunction ?? visibleFunctions[0]?.id ?? null;
  const selectedNode = visibleFunctions.find((node) => node.id === selectedId) ?? null;
  const templates = selectedId ? getContentStudioTemplates(selectedId) : [];
  const savedForFunction = state.savedContent.filter(
    (row) => row.functionId === selectedId && row.status === "active",
  );
  const canEditTemplates = canEditContentStudioTemplates(access);

  if (createTemplate && selectedId) {
    return (
      <div className="space-y-5">
        <WorkspaceModuleHeader title="Content Studio" description={CONTENT_STUDIO_SUBTITLE} />
        <ContentStudioCreateContent
          template={createTemplate}
          functionId={selectedId}
          existingContentId={editContentId}
          onClose={() => {
            setCreateTemplate(null);
            setEditContentId(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <WorkspaceModuleHeader title="Content Studio" description={CONTENT_STUDIO_SUBTITLE} />

      {visibleFunctions.length === 0 ? (
        <WorkspaceSection title="Content Studio" subtitle="Permission-aware content workspace.">
          <WorkspaceEmpty message="No Content Studio functions are visible for your role." />
        </WorkspaceSection>
      ) : (
        <div className="grid min-h-[36rem] gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <nav aria-label="Content Studio functions" className={cn(centralSubnavAsideClass(), "lg:min-h-[36rem]")}>
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
              <>
                <WorkspaceSection title={selectedNode.label} subtitle={selectedNode.description}>
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-white/45">
                    Master templates
                  </p>
                  {templates.length === 0 ? (
                    <WorkspaceEmpty message="No templates are configured for this function yet." />
                  ) : (
                    <div className="grid gap-3">
                      {templates.map((template) => (
                        <article
                          key={template.id}
                          className="rounded-xl border border-white/10 bg-[#0b1524]/80 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-white/40">
                                <Layers className="h-3.5 w-3.5" />
                                Master template
                              </div>
                              <h3 className="text-base font-semibold text-white">{template.name}</h3>
                              <p className="mt-1 max-w-2xl text-sm text-white/55">{template.description}</p>
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
                              View template
                            </button>
                            <button
                              type="button"
                              className={workspaceSecondaryButtonClass()}
                              onClick={() => {
                                setCreateTemplate(template);
                                setEditContentId(null);
                              }}
                            >
                              Create content
                            </button>
                            {canEditTemplates && template.canEdit ? (
                              <>
                                <button type="button" className={workspaceSecondaryButtonClass()}>
                                  Edit template
                                </button>
                                <button type="button" className={workspaceSecondaryButtonClass()}>
                                  Duplicate
                                </button>
                                <button type="button" className={workspaceSecondaryButtonClass()}>
                                  Archive
                                </button>
                              </>
                            ) : null}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </WorkspaceSection>

                <WorkspaceSection
                  title="Created content"
                  subtitle="Saved configurations derived from master templates — separate from the master assets."
                >
                  {savedForFunction.length === 0 ? (
                    <WorkspaceEmpty message="No saved content for this function yet. Create content from a master template above." />
                  ) : (
                    <div className="grid gap-3">
                      {savedForFunction.map((content) => (
                        <article
                          key={content.id}
                          className="rounded-xl border border-white/10 bg-[#0b1524]/80 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-200/70">
                                <FileText className="h-3.5 w-3.5" />
                                Created content
                              </div>
                              <h3 className="text-base font-semibold text-white">{content.name}</h3>
                              <p className="mt-1 text-sm text-white/55">
                                From template: {content.templateName} · {content.frequency}
                              </p>
                              <p className="mt-2 text-xs text-white/40">
                                {content.pages.filter((page) => page.enabled).length} active pages · Updated{" "}
                                {content.updatedAt.slice(0, 10)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              className={workspaceSecondaryButtonClass()}
                              onClick={() => {
                                const template = templates.find((row) => row.id === content.templateId);
                                if (!template) return;
                                setCreateTemplate(template);
                                setEditContentId(content.id);
                              }}
                            >
                              Open
                            </button>
                            <button
                              type="button"
                              className={workspaceSecondaryButtonClass()}
                              onClick={() => {
                                const template = templates.find((row) => row.id === content.templateId);
                                if (!template) return;
                                setCreateTemplate(template);
                                setEditContentId(content.id);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className={workspaceSecondaryButtonClass()}
                              onClick={() => duplicateContent(content.id)}
                            >
                              Duplicate
                            </button>
                            <button
                              type="button"
                              className={workspaceSecondaryButtonClass()}
                              onClick={() => archiveContent(content.id)}
                            >
                              Archive
                            </button>
                            <button
                              type="button"
                              className={workspaceSecondaryButtonClass()}
                              onClick={() => deleteContent(content.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </WorkspaceSection>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
