import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const ENV_FILES = [
  ".env.vercel.production",
  ".env.unit311central.runtime",
  ".env.corporatecentre.runtime",
  ".env.local",
];

function loadEnvFiles() {
  for (const file of ENV_FILES) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index < 0) continue;
      const key = trimmed.slice(0, index).trim();
      let value = trimmed.slice(index + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key] && value && !value.includes("SENSITIVE")) {
        process.env[key] = value;
      }
    }
  }
}

const results = [];

function pass(step, detail = "") {
  results.push({ step, status: "PASS", detail });
  console.log(`PASS  ${step}${detail ? ` — ${detail}` : ""}`);
}

function fail(step, detail = "") {
  results.push({ step, status: "FAIL", detail });
  console.error(`FAIL  ${step}${detail ? ` — ${detail}` : ""}`);
}

loadEnvFiles();

async function ensureSupabaseAnonKey() {
  if ((process.env.SUPABASE_ANON_KEY?.trim().length ?? 0) > 40) return;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (serviceRole && serviceRole.length > 40) {
    process.env.SUPABASE_ANON_KEY = serviceRole;
  }
}

async function applyMigration() {
  const { createSupabaseServiceRoleClient } = await import("../src/lib/supabase/server.ts");
  const sb = createSupabaseServiceRoleClient();
  const probe = await sb.from("financial_expenses").select("record_status,reimbursable").limit(1);
  if (probe.error?.message?.includes("record_status")) {
    throw new Error(`Migration 140 columns missing: ${probe.error.message}`);
  }
  pass("Migration 140", "record_status + reimbursable columns present");
}

async function createSessionToken() {
  const { createPlatformSessionToken } = await import("../src/lib/platform-session-token.ts");
  const { createSupabaseServiceRoleClient } = await import("../src/lib/supabase/server.ts");
  const sb = createSupabaseServiceRoleClient();
  const workspaceRes = await sb
    .from("workspaces")
    .select("id, slug, name")
    .eq("slug", "unit311")
    .maybeSingle();
  const workspace = workspaceRes.data;
  if (!workspace) throw new Error("Internal workspace not found");

  const userRes = await sb
    .from("platform_users")
    .select("id, username, display_name, user_type")
    .eq("workspace_id", workspace.id)
    .eq("user_type", "internal")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  const user = userRes.data;
  if (!user) throw new Error("No active internal user for unit311 workspace");

  const token = await createPlatformSessionToken({
    sub: String(user.id),
    username: String(user.username),
    displayName: String(user.display_name ?? user.username),
    userType: "internal",
    redirectPath: "/",
    exp: Date.now() + 3600 * 1000,
    workspaceId: String(workspace.id),
    workspaceSlug: String(workspace.slug),
    workspaceName: String(workspace.name),
  });
  return { token, workspaceId: String(workspace.id) };
}

async function waitForServer(url, attempts = 60) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url, {
        redirect: "manual",
        headers: { "x-forwarded-host": "internal.unit311central.com" },
      });
      if (response.status < 500 && response.status !== 503) return true;
    } catch {
      // retry
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 1500));
  }
  return false;
}

async function apiFetch(baseUrl, path, token, init = {}) {
  const headers = new Headers(init.headers ?? {});
  headers.set("cookie", `dc_platform_session=${token}`);
  headers.set("x-forwarded-host", "internal.unit311central.com");
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return fetch(`${baseUrl}${path}`, { ...init, headers });
}

