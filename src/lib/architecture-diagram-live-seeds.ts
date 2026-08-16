import "server-only";

import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import {
  parseGithubArchitectureDoc,
  resolveGithubArchitectureDocPath,
} from "@/lib/github-architecture-diagram";
import type {
  ArchitectureDiagramDocument,
  ArchitectureDiagramEdge,
  ArchitectureDiagramNode,
  ArchitectureNodeData,
} from "@/lib/architecture-diagram-data";
import {
  parseVercelArchitectureDoc,
  resolveVercelArchitectureDocPath,
  VERCEL_ARCHITECTURE_SVG_PUBLIC_PATH,
} from "@/lib/vercel-architecture-diagram";
import {
  parseWorkspaceArchitectureDoc,
  resolveWorkspaceArchitectureDocPath,
} from "@/lib/workspace-architecture-diagram";

const EXECUTIVE_AI_DOC = "docs/EXECUTIVE_AI_PLATFORM.md";

function node(
  id: string,
  label: string,
  kind: ArchitectureNodeData["nodeKind"],
  x: number,
  y: number,
  extra: Partial<ArchitectureNodeData> & { parentId?: string; style?: Record<string, string | number> } = {},
): ArchitectureDiagramNode {
  const { parentId, style, ...data } = extra;
  return {
    id,
    type: kind === "group" ? "group" : "architecture",
    position: { x, y },
    parentId,
    extent: parentId ? "parent" : undefined,
    style,
    data: { label, nodeKind: kind, ...data },
  };
}

function liveMeta(generator: string, title: string, sourceDocument: string, sourceMtimeMs: number) {
  return {
    generator,
    title,
    sourceDocument,
    sourceDocumentMtimeMs: sourceMtimeMs,
    generatedAt: new Date().toISOString(),
    liveRefresh: true,
  };
}

function readDoc(path: string): { markdown: string; mtimeMs: number } {
  const markdown = readFileSync(path, "utf8");
  return { markdown, mtimeMs: statSync(path).mtimeMs };
}

function safeReadDoc(path: string, fallbackMarkdown: string): { markdown: string; mtimeMs: number } {
  try {
    return readDoc(path);
  } catch {
    return { markdown: fallbackMarkdown, mtimeMs: 0 };
  }
}

const VERCEL_DOC_FALLBACK = `# Vercel
| Field | Value |
| --- | --- |
| Vercel project | unit311central |
| Framework | Next.js (App Router) |
| Runtime | Vercel Edge Middleware + Node.js App Router |
| Production URL (apex) | https://unit311central.com |
| Production database | Supabase Unit311 Central (kkxtvzxqmbacjatkiupq) |
## Domains
| Domain | Role | Status |
| unit311central.com | Public marketing website | Production |
| internal.unit311central.com | Unit311 Internal operations app | Production |
| demo.unit311central.com | Demo workspace | Production |
## Middleware request flow
| Host | Path behaviour |
| Apex / www | Serve public marketing |
| internal.* | Rewrite to internal dashboard |
`;

const SUPABASE_DOC_FALLBACK = `# Workspace
**Production database**
| Field | Value |
| Supabase display name | Unit311 Central |
| Project ID | kkxtvzxqmbacjatkiupq |
## Unit311 Central Internal workspace
| Field | Value |
| name | Unit311 Central |
| slug | unit311 |
| workspace_type | Internal |
| status | Active |
`;

const CODEBASE_DOC_FALLBACK = `# GitHub
| Field | Value |
| GitHub remote | https://github.com/Unit311central/unit311central.git |
| Default package name | unit311 |
| Product | Unit311 Central (single-repo multi-tenant SaaS) |
## Repository structure
| Path | Role |
| src/app/ | Next.js App Router |
| src/lib/ | Domain services |
| supabase/migrations/ | SQL migrations |
## App Router
| Area | Location | Purpose |
| Internal dashboard | src/app/(survey-operations)/internaldashboard | Internal ops |
`;

const OPENAI_DOC_FALLBACK = `# Executive AI
OPENAI_ASSISTANT_MODEL gpt-4o-mini
OPENAI_API_KEY server-only
`;

