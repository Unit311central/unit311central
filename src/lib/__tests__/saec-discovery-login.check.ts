/**
 * SAEC Discovery login — static checks.
 * Run: node --import tsx src/lib/__tests__/saec-discovery-login.check.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  isSaecDiscoveryUsername,
  resolveSaecDiscoveryProvisionPassword,
  verifySaecDiscoveryPassword,
  wantsSaecDiscoveryPostLogin,
} from "@/lib/saec-discovery/discovery-auth";

const root = process.cwd();

assert.equal(isSaecDiscoveryUsername("discovery@unit311central.com"), true);
assert.equal(isSaecDiscoveryUsername("admin@saec.co.za"), false);
assert.equal(verifySaecDiscoveryPassword("SaecDiscovery2026$"), true);
assert.equal(
  resolveSaecDiscoveryProvisionPassword(),
  "SaecDiscovery2026$",
  "provision should fall back to default password",
);
assert.equal(verifySaecDiscoveryPassword("wrong-password"), false);
assert.equal(wantsSaecDiscoveryPostLogin("/saec-discovery"), true);
assert.equal(wantsSaecDiscoveryPostLogin("/dashboard"), false);

const loginRoute = readFileSync(
  path.join(root, "src/app/api/auth/login/route.ts"),
  "utf8",
);
assert.match(loginRoute, /createSaecDiscoveryLoginResponse/, "login route must support discovery auth");

const loginUi = readFileSync(
  path.join(root, "src/components/saec-discovery/SaecDiscoveryLogin.tsx"),
  "utf8",
);
assert.match(loginUi, /next:\s*"\/saec-discovery"/, "discovery login must request saec-discovery next path");

const provisionRoute = readFileSync(
  path.join(root, "src/app/api/internal/provision-saec-discovery-account/route.ts"),
  "utf8",
);
assert.match(provisionRoute, /provisionSaecDiscoveryAccount/, "internal provision route required");

console.log("ok  saec-discovery-login checks passed\n");
