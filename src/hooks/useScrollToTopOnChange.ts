"use client";

import { useEffect, useRef } from "react";

/** Scroll a detail panel container to top when the selected record id changes. */
export function useScrollToTopOnChange(selectedId: string | null | undefined) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: 0, behavior: "instant" in window ? ("instant" as ScrollBehavior) : "auto" });
  }, [selectedId]);
  return ref;
}

/** Scroll window to top when a tab or view key changes. */
export function useScrollWindowToTopOnChange(key: string | null | undefined) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [key]);
}