export function createVercelStackDiagram(cwd = process.cwd()): ArchitectureDiagramDocument {
  const docPath = resolveVercelArchitectureDocPath(cwd);
  const { markdown, mtimeMs } = safeReadDoc(docPath, VERCEL_DOC_FALLBACK);
  const parsed = parseVercelArchitectureDoc(markdown);

  const domainNodes = parsed.domains.slice(0, 6).map((row, index) =>
    node(`domain-${index}`, row.domain, "frontend", 40, 50 + index * 72, {
      parentId: "group-domains",
      description: `${row.role} · ${row.status}`,
      icon: "globe",
      status: row.status.toLowerCase().includes("production") ? "live" : "planned",
    }),
  );

  const flowNodes = parsed.middlewareFlows.slice(0, 5).map((row, index) =>
    node(`flow-${index}`, row.host, "service", 40, 50 + index * 68, {
      parentId: "group-middleware",
      description: row.behaviour.slice(0, 120),
      icon: "git-branch",
      status: "live",
    }),
  );

  return {
    version: 1,
    viewport: { x: 0, y: 0, zoom: 0.78 },
    meta: liveMeta("vercel-live", "Vercel", docPath.replace(/\\/g, "/"), mtimeMs),
    nodes: [
      node("vercel-project", parsed.project, "storage", 80, 40, {
        description: `${parsed.framework} · ${parsed.runtime}`,
        icon: "cloud",
        status: "live",
        href: VERCEL_ARCHITECTURE_SVG_PUBLIC_PATH,
        badges: [{ label: "Production", tone: "emerald" }],
      }),
      node("apex-url", parsed.productionUrl, "frontend", 420, 40, {
        description: "Apex marketing + shared login",
        icon: "globe",
        status: "live",
      }),
      node("supabase-ref", parsed.database, "database", 760, 40, {
        description: "kkxtvzxqmbacjatkiupq",
        docSectionSlug: "supabase-stack",
        icon: "database",
        status: "live",
      }),
      node("group-domains", "Production domains", "group", 80, 160, {
        style: { width: 340, height: Math.max(220, domainNodes.length * 72 + 60) },
      }),
      ...domainNodes,
      node("group-middleware", "Middleware routing", "group", 460, 160, {
        style: { width: 380, height: Math.max(240, flowNodes.length * 68 + 60) },
      }),
      ...flowNodes,
      node("edge-runtime", "Edge Middleware", "service", 900, 200, {
        description: "src/middleware.ts · host flags · rewrites",
        icon: "layers",
        status: "live",
      }),
      node("node-runtime", "Node.js App Router", "service", 900, 300, {
        description: "npm run build · API routes · SSR",
        icon: "server",
        status: "live",
      }),
      node("vercel-crons", "Vercel Cron", "integration", 900, 400, {
        description: "vercel.json — reminders · Wise · billing sync",
        icon: "clock",
        status: "live",
      }),
      node("deploy-git", "Git → main deploy", "integration", 900, 500, {
        description: "Unit311central/unit311central → Vercel production",
        icon: "git-branch",
        status: "live",
      }),
    ],
    edges: [
      { id: "e-apex-edge", source: "apex-url", target: "edge-runtime", animated: true },
      { id: "e-edge-node", source: "edge-runtime", target: "node-runtime", animated: true },
      { id: "e-node-db", source: "node-runtime", target: "supabase-ref", label: "service role" },
      { id: "e-project-apex", source: "vercel-project", target: "apex-url" },
      { id: "e-cron-node", source: "vercel-crons", target: "node-runtime" },
    ],
  };
}

