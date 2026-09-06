import type { ArchitectureDiagramDocument } from "@/lib/architecture-diagram-data";

export type ArchitectureDiagramLayoutNodeState = {
  id: string;
  position?: { x: number; y: number };
  collapsed?: boolean;
  hidden?: boolean;
};

/** User-controlled presentation overlay — never replaces canonical architecture data. */
export type ArchitectureDiagramLayoutOverlay = {
  version: 1;
  viewport?: { x: number; y: number; zoom: number };
  nodes: ArchitectureDiagramLayoutNodeState[];
};

const STORAGE_PREFIX = "unit311-architecture-diagram-layout:v1";

export function architectureDiagramLayoutStorageKey(
  userKey: string,
  sectionSlug: string,
): string {
  const user = userKey.trim() || "anonymous";
  const slug = sectionSlug.trim().toLowerCase();
  return `${STORAGE_PREFIX}:${user}:${slug}`;
}

export function extractLayoutOverlay(
  document: ArchitectureDiagramDocument,
  viewport?: ArchitectureDiagramDocument["viewport"],
): ArchitectureDiagramLayoutOverlay {
  return {
    version: 1,
    viewport: viewport ?? document.viewport,
    nodes: document.nodes.map((node) => ({
      id: node.id,
      position: { ...node.position },
      collapsed: node.data.collapsed,
      hidden: node.hidden,
    })),
  };
}

export function applyLayoutOverlay(
  canonical: ArchitectureDiagramDocument,
  overlay: ArchitectureDiagramLayoutOverlay | null | undefined,
): ArchitectureDiagramDocument {
  if (!overlay || overlay.version !== 1 || !Array.isArray(overlay.nodes)) {
    return canonical;
  }

  const overlayById = new Map(overlay.nodes.map((node) => [node.id, node]));

  return {
    ...canonical,
    viewport: overlay.viewport ?? canonical.viewport,
    nodes: canonical.nodes.map((node) => {
      const saved = overlayById.get(node.id);
      if (!saved) return node;
      return {
        ...node,
        position: saved.position ? { ...saved.position } : node.position,
        hidden: saved.hidden ?? node.hidden,
        data: {
          ...node.data,
          collapsed: saved.collapsed ?? node.data.collapsed,
        },
      };
    }),
  };
}

export function loadArchitectureDiagramLayoutOverlay(
  userKey: string,
  sectionSlug: string,
): ArchitectureDiagramLayoutOverlay | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(
      architectureDiagramLayoutStorageKey(userKey, sectionSlug),
    );
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ArchitectureDiagramLayoutOverlay;
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.nodes)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveArchitectureDiagramLayoutOverlay(
  userKey: string,
  sectionSlug: string,
  overlay: ArchitectureDiagramLayoutOverlay,
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    architectureDiagramLayoutStorageKey(userKey, sectionSlug),
    JSON.stringify(overlay),
  );
}

export function clearArchitectureDiagramLayoutOverlay(
  userKey: string,
  sectionSlug: string,
): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(
    architectureDiagramLayoutStorageKey(userKey, sectionSlug),
  );
}
