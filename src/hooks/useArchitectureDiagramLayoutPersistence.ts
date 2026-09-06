"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  applyLayoutOverlay,
  clearArchitectureDiagramLayoutOverlay,
  extractLayoutOverlay,
  loadArchitectureDiagramLayoutOverlay,
  saveArchitectureDiagramLayoutOverlay,
  type ArchitectureDiagramLayoutOverlay,
} from "@/lib/architecture-diagram-layout";
import type { ArchitectureDiagramDocument } from "@/lib/architecture-diagram-data";

export type ArchitectureDiagramLayoutSaveStatus = "idle" | "saving" | "saved";

export function useArchitectureDiagramLayoutPersistence(
  sectionSlug: string,
  canonicalDiagram: ArchitectureDiagramDocument | null | undefined,
  userKey = "anonymous",
) {
  const [overlay, setOverlay] = useState<ArchitectureDiagramLayoutOverlay | null>(null);
  const [saveStatus, setSaveStatus] = useState<ArchitectureDiagramLayoutSaveStatus>("idle");
  const saveTimerRef = useRef<number | null>(null);
  const resolvedUserKey = userKey.trim() || "anonymous";

  useEffect(() => {
    setOverlay(loadArchitectureDiagramLayoutOverlay(resolvedUserKey, sectionSlug));
  }, [resolvedUserKey, sectionSlug]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current != null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const displayDiagram = useMemo(() => {
    if (!canonicalDiagram) return null;
    return applyLayoutOverlay(canonicalDiagram, overlay);
  }, [canonicalDiagram, overlay]);

  const handleLayoutOverlayChange = useCallback(
    (nextOverlay: ArchitectureDiagramLayoutOverlay) => {
      setOverlay(nextOverlay);
      setSaveStatus("saving");
      saveArchitectureDiagramLayoutOverlay(resolvedUserKey, sectionSlug, nextOverlay);
      if (saveTimerRef.current != null) {
        window.clearTimeout(saveTimerRef.current);
      }
      setSaveStatus("saved");
      saveTimerRef.current = window.setTimeout(() => {
        setSaveStatus("idle");
        saveTimerRef.current = null;
      }, 1800);
    },
    [resolvedUserKey, sectionSlug],
  );

  const handleResetLayout = useCallback(() => {
    clearArchitectureDiagramLayoutOverlay(resolvedUserKey, sectionSlug);
    setOverlay(null);
    setSaveStatus("idle");
  }, [resolvedUserKey, sectionSlug]);

  const extractFromDocument = useCallback(
    (document: ArchitectureDiagramDocument) =>
      extractLayoutOverlay(document, document.viewport),
    [],
  );

  return {
    overlay,
    displayDiagram,
    saveStatus,
    handleLayoutOverlayChange,
    handleResetLayout,
    extractFromDocument,
  };
}