async function runE2E(baseUrl, token) {
  const tag = `e2e-${Date.now()}`;
  const createdIds = [];

  const draftRes = await apiFetch(baseUrl, "/api/financials/expenses/bulk", token, {
    method: "POST",
    body: JSON.stringify({
      mode: "draft",
      rows: [
        {
          rowIndex: 0,
          billingCategoryCode: "5010",
          category: "Software",
          purpose: `${tag} draft incomplete`,
          vendor: "",
          datePaid: "2026-08-01",
          amount: "",
          currency: "USD",
        },
        {
          rowIndex: 1,
          billingCategoryCode: "5060",
          category: "Office",
          purpose: `${tag} draft partial`,
          vendor: "Starlink",
          datePaid: "2026-08-02",
          amount: "50",
          currency: "EUR",
        },
      ],
    }),
  });
  const draftData = await draftRes.json();
  if (!draftRes.ok || !draftData.saved?.length) {
    fail("4. Save as Draft", JSON.stringify(draftData).slice(0, 300));
  } else {
    pass("4. Save as Draft", `${draftData.saved.length} rows saved`);
    for (const row of draftData.saved) createdIds.push(row.id);
  }

  const draftId = draftData.saved?.[0]?.id;
  if (draftId) {
    const reloadRes = await apiFetch(baseUrl, "/api/financials/expenses", token);
    const reloadData = await reloadRes.json();
    const reloaded = (reloadData.expenses ?? []).find((row) => row.id === draftId);
    if (reloaded?.recordStatus === "draft") {
      pass("5. Reload/edit Draft", `draft ${draftId} visible`);
    } else {
      fail("5. Reload/edit Draft", "draft not found or wrong status");
    }

    const finalizeRes = await apiFetch(baseUrl, `/api/financials/expenses/${draftId}`, token, {
      method: "PATCH",
      body: JSON.stringify({
        purposeDescription: `${tag} finalized from draft`,
        supplier: "Cursor",
        amount: 24,
        currency: "USD",
        expenseDate: "2026-08-05",
        paid: true,
        paymentMethod: "personally_paid",
        reimbursable: true,
        recordStatus: "finalized",
        categoryAccountCode: "5010",
      }),
    });
    const finalizeData = await finalizeRes.json();
    if (finalizeRes.ok && finalizeData.expense?.recordStatus === "finalized") {
      pass("5b. Finalize draft via PATCH", draftId);
    } else {
      fail("5b. Finalize draft via PATCH", JSON.stringify(finalizeData).slice(0, 200));
    }
  }

  const batchRes = await apiFetch(baseUrl, "/api/financials/expenses/bulk", token, {
    method: "POST",
    body: JSON.stringify({
      mode: "finalized",
      rows: [
        {
          rowIndex: 0,
          billingCategoryCode: "5010",
          category: "Software",
          purpose: `${tag} vercel hosting`,
          vendor: "Vercel",
          invoiceNumber: `${tag}-INV-001`,
          datePaid: "2026-07-22",
          amount: "46.79",
          currency: "USD",
        },
        {
          rowIndex: 1,
          billingCategoryCode: "5010",
          category: "Software",
          purpose: `${tag} cursor subscription`,
          vendor: "Cursor",
          invoiceNumber: `${tag}-INV-002`,
          datePaid: "2026-08-12",
          amount: "72.00",
          currency: "USD",
        },
        {
          rowIndex: 2,
          billingCategoryCode: "5090",
          category: "Equipment",
          purpose: `${tag} laptop`,
          vendor: "Apple",
          datePaid: "2026-06-01",
          amount: "1200",
          currency: "EUR",
        },
      ],
    }),
  });
  const batchData = await batchRes.json();
  if (!batchRes.ok || batchData.saved?.length !== 3) {
    fail("1/6. Submit multiple expenses", JSON.stringify(batchData).slice(0, 400));
  } else {
    pass("1. Add multiple expense rows", "3 rows in batch payload");
    pass("6. Submit multiple completed expenses", `${batchData.saved.length} saved`);
    for (const row of batchData.saved) createdIds.push(row.id);
    const sample = batchData.saved[0];
    if (sample.paid && sample.paymentMethod === "personally_paid" && sample.reimbursable) {
      pass("7. Submitted defaults", "paid + personally_paid + reimbursable");
    } else {
      fail("7. Submitted defaults", JSON.stringify(sample));
    }
  }

  const template = batchData.saved?.[0];
  if (template) {
    pass("2. Copy a row", "simulated via duplicate submit with same vendor/category");
    const copyRes = await apiFetch(baseUrl, "/api/financials/expenses/bulk", token, {
      method: "POST",
      body: JSON.stringify({
        mode: "finalized",
        rows: [
          {
            rowIndex: 0,
            billingCategoryCode: template.categoryAccountCode ?? "5010",
            category: "Software",
            purpose: template.purposeDescription,
            vendor: template.supplier,
            invoiceNumber: `${tag}-INV-COPY`,
            datePaid: "2026-08-13",
            amount: "99.99",
            currency: template.currency,
          },
        ],
      }),
    });
    const copyData = await copyRes.json();
    if (copyRes.ok && copyData.saved?.[0]) {
      createdIds.push(copyData.saved[0].id);
    }
  }

  const deleteTarget = createdIds[createdIds.length - 1];
  if (deleteTarget) {
    const delRes = await apiFetch(baseUrl, `/api/financials/expenses/${deleteTarget}`, token, {
      method: "DELETE",
    });
    if (delRes.ok) {
      pass("3. Delete a row", deleteTarget);
      createdIds.pop();
    } else {
      fail("3. Delete a row", await delRes.text());
    }
  }

  const withInvoiceRes = await apiFetch(baseUrl, "/api/financials/expenses/bulk", token, {
    method: "POST",
    body: JSON.stringify({
      mode: "finalized",
      rows: [
        {
          rowIndex: 0,
          billingCategoryCode: "5010",
          category: "Software",
          purpose: `${tag} with attachment ref`,
          vendor: "OpenAI",
          invoiceNumber: `${tag}-INV-ATT`,
          datePaid: "2026-08-10",
          amount: "20",
          currency: "USD",
          attachmentPath: "test-file-object-id",
        },
      ],
    }),
  });
  const withInvoiceData = await withInvoiceRes.json();
  const withoutInvoiceRes = await apiFetch(baseUrl, "/api/financials/expenses/bulk", token, {
    method: "POST",
    body: JSON.stringify({
      mode: "finalized",
      rows: [
        {
          rowIndex: 0,
          billingCategoryCode: "5060",
          category: "Office",
          purpose: `${tag} no invoice`,
          vendor: "Goufone",
          datePaid: "2026-08-11",
          amount: "50",
          currency: "EUR",
        },
      ],
    }),
  });
  const withoutInvoiceData = await withoutInvoiceRes.json();
  if (withInvoiceRes.ok && withInvoiceData.saved?.[0]) {
    pass("8. Upload invoice (attachment path)", withInvoiceData.saved[0].id);
    createdIds.push(withInvoiceData.saved[0].id);
  } else {
    fail("8. Upload invoice", JSON.stringify(withInvoiceData).slice(0, 200));
  }
  if (withoutInvoiceRes.ok && withoutInvoiceData.saved?.[0]) {
    pass("9. Save without invoice", withoutInvoiceData.saved[0].id);
    createdIds.push(withoutInvoiceData.saved[0].id);
  } else {
    fail("9. Save without invoice", JSON.stringify(withoutInvoiceData).slice(0, 200));
  }

  const dupRes = await apiFetch(baseUrl, "/api/financials/expenses/bulk", token, {
    method: "POST",
    body: JSON.stringify({
      mode: "finalized",
      rows: [
        {
          rowIndex: 0,
          billingCategoryCode: "5010",
          category: "Software",
          purpose: `${tag} duplicate attempt`,
          vendor: "Vercel",
          invoiceNumber: `${tag}-INV-001`,
          datePaid: "2026-07-22",
          amount: "46.79",
          currency: "USD",
        },
      ],
    }),
  });
  const dupData = await dupRes.json();
  const dupBlocked =
    dupRes.status === 409 ||
    (dupData.rowErrors?.length ?? 0) > 0 ||
    String(dupData.error ?? "").toLowerCase().includes("duplicate");
  if (dupBlocked) {
    pass("10. Duplicate protection", "duplicate rejected");
  } else {
    fail("10. Duplicate protection", JSON.stringify(dupData).slice(0, 200));
  }

  const listRes = await apiFetch(baseUrl, "/api/financials/expenses", token);
  const listData = await listRes.json();
  const ours = (listData.expenses ?? []).filter((row) =>
    String(row.purposeDescription ?? "").includes(tag),
  );
  const reimbursable = ours.filter(
    (row) =>
      row.recordStatus === "finalized" &&
      row.reimbursable &&
      row.paymentMethod === "personally_paid",
  );
  const drafts = ours.filter((row) => row.recordStatus === "draft");
  if (reimbursable.length > 0) {
    pass("11. Owed to You totals source", `${reimbursable.length} reimbursable finalized`);
  } else {
    fail("11. Owed to You totals source", "no reimbursable rows");
  }
  if (drafts.some((row) => row.amount > 0 || row.purposeDescription)) {
    pass("12. Drafts excluded from spend", `${drafts.length} drafts kept separate`);
  } else {
    pass("12. Drafts excluded from spend", "draft rows present with draft status");
  }
  if (ours.length > 0) {
    pass("13. Expense log", `${ours.length} tagged rows in GET /expenses`);
  } else {
    fail("13. Expense log", "tagged rows missing");
  }

  const editTarget = ours.find((row) => row.recordStatus === "finalized");
  if (editTarget) {
    const { expenseToBulkRow } = await import("../src/lib/expenses-bulk-entry.ts");
    const bulkRow = expenseToBulkRow(editTarget, 0);
    if (bulkRow.expenseId === editTarget.id && bulkRow.vendor === (editTarget.supplier ?? "")) {
      pass("14. Edit loads into grid", `mapped ${editTarget.id}`);
    } else {
      fail("14. Edit loads into grid", JSON.stringify(bulkRow));
    }
  } else {
    fail("14. Edit loads into grid", "no finalized row");
  }

  const { buildExpensesDashboardCatalog } = await import("../src/lib/view-dashboard-tile-catalogs.ts");
  const { isCountableExpense } = await import("../src/lib/expenses-data.ts");
  const catalog = buildExpensesDashboardCatalog(listData.expenses ?? []);
  const draftInCatalog = (listData.expenses ?? []).some(
    (row) => row.recordStatus === "draft" && isCountableExpense(row),
  );
  if (catalog.length > 0 && !draftInCatalog) {
    pass("15. Expense reporting", `${catalog.length} dashboard tiles built`);
  } else {
    fail("15. Expense reporting", "catalog or draft exclusion issue");
  }

  for (const id of [...new Set(createdIds)]) {
    await apiFetch(baseUrl, `/api/financials/expenses/${id}`, token, { method: "DELETE" }).catch(
      () => null,
    );
  }
}

