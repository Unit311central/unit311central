/**
 * Initial administrator password must always come from the wizard (or explicit retry payload).
 */
import assert from "node:assert/strict";

import {
  hashPlatformPasswordForUser,
  normalizePlatformUsername,
  verifyPlatformPassword,
} from "@/lib/platform-auth";
import {
  assertInitialAdministratorPasswordForProvisioning,
  hasInitialAdministratorPassword,
} from "@/lib/platform-workspaces/initial-admin-password";

assert.equal(hasInitialAdministratorPassword(""), false);
assert.equal(hasInitialAdministratorPassword("   "), false);
assert.equal(hasInitialAdministratorPassword("Letmein2026$"), true);

assert.throws(
  () =>
    assertInitialAdministratorPasswordForProvisioning({
      firstName: "Paul",
      lastName: "Admin",
      email: "admin@example.com",
      password: "",
      confirmPassword: "",
    }),
  /password is required/i,
);

assert.throws(
  () =>
    assertInitialAdministratorPasswordForProvisioning({
      firstName: "Paul",
      lastName: "Admin",
      email: "admin@example.com",
      password: "WizardPassword123!",
      confirmPassword: "DifferentPassword123!",
    }),
  /do not match/i,
);

assert.doesNotThrow(() =>
  assertInitialAdministratorPasswordForProvisioning({
    firstName: "Paul",
    lastName: "Admin",
    email: "admin@example.com",
    password: "WizardPassword123!",
    confirmPassword: "WizardPassword123!",
  }),
);

const username = normalizePlatformUsername("admin@interfaceworx.com");
const wizardPassword = "Letmein2026$";
const storedHash = hashPlatformPasswordForUser(username, wizardPassword);
assert.ok(verifyPlatformPassword(wizardPassword, storedHash));
assert.equal(verifyPlatformPassword("InterfaceWorx2026!", storedHash), false);

console.log("ok  initial-admin-password checks passed\n");