export function createSupabaseStackDiagram(cwd = process.cwd()): ArchitectureDiagramDocument {
  const docPath = resolveWorkspaceArchitectureDocPath(cwd);
  const { markdown, mtimeMs } = safeReadDoc(docPath, SUPABASE_DOC_FALLBACK);
  const parsed = parseWorkspaceArchitectureDoc(markdown);

  const foundationNodes = parsed.foundationTables.map((table, index) =>
    node(`foundation-${table}`, table, "database", 40, 50 + index * 64, {
      parentId: "group-foundation",
      icon: "database",
      status: "live",
    }),
  );

  const awareSample = parsed.workspaceAwareTables.slice(0, 8).map((table, index) =>
    node(`aware-${index}`, table, "database", 40, 50 + index * 56, {
      parentId: "group-aware",
      description: "workspace_id scoped",
      icon: "table",
      status: "live",
    }),
  );

  return {
    version: 1,
    viewport: { x: 0, y: 0, zoom: 0.8 },
    meta: liveMeta("supabase-live", "Supabase", docPath.replace(/\\/g, "/"), mtimeMs),
    nodes: [
      node("supabase-project", parsed.projectName, "database", 80, 40, {
        description: `Project ${parsed.projectId}`,
        icon: "database",
        status: "live",
        badges: [{ label: "Production", tone: "violet" }],
      }),
      node("postgres", "Postgres", "database", 400, 40, {
        description: "RLS Phase 1 · service-role server paths",
        icon: "database",
        status: "live",
      }),
      node("auth-helpers", "Supabase Auth", "service", 720, 40, {
        description: "Session cookies · platform_users",
        docSectionSlug: "authentication",
        icon: "key-round",
        status: "live",
      }),
      node("storage-bucket", "Storage · internal-files", "storage", 1040, 40, {
        description: "Workspace-prefixed paths · signed URLs",
        docSectionSlug: "storage",
        icon: "hard-drive",
        status: "live",
      }),
      node("workspaces-registry", "workspaces", "database", 400, 160, {
        description: `Internal slug ${parsed.internalSlug} · tenancy registry`,
        icon: "building-2",
        status: "live",
      }),
      node("group-foundation", "Foundation tables", "group", 80, 280, {
        style: { width: 300, height: foundationNodes.length * 64 + 70 },
      }),
      ...foundationNodes,
      node("group-aware", "Workspace-aware tables (sample)", "group", 420, 280, {
        style: { width: 320, height: awareSample.length * 56 + 70 },
      }),
      ...awareSample,
      node("provision-fn", "provision_workspace()", "service", 800, 320, {
        description: parsed.hasProvisionFunction ? "SQL function for tenant bootstrap" : "Not deployed",
        icon: "workflow",
        status: parsed.hasProvisionFunction ? "live" : "planned",
      }),
      node("phase1-rls", "Phase 1 tenant isolation", "service", 800, 420, {
        description: "Migrations 142–147 · deny-all RLS · storage policies",
        icon: "shield",
        status: "live",
        badges: [{ label: "Staging validated", tone: "sky" }],
      }),
    ],
    edges: [
      { id: "e-proj-pg", source: "supabase-project", target: "postgres", animated: true },
      { id: "e-pg-registry", source: "postgres", target: "workspaces-registry" },
      { id: "e-registry-foundation", source: "workspaces-registry", target: "group-foundation" },
      { id: "e-registry-aware", source: "workspaces-registry", target: "group-aware", label: "workspace_id" },
      { id: "e-pg-auth", source: "postgres", target: "auth-helpers" },
      { id: "e-pg-storage", source: "postgres", target: "storage-bucket" },
      { id: "e-prov-registry", source: "provision-fn", target: "workspaces-registry" },
      { id: "e-rls-pg", source: "phase1-rls", target: "postgres" },
    ],
  };
}

