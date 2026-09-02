/**
 * Repair PAILEX workspace administrator access (internal_operators row).
 * Idempotent — safe to re-run after deploy.
 *
 *   SUPABASE_ACCESS_TOKEN=... node scripts/repair-pailex-admin-access.mjs
 */
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF?.trim() || "kkxtvzxqmbacjatkiupq";
const PAILEX_ADMIN_EMAIL = "admin@pailex.unit311central.com";

async function runSql(query) {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!token) throw new Error("SUPABASE_ACCESS_TOKEN is required.");
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(typeof body?.message === "string" ? body.message : JSON.stringify(body));
  }
  return body;
}

async function probeApis(password) {
  const login = await fetch("https://pailex.unit311central.com/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: PAILEX_ADMIN_EMAIL, password }),
  });
  const loginBody = await login.json().catch(() => ({}));
  const cookies = login.headers.getSetCookie?.() ?? [];
  if (!cookies.length) {
    return { loginStatus: login.status, loginBody };
  }
  const cookieHeader = cookies.map((row) => row.split(";")[0]).join("; ");
  const usersRes = await fetch("https://pailex.unit311central.com/api/users", {
    headers: { Cookie: cookieHeader },
  });
  const integrationsRes = await fetch("https://pailex.unit311central.com/api/integrations/connections", {
    headers: { Cookie: cookieHeader },
  });
  return {
    loginStatus: login.status,
    loginWorkspace: loginBody.workspace?.slug ?? null,
    apiUsersStatus: usersRes.status,
    apiIntegrationsStatus: integrationsRes.status,
  };
}

async function main() {
  const password = process.env.PAILEX_ADMIN_PASSWORD?.trim() ?? "Eland1999$";
  const users = await runSql(
    `SELECT id, display_name FROM platform_users WHERE email = '${PAILEX_ADMIN_EMAIL}' LIMIT 1`,
  );
  const userId = users?.[0]?.id;
  if (!userId) {
    throw new Error(`PAILEX admin platform user not found (${PAILEX_ADMIN_EMAIL}).`);
  }
  const displayName = String(users[0].display_name ?? "PAILEX Administrator");
  const now = new Date().toISOString();
  const roles = JSON.stringify([
    "Admin",
    "Manager",
    "Supervisor",
    "Operator",
    "Viewer",
  ]);
  const departments = JSON.stringify([
    "Corporate",
    "Operations",
    "Engineering",
    "Sales",
    "Support",
    "Finance",
    "HR",
    "Legal",
    "Marketing",
    "Product",
    "Technology",
  ]);
  const dashboardPrefs = JSON.stringify({
    homeTiles: ["operations", "projects", "support", "training"],
  });

  await runSql(`
INSERT INTO internal_operators (
  id, operator_label, full_name, username, email, phone, role, roles, department, departments,
  status, region, license_id, notes, allowed_views, dashboard_prefs, created_at, updated_at
) VALUES (
  '${userId}', 'PAILEX Administrator', '${displayName.replace(/'/g, "''")}', '${PAILEX_ADMIN_EMAIL}', '${PAILEX_ADMIN_EMAIL}', NULL,
  'Admin', '${roles}'::jsonb, 'Operations', '${departments}'::jsonb,
  'Active', '', NULL, 'PAILEX workspace full-access administrator (pailex)', NULL,
  '${dashboardPrefs}'::jsonb, '${now}', '${now}'
)
ON CONFLICT (id) DO UPDATE SET
  operator_label = EXCLUDED.operator_label,
  full_name = EXCLUDED.full_name,
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  roles = EXCLUDED.roles,
  department = EXCLUDED.department,
  departments = EXCLUDED.departments,
  status = EXCLUDED.status,
  allowed_views = EXCLUDED.allowed_views,
  dashboard_prefs = EXCLUDED.dashboard_prefs,
  notes = EXCLUDED.notes,
  updated_at = EXCLUDED.updated_at
`);

  const operator = await runSql(
    `SELECT id, role, allowed_views FROM internal_operators WHERE id = '${userId}'`,
  );
  const probe = await probeApis(password);

  console.log(
    JSON.stringify(
      {
        ok: true,
        userId,
        operator: operator[0] ?? null,
        probe,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
