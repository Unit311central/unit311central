"use client";

import { useMemo, useState } from "react";
import {
  Briefcase,
  Building2,
  FileText,
  FolderKanban,
  Landmark,
  Layers,
  Megaphone,
  Palette,
  Scale,
  Settings2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  canEditContentStudioTemplates,
  getVisibleContentStudioFunctions,
  managementAccessFromEntitlements,
} from "@/lib/central-capabilities/access";
import { CONTENT_STUDIO_FUNCTIONS, getContentStudioTemplates } from "@/lib/central-capabilities/content-studio-placeholder";
import {
  CONTENT_STUDIO_FUNCTION_THEMES,
  contentStudioMediaKindLabel,
  getContentStudioMediaLibrary,
} from "@/lib/central-capabilities/content-studio-theme";
import type {
  ContentStudioFunctionId,
  ContentStudioMediaAsset,
  ContentStudioTemplatePlaceholder,
} from "@/lib/central-capabilities/types";
import {
  WorkspaceEmpty,
  WorkspaceSection,
  WorkspaceStatusPill,
  workspaceSecondaryButtonClass,
} from "@/components/workspace-ui";
import { useOperatorEntitlements } from "@/components/testflighthub/OperatorEntitlementsProvider";
import { cn } from "@/lib/utils";

import { ContentStudioCreateContent } from "./ContentStudioCreateContent";
import { useContentStudioStore } from "./useContentStudioStore";

const CONTENT_STUDIO_SUBTITLE =
  "Create and maintain approved company content from master templates — presentations, decks, and collateral.";

const FUNCTION_ICONS: Record<ContentStudioFunctionId, LucideIcon> = {
  corporate: Building2,
  management: Briefcase,
  fundraising: TrendingUp,
  sales: Megaphone,
  marketing: Palette,
  projects: FolderKanban,
  operations: Wrench,
  finance: Landmark,
  hr: Users,
  engineering: Settings2,
  qms: ShieldCheck,
  regulatory: Scale,
  administration: Sparkles,
};

function statusClass(status: string) {
  if (status === "approved") return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
  if (status === "review") return "border-amber-400/30 bg-amber-500/15 text-amber-100";
  return "border-white/15 bg-white/[0.05] text-white/60";
}

function mediaKindIcon(kind: ContentStudioMediaAsset["kind"]) {
  if (kind === "video") return "▶";
  if (kind === "document") return "PDF";
  if (kind === "logo") return "◎";
  if (kind === "deck") return "PPT";
  return "IMG";
}

function ContentStudioTemplateCard({
  template,
  theme,
  canEditTemplates,
  onCreate,
}: {
  template: ContentStudioTemplatePlaceholder;
  theme: (typeof CONTENT_STUDIO_FUNCTION_THEMES)[ContentStudioFunctionId];
  canEditTemplates: boolean;
  onCreate: () => void;
}) {
  const approved = template.status === "approved";

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-2xl border bg-[#0b1524]/80 transition-transform hover:-translate-y-0.5",
        theme.border,
      )}
    >
      <div className={cn("relative flex h-28 items-center justify-center", theme.swatch)}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.2),transparent_55%)]" />
        <Layers className="relative h-8 w-8 text-white/90" />
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">Master template</p>
            <h3 className="mt-1 text-sm font-semibold text-white">{template.name}</h3>
          </div>
          <WorkspaceStatusPill className={statusClass(template.status)}>{template.status}</WorkspaceStatusPill>
        </div>
        <p className="line-clamp-2 text-xs text-white/55">{template.description}</p>
        <p className="text-xs text-white/40">Updated {template.lastUpdated}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="button" className={workspaceSecondaryButtonClass()}>
            View template
          </button>
          <button type="button" className={workspaceSecondaryButtonClass()} onClick={onCreate}>
            Create content
          </button>
          {canEditTemplates && template.canEdit ? (
            <>
              <button type="button" className={workspaceSecondaryButtonClass()}>
                Edit
              </button>
              <button type="button" className={workspaceSecondaryButtonClass()}>
                Duplicate
              </button>
            </>
          ) : null}
        </div>
        {approved ? (
          <p className={cn("text-[10px] font-semibold uppercase tracking-wide", theme.accent)}>
            Approved for production use
          </p>
        ) : null}
      </div>
    </article>
  );
}

