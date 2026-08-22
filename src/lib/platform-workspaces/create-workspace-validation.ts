import type { CreateWorkspaceInput } from "@/lib/platform-workspaces/types";
import {
  validateInitialWorkspaceAdministrator,
  validateLoginPageTitle,
} from "@/lib/platform-workspaces/provisioning-validation";

export function validateCreateWorkspaceInput(input: CreateWorkspaceInput): void {
  const loginTitleError = validateLoginPageTitle(input.loginPage?.title ?? "");
  if (loginTitleError) {
    throw new Error(loginTitleError);
  }

  const adminValidation = validateInitialWorkspaceAdministrator(input.initialAdministrator);
  if (!adminValidation.ok) {
    throw new Error(adminValidation.message);
  }
}
