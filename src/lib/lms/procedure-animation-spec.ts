/**
 * Validated procedure animation specifications — persisted in lesson JSON.
 * No executable code; renderer interprets nodes/edges only.
 */

export const PROCEDURE_ANIMATION_SPEC_VERSION = 1;

export type ProcedureAnimationNodeKind = "start" | "step" | "decision" | "end" | "actor";

export type ProcedureAnimationLayout = "linear" | "decision_tree" | "pipeline";

export type ProcedureAnimationNode = {
  id: string;
  label: string;
  description?: string;
  kind: ProcedureAnimationNodeKind;
};

export type ProcedureAnimationEdge = {
  id: string;
  from: string;
  to: string;
  label?: string;
};

export type ProcedureAnimationSpec = {
  version: typeof PROCEDURE_ANIMATION_SPEC_VERSION;
  title: string;
  subtitle?: string;
  layout: ProcedureAnimationLayout;
  nodes: ProcedureAnimationNode[];
  edges: ProcedureAnimationEdge[];
  /** Ordered node ids for default playback (required for decision_tree). */
  playbackOrder?: string[];
};

export type ProcedureAnimationContent = {
  type: "procedure_animation";
  title?: string;
  spec: ProcedureAnimationSpec;
};

const NODE_KINDS = new Set<ProcedureAnimationNodeKind>([
  "start",
  "step",
  "decision",
  "end",
  "actor",
]);

const LAYOUTS = new Set<ProcedureAnimationLayout>(["linear", "decision_tree", "pipeline"]);

function slugId(value: string, index: number): string {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return base || `node-${index + 1}`;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : value == null ? fallback : String(value).trim();
}

function inferPlaybackOrder(
  nodes: ProcedureAnimationNode[],
  edges: ProcedureAnimationEdge[],
): string[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const outEdges = new Map<string, ProcedureAnimationEdge[]>();
  for (const edge of edges) {
    const list = outEdges.get(edge.from) ?? [];
    list.push(edge);
    outEdges.set(edge.from, list);
  }

  const start =
    nodes.find((n) => n.kind === "start")?.id ??
    nodes.find((n) => !edges.some((e) => e.to === n.id))?.id ??
    nodes[0]?.id;
  if (!start) return nodes.map((n) => n.id);

  const order: string[] = [];
  const seen = new Set<string>();
  let current: string | undefined = start;
  while (current && !seen.has(current)) {
    seen.add(current);
    order.push(current);
    const nextId: string | undefined = outEdges.get(current)?.[0]?.to;
    current = nextId && byId.has(nextId) ? nextId : undefined;
  }
  for (const node of nodes) {
    if (!seen.has(node.id)) order.push(node.id);
  }
  return order;
}

/** Build a minimal valid spec from step labels (fallback when AI omits animation). */
export function buildLinearProcedureSpecFromSteps(
  title: string,
  steps: string[],
  subtitle?: string,
): ProcedureAnimationSpec {
  const labels = steps.map((s) => s.trim()).filter(Boolean).slice(0, 12);
  if (labels.length < 2) {
    labels.push("Review the procedure", "Complete required actions", "Confirm and document");
  }
  const nodes: ProcedureAnimationNode[] = [
    { id: "start", label: "Start", kind: "start" },
    ...labels.map((label, i) => ({
      id: slugId(label, i),
      label,
      kind: "step" as const,
    })),
    { id: "end", label: "Complete", kind: "end" },
  ];
  const edges: ProcedureAnimationEdge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      id: `e-${i + 1}`,
      from: nodes[i]!.id,
      to: nodes[i + 1]!.id,
    });
  }
  return {
    version: PROCEDURE_ANIMATION_SPEC_VERSION,
    title,
    subtitle,
    layout: "pipeline",
    nodes,
    edges,
    playbackOrder: nodes.map((n) => n.id),
  };
}