export function createCodebaseStackDiagram(cwd = process.cwd()): ArchitectureDiagramDocument {
  const docPath = resolveGithubArchitectureDocPath(cwd);
  const { markdown, mtimeMs } = safeReadDoc(docPath, CODEBASE_DOC_FALLBACK);
  const parsed = parseGithubArchitectureDoc(markdown);

  const structureNodes = parsed.structure.slice(0, 8).map((row, index) =>
    node(`path-${index}`, row.path, "frontend", 40, 50 + index * 58, {
      parentId: "group-structure",
      description: row.role,
      icon: "folder",
      status: "live",
    }),
  );

  const apiAreas = parsed.appRouter.slice(0, 6).map((row, index) =>
    node(`app-${index}`, row.area, "service", 40, 50 + index * 62, {
      parentId: "group-app",
      description: `${row.location} — ${row.purpose}`.slice(0, 100),
      icon: "layout-grid",
      status: "live",
    }),
  );

  return {
    version: 1,
    viewport: { x: 0, y: 0, zoom: 0.76 },
    meta: liveMeta("codebase-live", "Codebase", docPath.replace(/\\/g, "/"), mtimeMs),
    nodes: [
      node("github-repo", parsed.packageName, "integration", 80, 40, {
        description: parsed.remote,
        icon: "github",
        status: "live",
        href: "/architecture/github-architecture.svg",
      }),
      node("next-app", "Next.js App Router", "frontend", 400, 40, {
        description: parsed.product,
        icon: "code",
        status: "live",
      }),
      node("middleware", "src/middleware.ts", "service", 720, 40, {
        description: "Host routing · workspace slug · portals",
        icon: "git-branch",
        status: "live",
      }),
      node("migrations", "supabase/migrations", "database", 1040, 40, {
        description: "Canonical SQL history · Phase 1 142–147",
        icon: "database",
        status: "live",
      }),
      node("group-structure", "Repository layout", "group", 80, 160, {
        style: { width: 340, height: structureNodes.length * 58 + 70 },
      }),
      ...structureNodes,
      node("group-app", "App Router surfaces", "group", 460, 160, {
        style: { width: 360, height: apiAreas.length * 62 + 70 },
      }),
      ...apiAreas,
      node("internal-ui", "Internal Ops UI", "frontend", 860, 200, {
        description: "src/components/testflighthub",
        icon: "layout-dashboard",
        status: "live",
      }),
      node("unit311-details", "Unit311 Details", "frontend", 860, 300, {
        description: "Corporate Information · living architecture",
        docSectionSlug: "architecture-diagrams",
        icon: "network",
        status: "live",
      }),
      node("build-cmd", "npm run build", "service", 860, 400, {
        description: parsed.buildSteps.slice(0, 2).join(" · ") || "tsc + next build",
        icon: "hammer",
        status: "live",
      }),
    ],
    edges: [
      { id: "e-repo-next", source: "github-repo", target: "next-app", animated: true },
      { id: "e-next-mw", source: "next-app", target: "middleware" },
      { id: "e-next-internal", source: "next-app", target: "internal-ui" },
      { id: "e-internal-details", source: "internal-ui", target: "unit311-details" },
      { id: "e-next-migrations", source: "next-app", target: "migrations", label: "data layer" },
      { id: "e-build-next", source: "build-cmd", target: "next-app" },
    ],
  };
}

