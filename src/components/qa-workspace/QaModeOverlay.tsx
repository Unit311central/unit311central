"use client";

import { useEffect, useRef } from "react";

import {
  QA_MODULE_LEVEL_ELEMENT,
  QA_PAGE_LEVEL_ELEMENT,
  QA_WORKSPACE_LEVEL_ELEMENT,
} from "@/lib/qa-workspace/constants";
import {
  describeQaElement,
  listQaOutlineTargets,
  resolveQaElementFromTarget,
} from "@/lib/qa-workspace/element-identification";
import type { QaElementContext } from "@/lib/qa-workspace/types";

type QaModeOverlayProps = {
  onElementSelected: (context: QaElementContext) => void;
  onPageLevelTask: () => void;
  onModuleLevelTask: () => void;
  onWorkspaceLevelTask: () => void;
};

const OUTLINE_CLASS = "qa-mode-outline";

export default function QaModeOverlay({
  onElementSelected,
  onPageLevelTask,
  onModuleLevelTask,
  onWorkspaceLevelTask,
}: QaModeOverlayProps) {
  const highlightedRef = useRef<Set<HTMLElement>>(new Set());

  useEffect(() => {
    const root = document.querySelector('[data-ai-target="page-main"]');
    if (!root) return;

    const clearOutlines = () => {
      for (const element of highlightedRef.current) {
        element.classList.remove(OUTLINE_CLASS);
      }
      highlightedRef.current.clear();
    };

    const applyOutlines = () => {
      clearOutlines();
      for (const element of listQaOutlineTargets(root)) {
        element.classList.add(OUTLINE_CLASS);
        highlightedRef.current.add(element);
      }
    };

    applyOutlines();
    const observer = new MutationObserver(() => applyOutlines());
    observer.observe(root, { childList: true, subtree: true });

    const onClickCapture = (event: Event) => {
      const element = resolveQaElementFromTarget(event.target);
      if (!element) return;
      event.preventDefault();
      event.stopPropagation();
      onElementSelected(describeQaElement(element));
    };

    root.addEventListener("click", onClickCapture, true);

    return () => {
      observer.disconnect();
      root.removeEventListener("click", onClickCapture, true);
      clearOutlines();
    };
  }, [onElementSelected]);

  return (
    <div data-qa-overlay className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex justify-center px-4">
      <div
        data-qa-dialog="toolbar"
        className="pointer-events-auto flex max-w-5xl flex-wrap items-center gap-2 rounded-xl border border-rose-400/40 bg-[#1a0b10]/95 px-3 py-2 text-xs text-rose-50 shadow-lg backdrop-blur"
      >
        <span className="font-semibold uppercase tracking-[0.12em] text-rose-200">QA Mode</span>
        <span className="text-rose-100/80">Click a highlighted element for an element task.</span>
        <button
          type="button"
          className="rounded-lg border border-rose-300/40 bg-rose-500/20 px-2.5 py-1 font-medium text-rose-50 hover:bg-rose-500/30"
          onClick={onWorkspaceLevelTask}
        >
          Workspace task ({QA_WORKSPACE_LEVEL_ELEMENT})
        </button>
        <button
          type="button"
          className="rounded-lg border border-rose-300/40 bg-rose-500/20 px-2.5 py-1 font-medium text-rose-50 hover:bg-rose-500/30"
          onClick={onModuleLevelTask}
        >
          Module task ({QA_MODULE_LEVEL_ELEMENT})
        </button>
        <button
          type="button"
          className="rounded-lg border border-rose-300/40 bg-rose-500/20 px-2.5 py-1 font-medium text-rose-50 hover:bg-rose-500/30"
          onClick={onPageLevelTask}
        >
          Page task ({QA_PAGE_LEVEL_ELEMENT})
        </button>
      </div>
    </div>
  );
}
