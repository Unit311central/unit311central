import "server-only";

import {
  approveExpense,
  submitExpenseForApproval,
} from "@/lib/expense-management/approvals-service";
import {
  createExpenseCategory,
  ensureExpenseConfigSeeded,
  listExpenseCategories,
} from "@/lib/expense-management/config-service";
import type { ExpenseCategory } from "@/lib/expense-management/types";
import { createExpense, listExpenses } from "@/lib/financial-expenses-service";
import { billingCodeForSemanticCategory } from "@/lib/expenses-data";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";

export const UNIT311_TOM_EXPENSE_REFERENCE_PREFIX = "UNIT311-TOM-2026-";

export type TomExpenseSeedRow = {
  reference: string;
  item: string;
  description: string;
  amount: number;
  expenseDate: string;
  supplier: string;
  categoryKey: "equipment" | "consumable_prototyping" | "software";
  recurringAnnual?: boolean;
  nonVatReclaimable?: boolean;
};

export const UNIT311_TOM_EXPENSE_ROWS: TomExpenseSeedRow[] = [
  {
    reference: `${UNIT311_TOM_EXPENSE_REFERENCE_PREFIX}01`,
    item: "Bambu Lab H2S Printer",
    description: "FDM Printer for Prototyping Activities",
    amount: 1425.84,
    expenseDate: "2026-07-02",
    supplier: "Bambu Lab",
    categoryKey: "equipment",
  },
  {
    reference: `${UNIT311_TOM_EXPENSE_REFERENCE_PREFIX}02`,
    item: "Anycubic Photon P1, Anycubic Wash and Cure 3",
    description: "SLA Printer for Prototyping Activities",
    amount: 927.05,
    expenseDate: "2026-08-10",
    supplier: "Anycubic",
    categoryKey: "equipment",
  },
  {
    reference: `${UNIT311_TOM_EXPENSE_REFERENCE_PREFIX}03`,
    item: "3D Resyns",
    description: "SLA Resin · Non-VAT reclaimable",
    amount: 323.0,
    expenseDate: "2026-08-10",
    supplier: "3D Resyns",
    categoryKey: "consumable_prototyping",
    nonVatReclaimable: true,
  },
  {
    reference: `${UNIT311_TOM_EXPENSE_REFERENCE_PREFIX}04`,
    item: "interfaceworx.com cloudfare domain registration",
    description: "domain registration 2026 · Recurring — annual",
    amount: 7.7,
    expenseDate: "2026-08-20",
    supplier: "Cloudflare",
    categoryKey: "software",
    recurringAnnual: true,
  },
  {
    reference: `${UNIT311_TOM_EXPENSE_REFERENCE_PREFIX}05`,
    item: "Zoho Email",
    description: "interfaceworx.com email server (2 x users) · Recurring — annual",
    amount: 28.8,
    expenseDate: "2026-08-21",
    supplier: "Zoho",
    categoryKey: "software",
    recurringAnnual: true,
  },
  {
    reference: `${UNIT311_TOM_EXPENSE_REFERENCE_PREFIX}06`,
    item: "Thermometer, Filament, 3D printer Adhesive Glue",
    description: "Consumable (Prototyping)",
    amount: 56.96,
    expenseDate: "2026-06-30",
    supplier: "Amazon",
    categoryKey: "consumable_prototyping",
  },
  {
    reference: `${UNIT311_TOM_EXPENSE_REFERENCE_PREFIX}07`,
    item: "Silicone",
    description: "Consumable (Prototyping)",
    amount: 24.62,
    expenseDate: "2026-05-29",
    supplier: "Amazon",
    categoryKey: "consumable_prototyping",
  },
  {
    reference: `${UNIT311_TOM_EXPENSE_REFERENCE_PREFIX}08`,
    item: "Isomalt",
    description: "Consumable (Prototyping)",
    amount: 9.99,
    expenseDate: "2026-05-29",
    supplier: "Amazon",
    categoryKey: "consumable_prototyping",
  },
  {
    reference: `${UNIT311_TOM_EXPENSE_REFERENCE_PREFIX}09`,
    item: "IPA, Steel Tube",
    description: "Consumable (Prototyping)",
    amount: 32.95,
    expenseDate: "2026-08-19",
    supplier: "Amazon",
    categoryKey: "consumable_prototyping",
  },
  {
    reference: `${UNIT311_TOM_EXPENSE_REFERENCE_PREFIX}10`,
    item: "IPA (5L)",
    description: "Consumable (Prototyping)",
    amount: 23.95,
    expenseDate: "2026-08-18",
    supplier: "Amazon",
    categoryKey: "consumable_prototyping",
  },
  {
    reference: `${UNIT311_TOM_EXPENSE_REFERENCE_PREFIX}11`,
    item: "Paint Stirers, Mixing Cups",
    description: "Consumable (Prototyping)",
    amount: 34.98,
    expenseDate: "2026-07-07",
    supplier: "Amazon",
    categoryKey: "consumable_prototyping",
  },
  {
    reference: `${UNIT311_TOM_EXPENSE_REFERENCE_PREFIX}12`,
    item: "Silicone, Mould Release Spray, Mixing Cups",
    description: "Consumable (Prototyping)",
    amount: 100.22,
    expenseDate: "2026-07-08",
    supplier: "Amazon",
    categoryKey: "consumable_prototyping",
  },
];

