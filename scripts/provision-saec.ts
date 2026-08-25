/**
 * Provision SAEC customer workspace — saec.unit311central.com
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=... SAEC_INITIAL_ADMIN_PASSWORD='...' npx tsx scripts/provision-saec.ts
 */
import {
  WORKSPACE_MODULE_CATALOGUE,
} from "../src/lib/platform-workspaces/module-catalogue.ts";
import {
  SAEC_ENABLED_MODULES,
  saecEnabledSubModules,
} from "../src/lib/platform-workspaces/saec-provisioning.ts";
import {
  SAEC_COMPANY_NAME,
  SAEC_COUNTRY,
  SAEC_INDUSTRY,
  SAEC_REPORTING_CURRENCY,
  SAEC_SLUG,
  SAEC_TIMEZONE,
} from "../src/lib/saec-surface.ts";
import { workspaceCreateFixture } from "../src/lib/platform-workspaces/workspace-create-test-fixture.ts";
import {
  createWorkspaceAdminRecord,
  isWorkspaceSlugAvailable,
} from "../src/lib/platform-workspaces/workspace-admin-service.ts";
import { setWorkspaceAdminRepositoryForTests } from "../src/lib/platform-workspaces/workspace-admin-repository-provider.ts";
import {
  buildWorkspaceProductNavSections,
  resolveWorkspaceNavEnablement,
} from "../src/lib/platform-workspaces/workspace-product-nav.ts";
import { isWorkspaceProvisioningComplete } from "../src/lib/platform-workspaces/workspace-provisioning-orchestrator.ts";
import { resolveSlugReportingCurrency } from "../src/lib/financial-reporting-currency.ts";

const PROJECT_REF = "kkxtvzxqmbacjatkiupq";

const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const TINY_JPG =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=";

const SAEC_REGISTERED_ADDRESS =
  "SAEC House\\n15 Alice Lane\\nSandton, Gauteng 2196\\nSouth Africa";

const SAEC_DESCRIPTION =
  "SAEC delivers elevator, escalator, and vertical transportation solutions across South Africa — installation, modernisation, maintenance, and compliance for commercial and residential buildings.";

async function fetchSupabaseCredentials(): Promise<{
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}> {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("SUPABASE_ACCESS_TOKEN is required.");
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Failed to fetch Supabase API keys: ${response.status}`);
  const keys = (await response.json()) as Array<{ name: string; api_key: string }>;
  const serviceRole = keys.find((key) => key.name === "service_role")?.api_key;
  const anon = keys.find((key) => key.name === "anon")?.api_key;
  if (!serviceRole || !anon) throw new Error("Supabase anon/service_role API keys not found.");
  return {
    url: `https://${PROJECT_REF}.supabase.co`,
    anonKey: anon,
    serviceRoleKey: serviceRole,
  };
}

async function runSql(query: string): Promise<unknown> {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("SUPABASE_ACCESS_TOKEN is required.");
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );
  const body = await response.json();
  if (!response.ok) {
    throw new Error(typeof body?.message === "string" ? body.message : JSON.stringify(body));
  }
  return body;
}