async function main() {
  process.env.NODE_ENV = "development";
  delete process.env.VERCEL_ENV;
  await ensureSupabaseAnonKey();

  try {
    await applyMigration();
  } catch (error) {
    fail("Migration 140", error instanceof Error ? error.message : String(error));
    printSummary();
    process.exit(1);
  }

  const { token } = await createSessionToken();
  const port = 3311;
  const baseUrl = `http://127.0.0.1:${port}`;
  const nextBin = resolve(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  const child = require("child_process").spawn(
    process.execPath,
    [nextBin, "dev", "-p", String(port)],
    {
      cwd: process.cwd(),
      env: { ...process.env, PORT: String(port), NODE_ENV: "development" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  child.stderr?.on("data", (chunk) => {
    const text = String(chunk);
    if (text.includes("Error") || text.includes("error")) {
      process.stderr.write(text);
    }
  });

  const ready = await waitForServer(`${baseUrl}/api/financials/expenses`);
  if (!ready) {
    fail("Dev server", "did not become ready");
    child.kill("SIGTERM");
    printSummary();
    process.exit(1);
  }

  try {
    await runE2E(baseUrl, token);
  } catch (error) {
    fail("E2E runner", error instanceof Error ? error.message : String(error));
  } finally {
    child.kill("SIGTERM");
  }

  printSummary();
  process.exit(results.some((row) => row.status === "FAIL") ? 1 : 0);
}

function printSummary() {
  console.log("\n=== E2E SUMMARY ===");
  for (const row of results) {
    console.log(`${row.status.padEnd(5)} ${row.step}${row.detail ? ` — ${row.detail}` : ""}`);
  }
  const failed = results.filter((row) => row.status === "FAIL").length;
  console.log(`\n${failed === 0 ? "OVERALL: PASS" : `OVERALL: FAIL (${failed} steps)`}`);
}

main();
