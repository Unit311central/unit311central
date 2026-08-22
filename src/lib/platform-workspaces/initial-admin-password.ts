import type { InitialWorkspaceAdministratorInput } from "@/lib/platform-workspaces/types";

/** True when the wizard (or retry payload) supplied a non-empty administrator password. */
export function hasInitialAdministratorPassword(
  password: string | null | undefined,
): password is string {
  return Boolean(password?.trim());
}

export function assertInitialAdministratorPasswordForProvisioning(
  administrator: InitialWorkspaceAdministratorInput,
): void {
  if (!hasInitialAdministratorPassword(administrator.password)) {
    throw new Error(
      "Initial administrator password is required to complete provisioning. Use the password entered in the workspace wizard.",
    );
  }
  if (administrator.password !== administrator.confirmPassword) {
    throw new Error("Initial administrator passwords do not match.");
  }
}