export const UNIT311_TOM_EXPENSE_EXPECTED_TOTAL = UNIT311_TOM_EXPENSE_ROWS.reduce(
  (sum, row) => sum + row.amount,
  0,
);

type TomEmployee = {
  id: string;
  fullName: string;
  platformUserId: string | null;
  operatorId: string | null;
};

type CategoryMap = Record<TomExpenseSeedRow["categoryKey"], ExpenseCategory>;

const CATEGORY_SPECS: Record<
  TomExpenseSeedRow["categoryKey"],
  { name: string; code: string; glAccountCode: string }
> = {
  equipment: { name: "Equipment", code: "EQUIPMENT", glAccountCode: "5090" },
  consumable_prototyping: {
    name: "Consumables (Prototyping)",
    code: "CONSUMABLE_PROTO",
    glAccountCode: "5090",
  },
  software: { name: "Software", code: "SOFTWARE", glAccountCode: "5010" },
};

function buildPurpose(row: TomExpenseSeedRow) {
  const parts = [row.item.trim()];
  if (row.description.trim() && row.description !== row.item.trim()) {
    parts.push(row.description.trim());
  }
  return parts.join(" — ");
}

async function resolveUnit311WorkspaceId() {
  const supabase = createTenancyServerClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("id, slug")
    .eq("slug", INTERNAL_WORKSPACE_SLUG)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.id) {
    throw new Error(`Workspace slug=${INTERNAL_WORKSPACE_SLUG} was not found.`);
  }
  return { workspaceId: String(data.id), workspaceSlug: INTERNAL_WORKSPACE_SLUG };
}

async function resolveTomEmployee(workspaceId: string): Promise<TomEmployee> {
  const supabase = createTenancyServerClient();
  const { data, error } = await supabase
    .from("hr_employees")
    .select("id, full_name, preferred_name, platform_user_id, operator_id")
    .eq("workspace_id", workspaceId)
    .order("full_name", { ascending: true });

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const tomMatches = rows.filter((row) => {
    const full = String(row.full_name ?? "").trim();
    const preferred = String(row.preferred_name ?? "").trim();
    return /^tom\b/i.test(full) || /^tomás\b/i.test(full) || /^tom\b/i.test(preferred);
  });

  if (tomMatches.length === 0) {
    throw new Error(
      `No Tom employee found in workspace ${INTERNAL_WORKSPACE_SLUG}. Create or link Tom in HR first.`,
    );
  }

  if (tomMatches.length > 1) {
    const names = tomMatches.map((row) => row.full_name).join(", ");
    throw new Error(`Multiple Tom employees found (${names}). Resolve ambiguity before seeding.`);
  }

  const row = tomMatches[0]!;
  return {
    id: String(row.id),
    fullName: String(row.full_name),
    platformUserId: row.platform_user_id ? String(row.platform_user_id) : null,
    operatorId: row.operator_id ? String(row.operator_id) : null,
  };
}

async function ensureCategoryMap(workspaceId: string): Promise<CategoryMap> {
  await ensureExpenseConfigSeeded(workspaceId);
  let categories = await listExpenseCategories(workspaceId);
  const map = {} as CategoryMap;

  for (const [key, spec] of Object.entries(CATEGORY_SPECS) as Array<
    [TomExpenseSeedRow["categoryKey"], (typeof CATEGORY_SPECS)[TomExpenseSeedRow["categoryKey"]]]
  >) {
    let match =
      categories.find((cat) => cat.code === spec.code) ??
      categories.find((cat) => cat.name.toLowerCase() === spec.name.toLowerCase());

    if (!match) {
      match = await createExpenseCategory(workspaceId, {
        name: spec.name,
        code: spec.code,
        glAccountCode: spec.glAccountCode,
      });
      categories = [...categories, match];
    }

    map[key] = match;
  }

  return map;
}

