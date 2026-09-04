"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import ArchitectureViewer from "@/components/architecture/ArchitectureViewer";
import type { ArchitectureDiagramDocument, SystemArchitectureDiagram } from "@/lib/architecture-diagram-data";
import {
  createGreenDesertIrDiagramRecord,
  createGreenDesertIrSeedDiagrams,
  GREENDESERT_IR_ARCHITECTURE_LABELS,
  GREENDESERT_IR_ARCHITECTURE_SLUGS,
  resolveGreenDesertIrSeedDiagram,
  type GreenDesertIrArchitectureSlug,
} from "@/lib/greendesert/greendesert-information-repository-architecture-data";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "unit311-greendesert-ir-architecture-v1";

function loadDiagrams(): SystemArchitectureDiagram[] {
  if (typeof window === "undefined") return createGreenDesertIrSeedDiagrams();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createGreenDesertIrSeedDiagrams();
    const parsed = JSON.parse(raw) as SystemArchitectureDiagram[];
    if (!Array.isArray(parsed) || parsed.length === 0) return createGreenDesertIrSeedDiagrams();
    const slugs = new Set(parsed.map((row) => row.sectionSlug));
    const hasAll = GREENDESERT_IR_ARCHITECTURE_SLUGS.every((slug) => slugs.has(slug));
    return hasAll ? parsed : createGreenDesertIrSeedDiagrams();
  } catch {
    return createGreenDesertIrSeedDiagrams();
  }
}

function persistDiagrams(rows: SystemArchitectureDiagram[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export default function GreenDesertInformationRepositoryArchitectureWorkspace() {
  const [diagrams, setDiagrams] = useState<SystemArchitectureDiagram[]>(() => loadDiagrams());
  const [activeSlug, setActiveSlug] = useState<GreenDesertIrArchitectureSlug>(
    GREENDESERT_IR_ARCHITECTURE_SLUGS[0],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const seeded = loadDiagrams();
    setDiagrams(seeded);
    persistDiagrams(seeded);
    setLoading(false);
  }, []);

  const activeDiagram = useMemo(
    () => diagrams.find((row) => row.sectionSlug === activeSlug) ?? createGreenDesertIrDiagramRecord(activeSlug),
    [activeSlug, diagrams],
  );

  const handleDiagramChange = useCallback(
    (next: ArchitectureDiagramDocument) => {
      setDiagrams((current) => {
        const updated = current.map((row) =>
          row.sectionSlug === activeSlug
            ? { ...row, diagramJson: next, updatedAt: new Date().toISOString() }
            : row,
        );
        persistDiagrams(updated);
        return updated;
      });
    },
    [activeSlug],
  );

  const handleReset = useCallback(() => {
    const fresh = createGreenDesertIrDiagramRecord(activeSlug);
    setDiagrams((current) => {
      const updated = current.map((row) => (row.sectionSlug === activeSlug ? fresh : row));
      persistDiagrams(updated);
      return updated;
    });
  }, [activeSlug]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-10 text-sm text-white/50">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading architecture diagrams…
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col gap-4">
      <header className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
          Information Repository
        </p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-white">Architecture Diagrams</h1>
            <p className="mt-1 max-w-3xl text-sm text-white/55">
              Interactive algae cultivation platform diagrams for the Green Desert Jeddah deployment.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/75 hover:bg-white/[0.05]"
          >
            Reset diagram
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {GREENDESERT_IR_ARCHITECTURE_SLUGS.map((slug) => {
          const isActive = slug === activeSlug;
          return (
            <button
              key={slug}
              type="button"
              onClick={() => setActiveSlug(slug)}
              className={cn(
                "rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                isActive
                  ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                  : "border-white/10 bg-white/[0.03] text-white/60 hover:text-white/80",
              )}
            >
              {GREENDESERT_IR_ARCHITECTURE_LABELS[slug]}
            </button>
          );
        })}
      </div>

      <div className="min-h-[520px] flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#07111f]">
        <ArchitectureViewer
          key={activeSlug}
          diagramDocument={activeDiagram.diagramJson ?? resolveGreenDesertIrSeedDiagram(activeSlug)}
          title={activeDiagram.title}
          readOnly={false}
          onDocumentChange={handleDiagramChange}
        />
      </div>
    </div>
  );
}
