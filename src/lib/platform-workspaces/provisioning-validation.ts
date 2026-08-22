import type { InitialWorkspaceAdministratorInput } from "@/lib/platform-workspaces/types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type InitialAdministratorValidationResult =
  | { ok: true }
  | { ok: false; field: string; message: string };

export function validateInitialWorkspaceAdministrator(
  input: InitialWorkspaceAdministratorInput,
): InitialAdministratorValidationResult {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const confirmPassword = input.confirmPassword;

  if (!firstName) {
    return { ok: false, field: "firstName", message: "First name is required." };
  }
  if (!lastName) {
    return { ok: false, field: "lastName", message: "Last name is required." };
  }
  if (!email) {
    return { ok: false, field: "email", message: "Email address is required." };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, field: "email", message: "Enter a valid email address." };
  }
  if (!password) {
    return { ok: false, field: "password", message: "Password is required." };
  }
  if (password.length < 10) {
    return { ok: false, field: "password", message: "Password must be at least 10 characters." };
  }
  if (password !== confirmPassword) {
    return { ok: false, field: "confirmPassword", message: "Passwords do not match." };
  }
  return { ok: true };
}

export function validateLoginPageTitle(title: string): string | null {
  const trimmed = title.trim();
  if (!trimmed) return "Login page title is required.";
  if (trimmed.length > 120) return "Login page title must be 120 characters or fewer.";
  return null;
}

const MAX_LOGIN_ASSET_BYTES = 8 * 1024 * 1024;

export function parseDataUrlImage(dataUrl: string | null | undefined): {
  bytes: Buffer;
  contentType: string;
  extension: string;
} | null {
  if (!dataUrl?.trim()) return null;
  const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(dataUrl.trim());
  if (!match) return null;
  const contentType = match[1].toLowerCase();
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length === 0 || bytes.length > MAX_LOGIN_ASSET_BYTES) return null;
  const extension =
    contentType === "image/jpeg" || contentType === "image/jpg"
      ? "jpg"
      : contentType === "image/png"
        ? "png"
        : contentType === "image/webp"
          ? "webp"
          : contentType === "image/gif"
            ? "gif"
            : "bin";
  return { bytes, contentType, extension };
}