function resolveSubmitterUserId(tom: TomEmployee) {
  return tom.platformUserId ?? tom.operatorId ?? "user-admin";
}

export type SeedUnit311TomExpensesResult = {
  ok: true;
  workspaceSlug: string;
  workspaceId: string;
  tomEmployeeId: string;
  tomEmployeeName: string;
  created: number;
  skipped: number;
  totalAmount: number;
  expectedTotal: number;
  references: string[];
  categoriesCreated: string[];
};

export async function seedUnit311TomExpenses(): Promise<SeedUnit311TomExpensesResult> {
  const { workspaceId, workspaceSlug } = await resolveUnit311WorkspaceId();
  const tom = await resolveTomEmployee(workspaceId);
  const categoriesBefore = await listExpenseCategories(workspaceId);
  const categoryMap = await ensureCategoryMap(workspaceId);
  const categoriesAfter = await listExpenseCategories(workspaceId);
  const categoriesCreated = categoriesAfter
    .filter((cat) => !categoriesBefore.some((before) => before.id === cat.id))
    .map((cat) => cat.name);

  const existing = await listExpenses({ workspaceId, workspaceSlug });
  const existingRefs = new Set(
    existing
      .map((expense) => String(expense.reference ?? "").trim())
      .filter((ref) => ref.startsWith(UNIT311_TOM_EXPENSE_REFERENCE_PREFIX)),
  );

  const actor = { userId: "user-admin", displayName: "Unit311 Finance" };
  const submitterUserId = resolveSubmitterUserId(tom);
  let created = 0;
  let skipped = 0;
  const references: string[] = [];

  for (const row of UNIT311_TOM_EXPENSE_ROWS) {
    if (existingRefs.has(row.reference)) {
      skipped += 1;
      references.push(row.reference);
      continue;
    }

    const category = categoryMap[row.categoryKey];
    const purpose = buildPurpose(row);
    const categoryAccountCode =
      category.glAccountCode ||
      billingCodeForSemanticCategory(
        row.categoryKey === "software" ? "Software" : "Equipment",
      );

    const expense = await createExpense(
      {
        submitterUserId,
        submitterName: tom.fullName,
        claimantEmployeeId: tom.id,
        description: purpose,
        purposeDescription: purpose,
        amount: row.amount,
        currency: "GBP",
        expenseDate: row.expenseDate,
        dateSubmitted: row.expenseDate,
        supplier: row.supplier,
        reference: row.reference,
        categoryAccountCode,
        expenseCategoryId: category.id,
        recordStatus: "draft",
        workflowStatus: "draft",
        reimbursable: true,
        paymentMethod: "personally_paid",
        attachmentPath: null,
      },
      { workspaceId, workspaceSlug },
    );

    await submitExpenseForApproval(expense.id, workspaceId, {
      userId: submitterUserId,
      displayName: tom.fullName,
    });

    await approveExpense(expense.id, workspaceId, workspaceSlug, actor);

    if (row.nonVatReclaimable) {
      const supabase = createTenancyServerClient();
      await supabase
        .from("financial_expenses")
        .update({
          description: purpose,
          purpose_description: purpose,
          updated_at: new Date().toISOString(),
        })
        .eq("id", expense.id)
        .eq("workspace_id", workspaceId);
    }

    created += 1;
    references.push(row.reference);
  }

  const seeded = await listExpenses({ workspaceId, workspaceSlug });
  const seededRows = seeded.filter((expense) =>
    String(expense.reference ?? "").startsWith(UNIT311_TOM_EXPENSE_REFERENCE_PREFIX),
  );
  const totalAmount = seededRows.reduce((sum, expense) => sum + Number(expense.amount), 0);

  if (Math.abs(totalAmount - UNIT311_TOM_EXPENSE_EXPECTED_TOTAL) > 0.01) {
    throw new Error(
      `Seeded total ${totalAmount.toFixed(2)} does not match expected ${UNIT311_TOM_EXPENSE_EXPECTED_TOTAL.toFixed(2)}.`,
    );
  }

  return {
    ok: true,
    workspaceSlug,
    workspaceId,
    tomEmployeeId: tom.id,
    tomEmployeeName: tom.fullName,
    created,
    skipped,
    totalAmount,
    expectedTotal: UNIT311_TOM_EXPENSE_EXPECTED_TOTAL,
    references,
    categoriesCreated,
  };
}