function assertSaecNav(enabledModules: string[], enabledSubModules: string[]) {
  const enablement = resolveWorkspaceNavEnablement({
    workspaceSlug: SAEC_SLUG,
    workspaceType: "Customer",
    enabledModules,
    enabledSubModules,
  });
  const nav = buildWorkspaceProductNavSections({
    workspaceSlug: SAEC_SLUG,
    workspaceType: "Customer",
    enablement,
  });
  const labels = nav.flatMap((section) =>
    section.kind === "pin"
      ? section.items.map((item) => item.label)
      : section.label
        ? [section.label]
        : [],
  );

  if (labels.length !== WORKSPACE_MODULE_CATALOGUE.length) {
    throw new Error(
      `SAEC nav must expose all ${WORKSPACE_MODULE_CATALOGUE.length} catalogue modules; got ${labels.length}.`,
    );
  }

  const required = [
    "HOME",
    "EXECUTIVE ASSISTANT",
    "Intelligence",
    "Business Central",
    "Sales Management",
    "Finances",
    "Fundraising",
    "Board",
    "Corporate Information",
    "Operations",
    "Marketing & Events",
    "Technology Management",
    "Human Resources",
    "Business Productivity",
    "Support Desk",
    "Project Management",
    "Engineering",
    "Training",
    "QMS",
    "Tools",
    "External Client Access",
    "Settings",
  ];
  for (const label of required) {
    if (!labels.includes(label)) {
      throw new Error(`Navigation missing required module: ${label}`);
    }
  }

  const bc = nav.find((section) => section.label === "Business Central");
  const bcLabels =
    bc?.kind === "workspace" ? bc.items.flatMap((item) => [item.label, ...(item.children?.map((c) => c.label) ?? [])]) : [];
  if (bcLabels.some((label) => label === "Grants")) {
    throw new Error("SAEC must not include Grants.");
  }
  if (!bcLabels.includes("Information Repository")) {
    throw new Error("SAEC Business Central must include Information Repository.");
  }

  console.log("Navigation structure verification passed.");
  console.log(`Top-level modules (${labels.length}): ${labels.join(" | ")}`);
}

async function seedSaecCompanyDetails(workspaceId: string): Promise<void> {
  await runSql(`
    DELETE FROM public.company_details WHERE workspace_id = '${workspaceId}'::uuid;
    INSERT INTO public.company_details (
      id, workspace_id, legal_company_name, trading_name, registered_office_address,
      principal_business_address, country_of_registration, website, primary_email,
      primary_telephone, general_company_description, company_status, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), '${workspaceId}'::uuid, '${SAEC_COMPANY_NAME}', '${SAEC_COMPANY_NAME}',
      E'${SAEC_REGISTERED_ADDRESS}', E'${SAEC_REGISTERED_ADDRESS}', '${SAEC_COUNTRY}',
      'https://saec.co.za', 'admin@saec.co.za', '+27 11 000 0000',
      '${SAEC_DESCRIPTION.replace(/'/g, "''")}',
      'Active', now(), now()
    );
  `);
}

async function normalizeSaecLedgerCurrency(workspaceId: string): Promise<void> {
  await runSql(`
    UPDATE public.workspace_settings
    SET timezone = '${SAEC_TIMEZONE}', currency = '${SAEC_REPORTING_CURRENCY}', updated_at = now()
    WHERE workspace_id = '${workspaceId}'::uuid;

    UPDATE public.accounts
    SET currency = '${SAEC_REPORTING_CURRENCY}', updated_at = now()
    WHERE workspace_id = '${workspaceId}'::uuid;

    UPDATE public.payroll_settings
    SET default_currency = '${SAEC_REPORTING_CURRENCY}', updated_at = now()
    WHERE workspace_id = '${workspaceId}';
  `);
}

async function seedSaecChartOfAccounts(workspaceId: string): Promise<void> {
  const demoRows = (await runSql(
    `select id from public.workspaces where slug = 'demo' limit 1`,
  )) as Array<{ id: string }>;
  const demoId = demoRows[0]?.id;
  if (!demoId) {
    console.warn("Demo workspace missing — skipping chart of accounts clone.");
    return;
  }

  await runSql(`
    DELETE FROM public.accounts WHERE workspace_id = '${workspaceId}'::uuid;
    INSERT INTO public.accounts (id, code, name, type, currency, is_active, created_at, updated_at, workspace_id)
    SELECT gen_random_uuid(), code, name, type, '${SAEC_REPORTING_CURRENCY}', is_active, now(), now(), '${workspaceId}'::uuid
    FROM public.accounts
    WHERE workspace_id = '${demoId}'::uuid;
  `);
}