export function createOpenAiStackDiagram(cwd = process.cwd()): ArchitectureDiagramDocument {
  const docPath = join(cwd, EXECUTIVE_AI_DOC);
  const { markdown, mtimeMs } = safeReadDoc(docPath, OPENAI_DOC_FALLBACK);

  const modelMatch = markdown.match(/OPENAI_ASSISTANT_MODEL[^\n`]*`?([a-z0-9.-]+)`?/i);
  const defaultModel = modelMatch?.[1] ?? "gpt-4o-mini";

  return {
    version: 1,
    viewport: { x: 20, y: 10, zoom: 0.85 },
    meta: liveMeta("openai-live", "OpenAI", EXECUTIVE_AI_DOC, mtimeMs),
    nodes: [
      node("group-ui", "Operator surfaces", "group", 40, 40, {
        style: { width: 340, height: 280 },
      }),
      node("command-centre", "Executive Command Centre", "frontend", 40, 50, {
        parentId: "group-ui",
        docSectionSlug: "ai-agent",
        icon: "layout-dashboard",
        status: "live",
      }),
      node("floating-ea", "Operating Assistant", "frontend", 40, 130, {
        parentId: "group-ui",
        description: "SSE chat · workspace tools",
        icon: "sparkles",
        status: "live",
      }),
      node("intelligence", "OnwardAir Intelligence", "frontend", 40, 210, {
        parentId: "group-ui",
        description: "Scoped analytics workspace module",
        icon: "bar-chart-3",
        status: "live",
      }),
      node("group-api", "Server APIs", "group", 420, 40, {
        style: { width: 360, height: 280 },
      }),
      node("chat-api", "/api/executive-assistant/chat", "service", 40, 50, {
        parentId: "group-api",
        icon: "message-square",
        status: "live",
      }),
      node("runtime", "assistant-runtime", "service", 40, 130, {
        parentId: "group-api",
        description: "Tools · streaming · tenancy filters",
        icon: "cpu",
        status: "live",
      }),
      node("openai-client", "openai-client.ts", "service", 40, 210, {
        parentId: "group-api",
        description: "Responses API wrapper · retries",
        icon: "bot",
        status: "live",
      }),
      node("openai-cloud", "OpenAI API", "integration", 840, 120, {
        description: `OPENAI_API_KEY · model ${defaultModel}`,
        icon: "cloud",
        status: "live",
        badges: [{ label: "Server-only", tone: "amber" }],
      }),
      node("ea-tables", "EA persistence", "database", 840, 280, {
        description: "executive_assistant_conversations · trust tables",
        docSectionSlug: "supabase-stack",
        icon: "database",
        status: "live",
      }),
      node("domain-tools", "Workspace domain tools", "service", 840, 380, {
        description: "CRM · HR · finance · portals read via service role",
        icon: "wrench",
        status: "live",
      }),
    ],
    edges: [
      { id: "e-ui-chat", source: "floating-ea", target: "chat-api", animated: true },
      { id: "e-cc-runtime", source: "command-centre", target: "runtime" },
      { id: "e-chat-runtime", source: "chat-api", target: "runtime", animated: true },
      { id: "e-runtime-client", source: "runtime", target: "openai-client", animated: true },
      { id: "e-client-cloud", source: "openai-client", target: "openai-cloud", animated: true },
      { id: "e-runtime-domain", source: "runtime", target: "domain-tools", label: "tools" },
      { id: "e-runtime-db", source: "runtime", target: "ea-tables" },
      { id: "e-intel-runtime", source: "intelligence", target: "runtime", label: "pack" },
    ],
  };
}

export type WorkspaceDiagramProfile = {
  sectionSlug: string;
  title: string;
  slug: string;
  host: string;
  workspaceType: string;
  status: string;
  highlights: string[];
  portalNote?: string;
};

export const WORKSPACE_DIAGRAM_PROFILES: readonly WorkspaceDiagramProfile[] = [
  {
    sectionSlug: "workspace-internal",
    title: "Workspace — Internal (Unit311)",
    slug: "unit311",
    host: "internal.unit311central.com",
    workspaceType: "Internal",
    status: "Active",
    highlights: [
      "Full Internal Ops UI (testflighthub)",
      "Unit311 Details · Corporate Information",
      "All modules · service-role tenancy",
    ],
  },
  {
    sectionSlug: "workspace-demo",
    title: "Workspace — Demo",
    slug: "demo",
    host: "demo.unit311central.com",
    workspaceType: "Demo",
    status: "Active",
    highlights: [
      "Same build as Internal · isolated workspace_id",
      "Sales / training sandbox",
      "Permanent demo tenant",
    ],
  },
  {
    sectionSlug: "workspace-onwardair",
    title: "Workspace — OnwardAir",
    slug: "onwardair",
    host: "onwardair.unit311central.com",
    workspaceType: "Customer",
    status: "Active",
    highlights: [
      "Aviation operations workspace",
      "Client portals · /portals",
      "Overview invite frozen Aug 2026",
    ],
    portalNote: "Client portal pack · onwardair alias onward.*",
  },
  {
    sectionSlug: "workspace-abhi",
    title: "Workspace — ABHI",
    slug: "abhi",
    host: "abhi.unit311central.com",
    workspaceType: "Customer",
    status: "Active",
    highlights: [
      "HealthTech member portals",
      "LMS · HR · operations modules",
      "Centrak portal provisioning",
    ],
    portalNote: "Member portal pack",
  },
  {
    sectionSlug: "workspace-talantonimpact",
    title: "Workspace — Talanton Impact",
    slug: "talantonimpact",
    host: "talantonimpact.unit311central.com",
    workspaceType: "Customer",
    status: "Active",
    highlights: [
      "Portfolio stewardship workspace",
      "Company portals · board pack",
      "EA talanton tool pack",
    ],
    portalNote: "Portfolio portal · talanton host alias",
  },
] as const;

export function createWorkspaceHighLevelDiagram(profile: WorkspaceDiagramProfile): ArchitectureDiagramDocument {
  const highlightNodes = profile.highlights.map((text, index) =>
    node(`highlight-${index}`, text.split("·")[0]?.trim() ?? text, "service", 40, 50 + index * 72, {
      parentId: "group-highlights",
      description: text,
      icon: "check-circle",
      status: "live",
    }),
  );

  const edges: ArchitectureDiagramEdge[] = [
    { id: "e-host-mw", source: "host", target: "middleware", animated: true },
    { id: "e-mw-app", source: "middleware", target: "next-app", animated: true },
    { id: "e-app-ws", source: "next-app", target: "workspace-row", label: "workspace_id" },
    { id: "e-ws-db", source: "workspace-row", target: "supabase", animated: true },
  ];

  if (profile.portalNote) {
    edges.push({ id: "e-ws-portal", source: "workspace-row", target: "portals", label: "portals" });
  }

  return {
    version: 1,
    viewport: { x: 0, y: 0, zoom: 0.88 },
    meta: {
      generator: "workspace-live",
      title: profile.title,
      workspaceSlug: profile.slug,
      generatedAt: new Date().toISOString(),
      liveRefresh: true,
    },
    nodes: [
      node("host", profile.host, "frontend", 80, 40, {
        description: `Canonical host · slug ${profile.slug}`,
        icon: "globe",
        status: "live",
        badges: [{ label: profile.workspaceType, tone: "sky" }],
      }),
      node("middleware", "Vercel middleware", "service", 400, 40, {
        description: "Rewrite /ws/[slug] or internal dashboard",
        icon: "git-branch",
        status: "live",
      }),
      node("next-app", "Next.js workspace shell", "frontend", 720, 40, {
        description: "Shared monorepo deployment",
        icon: "layout-dashboard",
        status: "live",
      }),
      node("workspace-row", profile.slug, "database", 400, 180, {
        description: `${profile.workspaceType} · ${profile.status}`,
        icon: "building-2",
        status: "live",
      }),
      node("supabase", "Supabase tenancy", "database", 720, 180, {
        description: "workspaces.id · workspace_id filters",
        docSectionSlug: "supabase-stack",
        icon: "database",
        status: "live",
      }),
      node("group-highlights", "Workspace highlights", "group", 80, 300, {
        style: { width: 520, height: highlightNodes.length * 72 + 70 },
      }),
      ...highlightNodes,
      ...(profile.portalNote
        ? [
            node("portals", "External portals", "frontend", 640, 320, {
              description: profile.portalNote,
              icon: "users",
              status: "live",
            }),
          ]
        : []),
    ],
    edges,
  };
}

export type LiveSeedTemplate =
  | "vercel-stack"
  | "supabase-stack"
  | "codebase-stack"
  | "openai-stack"
  | "workspace-internal"
  | "workspace-demo"
  | "workspace-onwardair"
  | "workspace-abhi"
  | "workspace-talantonimpact"
  | "platform-overview-live";

export function createLiveArchitectureDiagram(
  template: LiveSeedTemplate,
  cwd = process.cwd(),
): ArchitectureDiagramDocument {
  switch (template) {
    case "vercel-stack":
      return createVercelStackDiagram(cwd);
    case "supabase-stack":
      return createSupabaseStackDiagram(cwd);
    case "codebase-stack":
      return createCodebaseStackDiagram(cwd);
    case "openai-stack":
      return createOpenAiStackDiagram(cwd);
    case "workspace-internal":
    case "workspace-demo":
    case "workspace-onwardair":
    case "workspace-abhi":
    case "workspace-talantonimpact": {
      const profile = WORKSPACE_DIAGRAM_PROFILES.find((entry) => entry.sectionSlug === template);
      if (!profile) throw new Error(`Unknown workspace template ${template}`);
      return createWorkspaceHighLevelDiagram(profile);
    }
    case "platform-overview-live":
      return createPlatformOverviewLiveDiagram(cwd);
    default:
      throw new Error(`Unknown live template ${template satisfies never}`);
  }
}

export function createPlatformOverviewLiveDiagram(cwd = process.cwd()): ArchitectureDiagramDocument {
  const vercelDoc = safeReadDoc(resolveVercelArchitectureDocPath(cwd), VERCEL_DOC_FALLBACK);
  const vercel = parseVercelArchitectureDoc(vercelDoc.markdown);
  const githubDoc = safeReadDoc(resolveGithubArchitectureDocPath(cwd), CODEBASE_DOC_FALLBACK);
  const github = parseGithubArchitectureDoc(githubDoc.markdown);

  const workspaceHosts = WORKSPACE_DIAGRAM_PROFILES.map((profile, index) =>
    node(`ws-${profile.slug}`, profile.slug, "frontend", 40, 50 + index * 64, {
      parentId: "group-workspaces",
      description: profile.host,
      docSectionSlug: profile.sectionSlug,
      icon: "building-2",
      status: "live",
    }),
  );

  return {
    version: 1,
    viewport: { x: 0, y: 0, zoom: 0.68 },
    meta: {
      generator: "platform-overview-live",
      title: "Platform Overview",
      generatedAt: new Date().toISOString(),
      liveRefresh: true,
      sources: [
        "docs/VERCEL_ARCHITECTURE.md",
        "docs/GITHUB_ARCHITECTURE.md",
        "docs/WORKSPACE_ARCHITECTURE.md",
      ],
    },
    nodes: [
      node("group-edge", "Edge & delivery", "group", 40, 40, {
        style: { width: 360, height: 240 },
      }),
      node("vercel", "Vercel", "storage", 50, 50, {
        parentId: "group-edge",
        description: vercel.project,
        docSectionSlug: "vercel-stack",
        icon: "cloud",
        status: "live",
      }),
      node("dns", "DNS + SSL", "integration", 50, 120, {
        parentId: "group-edge",
        description: "unit311central.com · wildcard *.unit311central.com",
        icon: "shield",
        status: "live",
      }),
      node("middleware", "Edge middleware", "service", 50, 190, {
        parentId: "group-edge",
        description: "Host routing · portals · workspace slug",
        icon: "git-branch",
        status: "live",
      }),

      node("group-app", "Application", "group", 440, 40, {
        style: { width: 360, height: 240 },
      }),
      node("nextjs", github.product, "frontend", 50, 50, {
        parentId: "group-app",
        description: "Next.js App Router monorepo",
        docSectionSlug: "codebase-stack",
        icon: "code",
        status: "live",
      }),
      node("marketing", "Marketing site", "frontend", 50, 120, {
        parentId: "group-app",
        description: vercel.productionUrl,
        docSectionSlug: "website",
        icon: "globe",
        status: "live",
      }),
      node("internal-app", "Internal Ops", "frontend", 50, 190, {
        parentId: "group-app",
        description: "internal.unit311central.com",
        docSectionSlug: "workspace-internal",
        icon: "layout-dashboard",
        status: "live",
      }),

      node("group-data", "Data & AI", "group", 840, 40, {
        style: { width: 360, height: 240 },
      }),
      node("supabase", "Supabase", "database", 50, 50, {
        parentId: "group-data",
        description: "kkxtvzxqmbacjatkiupq · Postgres · Storage",
        docSectionSlug: "supabase-stack",
        icon: "database",
        status: "live",
      }),
      node("openai", "OpenAI", "integration", 50, 120, {
        parentId: "group-data",
        description: "Executive Assistant · Responses API",
        docSectionSlug: "openai-stack",
        icon: "bot",
        status: "live",
      }),
      node("integrations", "Integrations", "integration", 50, 190, {
        parentId: "group-data",
        description: "Wise · Stripe · Zoho · WebRTC",
        docSectionSlug: "integrations",
        icon: "plug",
        status: "live",
      }),

      node("group-workspaces", "Active workspaces", "group", 40, 320, {
        style: { width: 520, height: workspaceHosts.length * 64 + 70 },
      }),
      ...workspaceHosts,

      node("login", "Shared login", "frontend", 600, 360, {
        description: "unit311central.com/login · cookie .unit311central.com",
        docSectionSlug: "authentication",
        icon: "key-round",
        status: "live",
      }),
      node("ea-platform", "Executive AI Platform", "service", 600, 460, {
        description: "Command Centre · Operating Assistant",
        docSectionSlug: "ai-agent",
        icon: "sparkles",
        status: "live",
      }),
    ],
    edges: [
      { id: "e-dns-vercel", source: "dns", target: "vercel" },
      { id: "e-vercel-mw", source: "vercel", target: "middleware", animated: true },
      { id: "e-mw-next", source: "middleware", target: "nextjs", animated: true },
      { id: "e-next-marketing", source: "nextjs", target: "marketing" },
      { id: "e-next-internal", source: "nextjs", target: "internal-app" },
      { id: "e-next-supabase", source: "nextjs", target: "supabase", label: "service role" },
      { id: "e-next-openai", source: "nextjs", target: "openai" },
      { id: "e-internal-ws", source: "internal-app", target: "group-workspaces" },
      { id: "e-login-ws", source: "login", target: "group-workspaces", label: "session" },
      { id: "e-ea-openai", source: "ea-platform", target: "openai", animated: true },
      { id: "e-ea-supabase", source: "ea-platform", target: "supabase" },
    ],
  };
}

export function isLiveSeedTemplate(
  value: string | null | undefined,
): value is LiveSeedTemplate {
  return (
    value === "vercel-stack" ||
    value === "supabase-stack" ||
    value === "codebase-stack" ||
    value === "openai-stack" ||
    value === "workspace-internal" ||
    value === "workspace-demo" ||
    value === "workspace-onwardair" ||
    value === "workspace-abhi" ||
    value === "workspace-talantonimpact" ||
    value === "platform-overview-live"
  );
}
