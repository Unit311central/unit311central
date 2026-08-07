import { createExternalFolder, getOrCreateExternalFilesRoot } from "@/lib/external-files-service";
import { requireFilesSupabase } from "@/lib/internal-files-service";

const INTERNAL_MARKER = "Fund Operations";

type FolderSeed = {
  name: string;
  children?: FolderSeed[];
  files?: { name: string; ext: string; mime: string; sizeBytes: number }[];
};

const INTERNAL_TREE: FolderSeed[] = [
  {
    name: "Fund Operations",
    children: [
      {
        name: "LP Reports & Capital Calls",
        files: [
          { name: "Q2 2026 LP Report — Impact Fund.pdf", ext: "pdf", mime: "application/pdf", sizeBytes: 2_100_000 },
          { name: "Capital Call Notice — Momentum Fund.xlsx", ext: "xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", sizeBytes: 420_000 },
        ],
      },
      {
        name: "Fund Accounting",
        files: [
          { name: "NAV Workbook — Jul 2026.xlsx", ext: "xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", sizeBytes: 890_000 },
        ],
      },
    ],
  },
  {
    name: "Investments",
    children: [
      {
        name: "Due Diligence",
        files: [
          { name: "DD Checklist — East Africa Agri.docx", ext: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", sizeBytes: 180_000 },
        ],
      },
      {
        name: "IC Memos",
        files: [
          { name: "IC Memo — Pezesha Series B.pdf", ext: "pdf", mime: "application/pdf", sizeBytes: 1_450_000 },
          { name: "IC Memo — ARC Ride follow-on.pdf", ext: "pdf", mime: "application/pdf", sizeBytes: 1_280_000 },
        ],
      },
    ],
  },
  {
    name: "Board & Governance",
    children: [
      {
        name: "Board Packs",
        files: [
          { name: "Board Pack — Aug 2026.pdf", ext: "pdf", mime: "application/pdf", sizeBytes: 3_200_000 },
        ],
      },
      {
        name: "Policies & Compliance",
        files: [
          { name: "ESG Policy v3.2.pdf", ext: "pdf", mime: "application/pdf", sizeBytes: 640_000 },
        ],
      },
    ],
  },
  {
    name: "Marketing & Stories",
    children: [
      {
        name: "Brand Assets",
        files: [
          { name: "Talanton Logo Pack.zip", ext: "zip", mime: "application/zip", sizeBytes: 12_400_000 },
        ],
      },
      {
        name: "Newsletters",
        files: [
          { name: "Portfolio Update — Jul 2026.pdf", ext: "pdf", mime: "application/pdf", sizeBytes: 980_000 },
        ],
      },
    ],
  },
  {
    name: "HR & People",
    children: [
      {
        name: "Templates",
        files: [
          { name: "Offer Letter Template.docx", ext: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", sizeBytes: 95_000 },
        ],
      },
    ],
  },
];

const EXTERNAL_PORTFOLIO_NAMES = ["ARC Ride", "Burn Manufacturing", "Pezesha"];

const EXTERNAL_PARTNER_FILES: FolderSeed = {
  name: "LP & Partner Exchanges",
  children: [
    {
      name: "Steward Circle",
      files: [
        { name: "Steward LP Update — Q2.pdf", ext: "pdf", mime: "application/pdf", sizeBytes: 1_100_000 },
      ],
    },
    {
      name: "Impact Fund LPs",
      files: [
        { name: "Quarterly Letter — Impact Fund.pdf", ext: "pdf", mime: "application/pdf", sizeBytes: 1_350_000 },
      ],
    },
  ],
};

async function findInternalFolder(
  workspaceId: string,
  name: string,
  parentId: string | null,
) {
  const supabase = requireFilesSupabase();
  let query = supabase
    .from("file_folders")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("name", name);

  if (parentId) {
    query = query.eq("parent_id", parentId);
  } else {
    query = query.is("parent_id", null);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data?.id as string | undefined;
}

async function createInternalFolder(
  workspaceId: string,
  name: string,
  parentId: string | null,
): Promise<string> {
  const existing = await findInternalFolder(workspaceId, name, parentId);
  if (existing) return existing;

  const supabase = requireFilesSupabase();
  const { data, error } = await supabase
    .from("file_folders")
    .insert({
      name,
      parent_id: parentId,
      category_id: null,
      workspace_id: workspaceId,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

async function seedInternalFile(
  workspaceId: string,
  folderId: string,
  file: { name: string; ext: string; mime: string; sizeBytes: number },
) {
  const supabase = requireFilesSupabase();
  const { data: existing } = await supabase
    .from("file_objects")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("folder_id", folderId)
    .eq("name", file.name)
    .maybeSingle();
  if (existing) return;

  const storagePath = `talanton/${workspaceId}/${folderId}/${file.name}`;
  const { error } = await supabase.from("file_objects").insert({
    workspace_id: workspaceId,
    name: file.name,
    folder_id: folderId,
    category_id: null,
    storage_path: storagePath,
    mime_type: file.mime,
    extension: file.ext,
    size_bytes: file.sizeBytes,
  });
  if (error) throw new Error(error.message);
}

async function seedInternalTree(
  workspaceId: string,
  nodes: FolderSeed[],
  parentId: string | null,
) {
  for (const node of nodes) {
    const folderId = await createInternalFolder(workspaceId, node.name, parentId);
    if (node.files) {
      for (const file of node.files) {
        await seedInternalFile(workspaceId, folderId, file);
      }
    }
    if (node.children?.length) {
      await seedInternalTree(workspaceId, node.children, folderId);
    }
  }
}

async function seedExternalTree(
  workspaceId: string,
  node: FolderSeed,
  parentId: string,
) {
  const folder = await createExternalFolder(node.name, parentId, { workspaceId });
  if (node.files) {
    for (const file of node.files) {
      const supabase = requireFilesSupabase();
      const { data: existing } = await supabase
        .from("file_objects")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("folder_id", folder.id)
        .eq("name", file.name)
        .maybeSingle();
      if (existing) continue;

      const storagePath = `talanton/external/${workspaceId}/${folder.id}/${file.name}`;
      const { error } = await supabase.from("file_objects").insert({
        workspace_id: workspaceId,
        name: file.name,
        folder_id: folder.id,
        category_id: null,
        storage_path: storagePath,
        mime_type: file.mime,
        extension: file.ext,
        size_bytes: file.sizeBytes,
      });
      if (error) throw new Error(error.message);
    }
  }
  if (node.children?.length) {
    for (const child of node.children) {
      await seedExternalTree(workspaceId, child, folder.id);
    }
  }
}

/**
 * Idempotent Talanton internal + external file folder trees.
 */
async function findExternalChild(
  workspaceId: string,
  name: string,
  parentId: string,
): Promise<string | undefined> {
  const supabase = requireFilesSupabase();
  const { data, error } = await supabase
    .from("file_folders")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("external_scope", true)
    .eq("name", name)
    .eq("parent_id", parentId)
    .maybeSingle();
  if (error) {
    if (error.message.includes("external_scope")) return undefined;
    throw new Error(error.message);
  }
  return data?.id as string | undefined;
}

export async function ensureTalantonFilesSeeded(workspaceId: string): Promise<void> {
  const marker = await findInternalFolder(workspaceId, INTERNAL_MARKER, null);
  if (!marker) {
    await seedInternalTree(workspaceId, INTERNAL_TREE, null);
  }

  const root = await getOrCreateExternalFilesRoot({ workspaceId });
  let portfolioParent = await findExternalChild(workspaceId, "Portfolio Companies", root.id);
  if (!portfolioParent) {
    const folder = await createExternalFolder("Portfolio Companies", root.id, { workspaceId });
    portfolioParent = folder.id;
  }

  for (const name of EXTERNAL_PORTFOLIO_NAMES) {
    let portfolioFolderId = await findExternalChild(workspaceId, name, portfolioParent);
    if (!portfolioFolderId) {
      const folder = await createExternalFolder(name, portfolioParent, { workspaceId });
      portfolioFolderId = folder.id;
    }
    const folder = { id: portfolioFolderId };
    const supabase = requireFilesSupabase();
    const fileName = `${name.replace(/\s+/g, "_")}_Quarterly_Update.pdf`;
    const { data: existing } = await supabase
      .from("file_objects")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("folder_id", folder.id)
      .eq("name", fileName)
      .maybeSingle();
    if (!existing) {
      const { error } = await supabase.from("file_objects").insert({
        workspace_id: workspaceId,
        name: fileName,
        folder_id: folder.id,
        category_id: null,
        storage_path: `talanton/external/${workspaceId}/${folder.id}/${fileName}`,
        mime_type: "application/pdf",
        extension: "pdf",
        size_bytes: 1_250_000,
      });
      if (error) throw new Error(error.message);
    }
  }

  const partnerRoot = await findExternalChild(workspaceId, EXTERNAL_PARTNER_FILES.name, root.id);
  if (!partnerRoot) {
    await seedExternalTree(workspaceId, EXTERNAL_PARTNER_FILES, root.id);
  }
}