async function main() {
  const slugAvailable = await isWorkspaceSlugAvailable(SAEC_SLUG);
  if (!slugAvailable) {
    throw new Error(`Workspace slug "${SAEC_SLUG}" already exists. Refusing to reprovision.`);
  }

  const credentials = await fetchSupabaseCredentials();
  process.env.SUPABASE_URL = credentials.url;
  process.env.SUPABASE_ANON_KEY = credentials.anonKey;
  process.env.SUPABASE_SERVICE_ROLE_KEY = credentials.serviceRoleKey;
  process.env.WORKSPACE_ADMIN_REPOSITORY = "supabase";
  setWorkspaceAdminRepositoryForTests(null);

  const enabledModules = [...SAEC_ENABLED_MODULES];
  const enabledSubModules = saecEnabledSubModules();
  const initialAdminPassword = process.env.SAEC_INITIAL_ADMIN_PASSWORD?.trim() ?? "SaecDemo2026$";

  console.log("Creating SAEC workspace...");
  const created = await createWorkspaceAdminRecord(
    workspaceCreateFixture({
      type: "Customer",
      name: SAEC_COMPANY_NAME,
      slug: SAEC_SLUG,
      companyName: SAEC_COMPANY_NAME,
      contactName: "SAEC Administrator",
      contactEmail: "admin@saec.co.za",
      country: SAEC_COUNTRY,
      timezone: SAEC_TIMEZONE,
      currency: SAEC_REPORTING_CURRENCY,
      description: `${SAEC_INDUSTRY} — Unit311Central client demonstration workspace.`,
      customerHostname: SAEC_SLUG,
      enabledModules,
      enabledSubModules,
      branding: {
        displayName: SAEC_COMPANY_NAME,
        logoUrl: null,
        primaryColour: "#0b2d63",
        secondaryColour: "#2563eb",
      },
      loginPage: {
        title: "SAEC Workspace",
        logoDataUrl: TINY_PNG,
        backgroundDataUrl: TINY_JPG,
      },
      initialAdministrator: {
        firstName: "SAEC",
        lastName: "Administrator",
        email: "admin@saec.co.za",
        password: initialAdminPassword,
        confirmPassword: initialAdminPassword,
      },
    }),
    "provision-saec",
  );

  if (!isWorkspaceProvisioningComplete(created.provisioning)) {
    throw new Error(
      `Provisioning incomplete: ${created.provisioning.overallStatus} — ${created.provisioning.lastMessage ?? ""}`,
    );
  }

  await seedSaecCompanyDetails(created.workspaceId);
  await seedSaecChartOfAccounts(created.workspaceId);
  await normalizeSaecLedgerCurrency(created.workspaceId);
  assertSaecNav(created.enabledModules, created.enabledSubModules);

  if (resolveSlugReportingCurrency(SAEC_SLUG) !== SAEC_REPORTING_CURRENCY) {
    throw new Error("SAEC slug reporting currency resolver did not return ZAR.");
  }

  console.log("\n=== SAEC workspace provisioned successfully ===");
  console.log(`Workspace ID: ${created.workspaceId}`);
  console.log(`Slug: ${created.slug}`);
  console.log(`Hostname: ${created.customerHostname}`);
  console.log(`Primary URL: ${created.primaryUrl}`);
  console.log(`Status: ${created.status}`);
  console.log(`Country: ${SAEC_COUNTRY}`);
  console.log(`Timezone: ${SAEC_TIMEZONE}`);
  console.log(`Currency: ${SAEC_REPORTING_CURRENCY}`);
  console.log(`Industry: ${SAEC_INDUSTRY}`);
  console.log(`Enabled modules: ${created.enabledModules.length}`);
  console.log(`Enabled sub-modules: ${created.enabledSubModules.length}`);
  console.log(`Admin: admin@saec.co.za / ${initialAdminPassword}`);
  console.log(`Login: https://saec.unit311central.com/login`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
