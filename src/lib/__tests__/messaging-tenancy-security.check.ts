/**
 * Messaging tenant isolation regression checks.
 * Run: npm run prove:messaging-tenancy
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..", "..");

function readSource(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function testConfigRouteRequiresAuth() {
  const source = readSource("src/app/api/messaging/config/route.ts");
  assert.match(source, /requirePlatformSession\(\)/, "config route must require platform session");
  assert.match(source, /requireCurrentWorkspace\(\)/, "config route must require current workspace");
  const sessionIndex = source.indexOf("requirePlatformSession()");
  const keyIndex = source.indexOf("supabaseAnonKey");
  assert.ok(sessionIndex >= 0 && keyIndex > sessionIndex, "config route must auth before returning anon key");
}

function testMessagingServiceUsesTenancyClient() {
  const source = readSource("src/lib/internal-messaging-service.ts");
  assert.match(source, /createTenancyServerClient\(\)/, "messaging service must use tenancy server client");
  assert.doesNotMatch(
    source,
    /createSupabaseServerClient\(\)/,
    "messaging service must not use anon server client",
  );
  assert.match(
    source,
    /requireMessageInWorkspace/,
    "messaging service must verify message ownership before save",
  );
}

function testMessagingCallServiceUsesTenancyClient() {
  const source = readSource("src/lib/messaging-call-service.ts");
  assert.match(source, /createTenancyServerClient\(\)/, "messaging call service must use tenancy server client");
}

function testMessagingRoutesScopeWorkspace() {
  const routes = [
    "src/app/api/messaging/messages/route.ts",
    "src/app/api/messaging/channels/route.ts",
    "src/app/api/messaging/attachments/route.ts",
    "src/app/api/messaging/unread/route.ts",
    "src/app/api/messaging/scheduled-calls/route.ts",
  ];

  for (const route of routes) {
    const source = readSource(route);
    assert.match(source, /requirePlatformSession\(\)/, `${route} must require platform session`);
    assert.match(source, /requireCurrentWorkspace\(\)/, `${route} must require current workspace`);
    assert.match(source, /workspaceId: workspace\.id/, `${route} must pass host workspace id to services`);
  }
}

function testMessagingRlsMigrationExists() {
  const migration = readSource("supabase/migrations/177_messaging_tenant_isolation_rls.sql");
  const tables = [
    "internal_messages",
    "internal_message_channels",
    "internal_message_read_state",
    "internal_scheduled_calls",
    "internal_message_saves",
    "messaging_call_rooms",
  ];
  for (const table of tables) {
    assert.match(migration, new RegExp(`'public\\.${table}'`), `migration must harden ${table}`);
  }
  assert.match(migration, /using \(false\)/, "migration must install deny-all policies");
}

function testMessagingServiceFiltersWorkspaceId() {
  const source = readSource("src/lib/internal-messaging-service.ts");
  assert.match(
    source,
    /\.eq\("workspace_id", workspaceId\)/,
    "messaging service queries must filter by workspace_id",
  );
}

testConfigRouteRequiresAuth();
testMessagingServiceUsesTenancyClient();
testMessagingCallServiceUsesTenancyClient();
testMessagingRoutesScopeWorkspace();
testMessagingRlsMigrationExists();
testMessagingServiceFiltersWorkspaceId();

console.log("messaging-tenancy-security.check.ts: all checks passed");
