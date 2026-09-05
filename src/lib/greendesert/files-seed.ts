import { createExternalFolder, getOrCreateExternalFilesRoot } from "@/lib/external-files-service";
import { requireFilesSupabase } from "@/lib/internal-files-service";

/** Idempotency marker — root-level folder name for the seeded internal tree. */
export const GREENDESERT_INTERNAL_FILES_MARKER = "Operations";

type FolderSeed = {
  name: string;
  children?: FolderSeed[];
  files?: { name: string; ext: string; mime: string; sizeBytes: number }[];
};

export const GREENDESERT_INTERNAL_FOLDER_TREE: FolderSeed[] = [
  {
    name: "Operations",
    children: [
      {
        name: "Logistics & Shipping",
        files: [
          {
            name: "GD7829345612_Shipment_Manifest.pdf",
            ext: "pdf",
            mime: "application/pdf",
            sizeBytes: 640_000,
          },
          {
            name: "Jeddah_Delivery_Runbook.docx",
            ext: "docx",
            mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            sizeBytes: 210_000,
          },
        ],
      },
      {
        name: "Site Readiness",
        files: [
          {
            name: "Riyadh_Deployment_Checklist.xlsx",
            ext: "xlsx",
            mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            sizeBytes: 380_000,
          },
        ],
      },
    ],
  },
  {
    name: "Engineering",
    children: [
      {
        name: "Reactor Modules",
        files: [
          {
            name: "Module_Assembly_Spec_v2.pdf",
            ext: "pdf",
            mime: "application/pdf",
            sizeBytes: 1_920_000,
          },
        ],
      },
      {
        name: "Safety & Compliance",
        files: [
          {
            name: "SA_Regulatory_Brief_Sep2026.pdf",
            ext: "pdf",
            mime: "application/pdf",
            sizeBytes: 890_000,
          },
        ],
      },
    ],
  },
  {
    name: "Client Deliverables",
    children: [
      {
        name: "Jeddah Technologies",
        files: [
          {
            name: "Reactor_Deployment_SOW.pdf",
            ext: "pdf",
            mime: "application/pdf",
            sizeBytes: 1_650_000,
          },
          {
            name: "Integration_Milestone_Plan.xlsx",
            ext: "xlsx",
            mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            sizeBytes: 420_000,
          },
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
          {
            name: "Board_Pack_Sep_2026.pdf",
            ext: "pdf",
            mime: "application/pdf",
            sizeBytes: 3_100_000,
          },
        ],
      },
    ],
  },
  {
    name: "Finance",
    children: [
      {
        name: "Budget & Forecasts",
        files: [
          {
            name: "FY2026_Opex_Forecast.xlsx",
            ext: "xlsx",
            mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            sizeBytes: 510_000,
          },
        ],
      },
    ],
  },
  {
    name: "Human Resources",
    children: [
      {
        name: "Templates",
        files: [
          {
            name: "Offer_Letter_Template.docx",
            ext: "docx",
            mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            sizeBytes: 95_000,
          },
        ],
      },
    ],
  },
];

const EXTERNAL_CLIENT_DELIVERABLES: FolderSeed = {
  name: "Client Deliverables",
  children: [
    {
      name: "Jeddah Technologies",
      files: [
        {
          name: "Quarterly_Status_Report_Q3.pdf",
          ext: "pdf",
          mime: "application/pdf",
          sizeBytes: 1_180_000,
        },
      ],
    },
  ],
};

const EXTERNAL_PARTNER_EXCHANGES: FolderSeed = {
  name: "Partner Exchanges",
  children: [
    {
      name: "Regulatory Liaison",
      files: [
        {
          name: "NDA_Template.docx",
          ext: "docx",
          mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          sizeBytes: 120_000,
        },
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

  const storagePath = `greendesert/${workspaceId}/${folderId}/${file.name}`;
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

      const storagePath = `greendesert/external/${workspaceId}/${folder.id}/${file.name}`;
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

/** Idempotent Green Desert internal + external file folder trees. */
export async function ensureGreenDesertFilesSeeded(workspaceId: string): Promise<void> {
  const marker = await findInternalFolder(
    workspaceId,
    GREENDESERT_INTERNAL_FILES_MARKER,
    null,
  );
  if (!marker) {
    await seedInternalTree(workspaceId, GREENDESERT_INTERNAL_FOLDER_TREE, null);
  }

  const root = await getOrCreateExternalFilesRoot({ workspaceId });
  const clientDeliverables = await findExternalChild(
    workspaceId,
    EXTERNAL_CLIENT_DELIVERABLES.name,
    root.id,
  );
  if (!clientDeliverables) {
    await seedExternalTree(workspaceId, EXTERNAL_CLIENT_DELIVERABLES, root.id);
  }

  const partnerExchanges = await findExternalChild(
    workspaceId,
    EXTERNAL_PARTNER_EXCHANGES.name,
    root.id,
  );
  if (!partnerExchanges) {
    await seedExternalTree(workspaceId, EXTERNAL_PARTNER_EXCHANGES, root.id);
  }
}
