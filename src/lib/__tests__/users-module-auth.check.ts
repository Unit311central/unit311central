/**
 * Tools → Users gate must read workspace_users with tenancy server client (service role),
 * not anon — workspace_users has deny-all RLS after Phase 1 hardening.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "src/lib/internal-admin-auth.ts"),
  "utf8",
);

assert.match(
  source,
  /requireUsersModuleAdministratorSession[\s\S]*?createTenancyServerClient\(\)/,
  "customer Tools → Users auth must use createTenancyServerClient()",
);

assert.doesNotMatch(
  source,
  /requireUsersModuleAdministratorSession[\s\S]*?createSupabaseServerClient\(\)/,
  "customer Tools → Users auth must not use anon createSupabaseServerClient()",
);

console.log("ok  users-module-auth checks passed\n");
