"use client";

import { useMemo, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Plus, Sparkles, Trash2 } from "lucide-react";

import {
  CONTENT_STUDIO_PAGE_PRESETS,
  DEFAULT_CFO_MANAGEMENT_PAGES,
} from "@/lib/central-capabilities/content-studio-placeholder";
import type { ContentStudioPageConfig, ContentStudioTemplatePlaceholder } from "@/lib/central-capabilities/types";
import {
  WorkspaceSection,
  workspaceInputClass,
  workspaceSecondaryButtonClass,
} from "@/components/workspace-ui";
import { cn } from "@/lib/utils";

import {
  applyContentStudioAssistantPrompt,
  type UpsertContentStudioContentInput,
} from "@/lib/central-capabilities/content-studio-store";

import { useContentStudioStore } from "./useContentStudioStore";

function newPageId() {
  return `page-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function ContentStudioCreateContent({
  template,
  functionId,
  existingContentId,
  onClose,
  onSaved,
}: {
  template: ContentStudioTemplatePlaceholder;
  functionId: string;
  existingContentId?: string | null;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { state, upsertContent, applyAssistantPrompt } = useContentStudioStore();
  const existing = useMemo(
    () => state.savedContent.find((row) => row.id === existingContentId) ?? null,
    [existingContentId, state.savedContent],
  );

  const defaultPages =
    template.id === "mgmt-cfo"
      ? DEFAULT_CFO_MANAGEMENT_PAGES.map((page) => ({ ...page }))
      : [{ id: newPageId(), label: "Executive Summary", enabled: true }];

  const [name, setName] = useState(existing?.name ?? "");
  const [frequency, setFrequency] = useState(existing?.frequency ?? "Weekly");
  const [pages, setPages] = useState<ContentStudioPageConfig[]>(
    existing?.pages.map((page) => ({ ...page })) ?? defaultPages,
  );
  const [assistantPrompt, setAssistantPrompt] = useState("");
  const [assistantNote, setAssistantNote] = useState<string | null>(null);

  function movePage(index: number, direction: -1 | 1) {
    setPages((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  }

  function togglePage(id: string) {
    setPages((current) =>
      current.map((page) => (page.id === id ? { ...page, enabled: !page.enabled } : page)),
    );
  }

  function removePage(id: string) {
    setPages((current) => current.filter((page) => page.id !== id));
  }

  function addPage(label: string) {
    setPages((current) => [...current, { id: newPageId(), label, enabled: true }]);
  }

  function runAssistant(event: FormEvent) {
    event.preventDefault();
    const updated = applyAssistantPrompt(pages, assistantPrompt);
    setPages(updated);
    setAssistantNote("Assistant updated the page configuration for this demo.");
    setAssistantPrompt("");
  }

  function saveContent(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    upsertContent({
      id: existing?.id,
      templateId: template.id,
      templateName: template.name,
      functionId: functionId as UpsertContentStudioContentInput["functionId"],
      name: name.trim(),
      frequency: frequency.trim(),
      pages,
    });
    onSaved?.();
    onClose();
  }

  return (
    <WorkspaceSection
      title="Create content"
      subtitle="Configure structured content from a master template. This does not modify the master template."
      actions={
        <button type="button" className={workspaceSecondaryButtonClass()} onClick={onClose}>
          Back to templates
        </button>
      }
    >
      <form onSubmit={saveContent} className="space-y-5">
        <div className="grid gap-4 rounded-xl border border-white/10 bg-[#0b1524]/80 p-4 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">Template</p>
            <p className="mt-1 text-sm font-medium text-white">{template.name}</p>
          </div>
          <label className="block text-sm text-white/70">
            Content name
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={workspaceInputClass()}
              placeholder="CFO Weekly Management Call"
            />
          </label>
          <label className="block text-sm text-white/70">
            Frequency
            <select
              value={frequency}
              onChange={(event) => setFrequency(event.target.value)}
              className={workspaceInputClass()}
            >
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Ad hoc">Ad hoc</option>
            </select>
          </label>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0b1524]/80 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-white">Pages & sections</p>
            <div className="flex flex-wrap gap-2">
              {CONTENT_STUDIO_PAGE_PRESETS.slice(0, 6).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={workspaceSecondaryButtonClass()}
                  onClick={() => addPage(preset)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {preset}
                </button>
              ))}
            </div>
          </div>
          <ol className="space-y-2">
            {pages.map((page, index) => (
              <li
                key={page.id}
                className={cn(
                  "flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2",
                  page.enabled ? "border-white/10 bg-white/[0.03]" : "border-white/5 bg-white/[0.01] opacity-60",
                )}
              >
                <span className="w-6 text-xs text-white/40">{index + 1}.</span>
                <input
                  value={page.label}
                  onChange={(event) =>
                    setPages((current) =>
                      current.map((row) =>
                        row.id === page.id ? { ...row, label: event.target.value } : row,
                      ),
                    )
                  }
                  className={cn(workspaceInputClass(), "mt-0 flex-1")}
                />
                <label className="inline-flex items-center gap-1.5 text-xs text-white/60">
                  <input
                    type="checkbox"
                    checked={page.enabled}
                    onChange={() => togglePage(page.id)}
                  />
                  Enabled
                </label>
                <button
                  type="button"
                  className={workspaceSecondaryButtonClass()}
                  onClick={() => movePage(index, -1)}
                  aria-label="Move up"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className={workspaceSecondaryButtonClass()}
                  onClick={() => movePage(index, 1)}
                  aria-label="Move down"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className={workspaceSecondaryButtonClass()}
                  onClick={() => removePage(page.id)}
                  aria-label="Remove page"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-xl border border-sky-400/20 bg-sky-500/5 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-sky-100">
            <Sparkles className="h-4 w-4" />
            Assistant
          </p>
          <form onSubmit={runAssistant} className="flex flex-wrap gap-2">
            <input
              value={assistantPrompt}
              onChange={(event) => setAssistantPrompt(event.target.value)}
              className={cn(workspaceInputClass(), "mt-0 min-w-[16rem] flex-1")}
              placeholder='Try: "Add cash runway and forecast" or "Remove EBITDA"'
            />
            <button type="submit" className={workspaceSecondaryButtonClass()}>
              Apply
            </button>
          </form>
          {assistantNote ? <p className="mt-2 text-xs text-sky-100/70">{assistantNote}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="submit" className={workspaceSecondaryButtonClass()}>
            Save content
          </button>
          <button type="button" className={workspaceSecondaryButtonClass()} onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </WorkspaceSection>
  );
}
