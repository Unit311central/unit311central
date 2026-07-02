import type { BrowseEntry, BreadcrumbSegment, FileFolder, FileObject } from "@/lib/internal-files-data";

const now = new Date().toISOString();

const EXTERNAL_FOLDERS: FileFolder[] = [
  {
    id: "ext-root-clients",
    name: "Client Deliverables",
    parentId: null,
    categoryId: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "ext-root-partners",
    name: "Partner Exchanges",
    parentId: null,
    categoryId: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "ext-venturi",
    name: "Venturi Aeronautical",
    parentId: "ext-root-clients",
    categoryId: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "ext-douro",
    name: "Douro Maritime Logistics",
    parentId: "ext-root-clients",
    categoryId: null,
    createdAt: now,
    updatedAt: now,
  },
];

const EXTERNAL_FILES: FileObject[] = [
  {
    id: "ext-file-1",
    name: "Q2 Site Report.pdf",
    folderId: "ext-venturi",
    categoryId: null,
    storagePath: "external/q2-site-report.pdf",
    mimeType: "application/pdf",
    extension: "pdf",
    sizeBytes: 2_450_000,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "ext-file-2",
    name: "Berth Volumetrics.xlsx",
    folderId: "ext-douro",
    categoryId: null,
    storagePath: "external/berth-volumetrics.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extension: "xlsx",
    sizeBytes: 890_000,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "ext-file-3",
    name: "NDA Template.docx",
    folderId: "ext-root-partners",
    categoryId: null,
    storagePath: "external/nda-template.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extension: "docx",
    sizeBytes: 120_000,
    createdAt: now,
    updatedAt: now,
  },
];

function buildBreadcrumb(folderId: string | null): BreadcrumbSegment[] {
  const segments: BreadcrumbSegment[] = [{ id: null, name: "External Files" }];
  if (!folderId) return segments;

  const byId = new Map(EXTERNAL_FOLDERS.map((folder) => [folder.id, folder]));
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

export function browseExternalFiles(options: {
  folderId: string | null;
  query?: string;
}): { entries: BrowseEntry[]; breadcrumb: BreadcrumbSegment[] } {
  const query = options.query?.trim().toLowerCase() ?? "";
  const folderId = options.folderId;

  const childFolders = EXTERNAL_FOLDERS.filter((folder) => folder.parentId === folderId);
  const childFiles = EXTERNAL_FILES.filter((file) => file.folderId === folderId);

  let entries: BrowseEntry[] = [
    ...childFolders.map((item) => ({ kind: "folder" as const, item })),
    ...childFiles.map((item) => ({ kind: "file" as const, item })),
  ];

  if (query) {
    entries = entries.filter((entry) => entry.item.name.toLowerCase().includes(query));
  }

  entries.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
    return a.item.name.localeCompare(b.item.name);
  });

  return {
    entries,
    breadcrumb: buildBreadcrumb(folderId),
  };
}