function ContentStudioMediaCard({
  asset,
  theme,
}: {
  asset: ContentStudioMediaAsset;
  theme: (typeof CONTENT_STUDIO_FUNCTION_THEMES)[ContentStudioFunctionId];
}) {
  return (
    <article
      className={cn(
        "group overflow-hidden rounded-2xl border bg-[#0b1524]/80 transition-transform hover:-translate-y-0.5",
        theme.border,
      )}
    >
      <div className={cn("relative flex h-28 items-center justify-center", theme.swatch)}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.22),transparent_55%)]" />
        <span className="relative rounded-full border border-white/25 bg-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
          {mediaKindIcon(asset.kind)}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-white">{asset.name}</h3>
          <WorkspaceStatusPill className="border-emerald-400/30 bg-emerald-500/15 text-emerald-100">
            Approved
          </WorkspaceStatusPill>
        </div>
        <p className="text-xs text-white/50">
          {contentStudioMediaKindLabel(asset.kind)} · {asset.format} · {asset.sizeLabel}
        </p>
        <p className="text-xs text-white/40">
          Approved {asset.approvedAt} · {asset.approvedBy}
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {asset.tags.map((tag) => (
            <span
              key={tag}
              className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide", theme.accentSoft, theme.accent)}
            >
              {tag}
            </span>
          ))}
        </div>
        <button type="button" className={cn(workspaceSecondaryButtonClass(), "mt-2 w-full sm:w-auto")}>
          Open asset
        </button>
      </div>
    </article>
  );
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
  const theme = selectedId ? CONTENT_STUDIO_FUNCTION_THEMES[selectedId] : null;
  const FunctionIcon = selectedId ? FUNCTION_ICONS[selectedId] : Building2;
  const templates = selectedId ? getContentStudioTemplates(selectedId) : [];
  const mediaLibrary = selectedId ? getContentStudioMediaLibrary(selectedId) : [];
  const savedForFunction = state.savedContent.filter(
    (row) => row.functionId === selectedId && row.status === "active",
  );
  const canEditTemplates = canEditContentStudioTemplates(access);

  if (createTemplate && selectedId) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-500/10 via-violet-500/5 to-transparent p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fuchsia-200/80">Content Studio</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Create content</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/55">{CONTENT_STUDIO_SUBTITLE}</p>
        </div>
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
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#07111f] p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_0%,rgba(168,85,247,0.16),transparent_55%),radial-gradient(ellipse_70%_50%_at_100%_0%,rgba(56,189,248,0.12),transparent_60%)]" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fuchsia-200/80">Business Productivity</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
            Content Studio
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/55">{CONTENT_STUDIO_SUBTITLE}</p>
        </div>
      </div>

      {visibleFunctions.length === 0 ? (
        <WorkspaceSection title="Content Studio" subtitle="Permission-aware content workspace.">
          <WorkspaceEmpty message="No Content Studio functions are visible for your role." />
        </WorkspaceSection>
      ) : (
        <>
          <nav
            aria-label="Content Studio functions"
            className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {visibleFunctions.map((node) => {
              const active = node.id === selectedId;
              const nodeTheme = CONTENT_STUDIO_FUNCTION_THEMES[node.id];
              const Icon = FUNCTION_ICONS[node.id];
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setActiveFunction(node.id)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                    active ? nodeTheme.tabActive : nodeTheme.tabIdle,
                  )}
                >
                  <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full", nodeTheme.swatch)}>
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </span>
                  {node.label}
                </button>
              );
            })}
          </nav>

          {selectedNode && theme ? (
            <div className="space-y-4">
              <div
                className={cn(
                  "relative overflow-hidden rounded-2xl border p-5 sm:p-6",
                  theme.border,
                  theme.glow,
                  "bg-gradient-to-r",
                  theme.heroGradient,
                )}
              >
                <div className="relative flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15",
                        theme.swatch,
                      )}
                    >
                      <FunctionIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className={cn("text-xs font-semibold uppercase tracking-[0.12em]", theme.accent)}>
                        {selectedNode.label} function
                      </p>
                      <h2 className="mt-1 text-xl font-semibold text-white">{selectedNode.label}</h2>
                      <p className="mt-1 max-w-2xl text-sm text-white/60">{selectedNode.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className={cn("rounded-xl border px-4 py-3 text-right", theme.border, theme.accentSoft)}>
                      <p className={cn("text-[10px] font-semibold uppercase tracking-wide", theme.accent)}>
                        Approved templates
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-white">{templates.length}</p>
                    </div>
                    <div className={cn("rounded-xl border px-4 py-3 text-right", theme.border, theme.accentSoft)}>
                      <p className={cn("text-[10px] font-semibold uppercase tracking-wide", theme.accent)}>
                        Media assets
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-white">{mediaLibrary.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              <WorkspaceSection
                title="Approved templates"
                subtitle="Master templates approved for this function — starting points for new content."
              >
                {templates.length === 0 ? (
                  <WorkspaceEmpty message="No templates are configured for this function yet." />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {templates.map((template) => (
                      <ContentStudioTemplateCard
                        key={template.id}
                        template={template}
                        theme={theme}
                        canEditTemplates={canEditTemplates}
                        onCreate={() => {
                          setCreateTemplate(template);
                          setEditContentId(null);
                        }}
                      />
                    ))}
                  </div>
                )}
              </WorkspaceSection>

              <WorkspaceSection
                title="Approved media library"
                subtitle="Brand-safe images, logos, documents, and decks approved for this function."
              >
                {mediaLibrary.length === 0 ? (
                  <WorkspaceEmpty message="No approved media assets for this function yet." />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {mediaLibrary.map((asset) => (
                      <ContentStudioMediaCard key={asset.id} asset={asset} theme={theme} />
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
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