export function validateProcedureAnimationSpec(raw: unknown): ProcedureAnimationSpec | null {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
  if (!obj) return null;

  const version = Number(obj.version);
  if (version !== PROCEDURE_ANIMATION_SPEC_VERSION) return null;

  const title = asString(obj.title);
  if (!title) return null;

  const layoutRaw = asString(obj.layout, "linear");
  const layout = LAYOUTS.has(layoutRaw as ProcedureAnimationLayout)
    ? (layoutRaw as ProcedureAnimationLayout)
    : "linear";

  const nodes = (Array.isArray(obj.nodes) ? obj.nodes : [])
    .map((entry, index): ProcedureAnimationNode | null => {
      const row = entry && typeof entry === "object" ? (entry as Record<string, unknown>) : null;
      if (!row) return null;
      const label = asString(row.label);
      if (!label) return null;
      const kindRaw = asString(row.kind, "step");
      const kind = NODE_KINDS.has(kindRaw as ProcedureAnimationNodeKind)
        ? (kindRaw as ProcedureAnimationNodeKind)
        : "step";
      const id = asString(row.id, slugId(label, index));
      const description = asString(row.description) || undefined;
      return { id, label, kind, description };
    })
    .filter((n): n is ProcedureAnimationNode => Boolean(n));

  if (nodes.length < 2) return null;
  const nodeIds = new Set(nodes.map((n) => n.id));

  const edges = (Array.isArray(obj.edges) ? obj.edges : [])
    .map((entry, index): ProcedureAnimationEdge | null => {
      const row = entry && typeof entry === "object" ? (entry as Record<string, unknown>) : null;
      if (!row) return null;
      const from = asString(row.from);
      const to = asString(row.to);
      if (!from || !to || !nodeIds.has(from) || !nodeIds.has(to)) return null;
      return {
        id: asString(row.id, `edge-${index + 1}`),
        from,
        to,
        label: asString(row.label) || undefined,
      };
    })
    .filter((e): e is ProcedureAnimationEdge => Boolean(e));

  if (edges.length < 1 && nodes.length > 1) {
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        id: `edge-${i + 1}`,
        from: nodes[i]!.id,
        to: nodes[i + 1]!.id,
      });
    }
  }

  const playbackRaw = Array.isArray(obj.playbackOrder) ? obj.playbackOrder : [];
  let playbackOrder = playbackRaw
    .map((id) => asString(id))
    .filter((id) => nodeIds.has(id));
  if (playbackOrder.length < 2) {
    playbackOrder = inferPlaybackOrder(nodes, edges);
  }

  return {
    version: PROCEDURE_ANIMATION_SPEC_VERSION,
    title,
    subtitle: asString(obj.subtitle) || undefined,
    layout,
    nodes,
    edges,
    playbackOrder,
  };
}

export function normalizeProcedureAnimationContent(
  raw: unknown,
  lessonTitle: string,
): ProcedureAnimationContent | null {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
  if (!obj) return null;

  const nested = obj.spec ?? obj.animation ?? obj.procedure;
  const spec = validateProcedureAnimationSpec(nested);
  if (!spec) return null;

  return {
    type: "procedure_animation",
    title: asString(obj.title, lessonTitle) || spec.title,
    spec,
  };
}

/** Extract plausible procedure steps from document text (generic, not PDF-specific). */
export function inferProcedureStepsFromDocument(documentText: string, maxSteps = 6): string[] {
  const lines = documentText
    .split(/\n+/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l.length > 8 && l.length < 160);

  const numbered = lines
    .filter((l) => /^\d+[\).\s]/.test(l) || /^step\s+\d/i.test(l))
    .map((l) => l.replace(/^\d+[\).\s]+/i, "").replace(/^step\s+\d+[:\s-]*/i, "").trim());

  if (numbered.length >= 2) return numbered.slice(0, maxSteps);

  const bullets = lines
    .filter((l) => /^[-•*]/.test(l))
    .map((l) => l.replace(/^[-•*]\s*/, "").trim());
  if (bullets.length >= 2) return bullets.slice(0, maxSteps);

  const sentences = documentText
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 24 && s.length < 200);
  return sentences.slice(0, maxSteps);
}
