import "server-only";

import type { ManagedClient } from "@/lib/client-management-data";
import type {
  BrowseEntry,
  BreadcrumbSegment,
  FileFolder,
  FileObject,
} from "@/lib/internal-files-data";

const NOW = "2026-08-16T10:00:00.000Z";

const INTERNAL_FOLDERS: FileFolder[] = [
  {
    id: "nst-int-board",
    name: "Board",
    parentId: null,
    categoryId: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "nst-int-finance",
    name: "Finance",
    parentId: null,
    categoryId: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "nst-int-engineering",
    name: "Engineering",
    parentId: null,
    categoryId: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "nst-int-hr",
    name: "Human Resources",
    parentId: null,
    categoryId: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "nst-int-clients",
    name: "Client Deliverables",
    parentId: null,
    categoryId: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "nst-int-sheffield",
    name: "Sheffield Precision Engineering",
    parentId: "nst-int-clients",
    categoryId: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "nst-int-bristol",
    name: "Bristol Composites Ltd",
    parentId: "nst-int-clients",
    categoryId: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const INTERNAL_FILES: FileObject[] = [
  {
    id: "nst-int-file-1",
    name: "Q3_Board_Pack_Draft.pdf",
    folderId: "nst-int-board",
    categoryId: null,
    storagePath: "internal/q3-board-pack.pdf",
    mimeType: "application/pdf",
    extension: "pdf",
    sizeBytes: 2_850_000,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "nst-int-file-2",
    name: "Monthly_Opex_Summary.xlsx",
    folderId: "nst-int-finance",
    categoryId: null,
    storagePath: "internal/monthly-opex.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extension: "xlsx",
    sizeBytes: 420_000,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "nst-int-file-3",
    name: "Edge_Controller_Release_Notes.pdf",
    folderId: "nst-int-engineering",
    categoryId: null,
    storagePath: "internal/edge-release-notes.pdf",
    mimeType: "application/pdf",
    extension: "pdf",
    sizeBytes: 980_000,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "nst-int-file-4",
    name: "NST_SOW_Sheffield_v3.pdf",
    folderId: "nst-int-sheffield",
    categoryId: null,
    storagePath: "internal/nst-sow-sheffield.pdf",
    mimeType: "application/pdf",
    extension: "pdf",
    sizeBytes: 1_650_000,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const EXTERNAL_FOLDERS: FileFolder[] = [
  {
    id: "nst-ext-clients",
    name: "Client Deliverables",
    parentId: null,
    categoryId: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "nst-ext-partners",
    name: "Partner Exchanges",
    parentId: null,
    categoryId: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "nst-ext-sheffield",
    name: "Sheffield Precision Engineering",
    parentId: "nst-ext-clients",
    categoryId: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "nst-ext-bristol",
    name: "Bristol Composites Ltd",
    parentId: "nst-ext-clients",
    categoryId: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const EXTERNAL_FILES: FileObject[] = [
  {
    id: "nst-ext-file-1",
    name: "NST_SOW_Sheffield_v3.pdf",
    folderId: "nst-ext-sheffield",
    categoryId: null,
    storagePath: "external/nst-sow-sheffield.pdf",
    mimeType: "application/pdf",
    extension: "pdf",
    sizeBytes: 1_850_000,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "nst-ext-file-2",
    name: "Bristol_Pilot_Runbook.docx",
    folderId: "nst-ext-bristol",
    categoryId: null,
    storagePath: "external/bristol-runbook.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extension: "docx",
    sizeBytes: 520_000,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "nst-ext-file-3",
    name: "NDA_Template.docx",
    folderId: "nst-ext-partners",
    categoryId: null,
    storagePath: "external/nda-template.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extension: "docx",
    sizeBytes: 120_000,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const CLIENT_ROOTS: Record<
  string,
  { rootFolderId: string; rootFolderName: string; folders: FileFolder[]; files: FileObject[] }
> = {
  "nst-cli-sheffield": {
    rootFolderId: "nst-cli-root-sheffield",
    rootFolderName: "Sheffield Precision Engineering",
    folders: [
      {
        id: "nst-cli-root-sheffield",
        name: "Sheffield Precision Engineering",
        parentId: null,
        categoryId: null,
        createdAt: NOW,
        updatedAt: NOW,
      },
      {
        id: "nst-cli-sheffield-sow",
        name: "Statements of Work",
        parentId: "nst-cli-root-sheffield",
        categoryId: null,
        createdAt: NOW,
        updatedAt: NOW,
      },
      {
        id: "nst-cli-sheffield-ops",
        name: "Operations",
        parentId: "nst-cli-root-sheffield",
        categoryId: null,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
    files: [
      {
        id: "nst-cli-sheffield-file-1",
        name: "NST_SOW_Sheffield_v3.pdf",
        folderId: "nst-cli-sheffield-sow",
        categoryId: null,
        storagePath: "clients/sheffield/sow.pdf",
        mimeType: "application/pdf",
        extension: "pdf",
        sizeBytes: 1_850_000,
        createdAt: NOW,
        updatedAt: NOW,
      },
      {
        id: "nst-cli-sheffield-file-2",
        name: "Edge_Rollout_Status.xlsx",
        folderId: "nst-cli-sheffield-ops",
        categoryId: null,
        storagePath: "clients/sheffield/status.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        extension: "xlsx",
        sizeBytes: 310_000,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
  },
  "nst-cli-bristol": {
    rootFolderId: "nst-cli-root-bristol",
    rootFolderName: "Bristol Composites Ltd",
    folders: [
      {
        id: "nst-cli-root-bristol",
        name: "Bristol Composites Ltd",
        parentId: null,
        categoryId: null,
        createdAt: NOW,
        updatedAt: NOW,
      },
      {
        id: "nst-cli-bristol-pilot",
        name: "Predictive Maintenance Pilot",
        parentId: "nst-cli-root-bristol",
        categoryId: null,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
    files: [
      {
        id: "nst-cli-bristol-file-1",
        name: "Bristol_Pilot_Scope.pdf",
        folderId: "nst-cli-bristol-pilot",
        categoryId: null,
        storagePath: "clients/bristol/scope.pdf",
        mimeType: "application/pdf",
        extension: "pdf",
        sizeBytes: 720_000,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
  },
  "nst-cli-peak": {
    rootFolderId: "nst-cli-root-peak",
    rootFolderName: "Peak District Breweries",
    folders: [
      {
        id: "nst-cli-root-peak",
        name: "Peak District Breweries",
        parentId: null,
        categoryId: null,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
    files: [
      {
        id: "nst-cli-peak-file-1",
        name: "Tank_Monitoring_Config.json",
        folderId: "nst-cli-root-peak",
        categoryId: null,
        storagePath: "clients/peak/config.json",
        mimeType: "application/json",
        extension: "json",
        sizeBytes: 24_000,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
  },
};

function buildBreadcrumb(
  folderId: string | null,
  folders: FileFolder[],
  rootLabel: string,
): BreadcrumbSegment[] {
  const segments: BreadcrumbSegment[] = [{ id: null, name: rootLabel }];
  if (!folderId) return segments;

  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const chain: FileFolder[] = [];
  let current = byId.get(folderId);

  while (current) {
    chain.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  for (const folder of chain) {
    segments.push({ id: folder.id, name: folder.name });
  }

  return segments;
}

function browseTree(options: {
  folderId: string | null;
  query?: string;
  folders: FileFolder[];
  files: FileObject[];
  rootLabel: string;
}): { entries: BrowseEntry[]; breadcrumb: BreadcrumbSegment[] } {
  const query = options.query?.trim().toLowerCase() ?? "";
  const folderId = options.folderId;

  const childFolders = options.folders.filter((folder) => {
    if (query) return folder.name.toLowerCase().includes(query);
    return folder.parentId === folderId;
  });

  const childFiles = options.files.filter((file) => {
    if (query) return file.name.toLowerCase().includes(query);
    return file.folderId === folderId;
  });

  const entries: BrowseEntry[] = [
    ...childFolders.map((item) => ({ kind: "folder" as const, item })),
    ...childFiles.map((item) => ({ kind: "file" as const, item })),
  ];

  entries.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
    return a.item.name.localeCompare(b.item.name);
  });

  return {
    entries,
    breadcrumb: buildBreadcrumb(folderId, options.folders, options.rootLabel),
  };
}

export function browseNorthstarInternalFiles(options: {
  folderId?: string | null;
  query?: string;
}) {
  return browseTree({
    folderId: options.folderId ?? null,
    query: options.query,
    folders: INTERNAL_FOLDERS,
    files: INTERNAL_FILES,
    rootLabel: "Internal Files",
  });
}

export function browseNorthstarExternalFiles(options: {
  folderId?: string | null;
  query?: string;
}) {
  return browseTree({
    folderId: options.folderId ?? null,
    query: options.query,
    folders: EXTERNAL_FOLDERS,
    files: EXTERNAL_FILES,
    rootLabel: "External Files",
  });
}

export function browseNorthstarClientFiles(options: {
  clientId: string;
  folderId?: string | null;
  query?: string;
}) {
  const workspace = CLIENT_ROOTS[options.clientId];
  if (!workspace) {
    return {
      entries: [] as BrowseEntry[],
      breadcrumb: [{ id: null, name: "Client Files" }] as BreadcrumbSegment[],
    };
  }

  const effectiveFolderId = options.folderId?.trim() || workspace.rootFolderId;
  const result = browseTree({
    folderId: effectiveFolderId,
    query: options.query,
    folders: workspace.folders,
    files: workspace.files,
    rootLabel: workspace.rootFolderName,
  });

  return result;
}

export function ensureNorthstarClientFilesRoot(clientId: string, client: Pick<ManagedClient, "id" | "companyName"> & Partial<ManagedClient>) {
  const workspace = CLIENT_ROOTS[clientId];
  if (!workspace) {
    return {
      ...client,
      filesFolderId: `nst-cli-root-${clientId.replace("nst-cli-", "")}`,
      filesFolderName: client.companyName,
    };
  }

  return {
    ...client,
    filesFolderId: workspace.rootFolderId,
    filesFolderName: workspace.rootFolderName,
  };
}

export function enrichNorthstarClientsWithFilesRoots(clients: ManagedClient[]): ManagedClient[] {
  return clients.map(
    (client) => ensureNorthstarClientFilesRoot(client.id, client) as ManagedClient,
  );
}
