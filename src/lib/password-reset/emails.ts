import {
  brandEmailFooterHtml,
  brandEmailLogoHtml,
  brandFromWorkspaceClaim,
  type WorkspaceBrand,
} from "@/lib/workspace-brand";

export type PasswordResetEmailInput = {
  displayName: string;
  resetUrl: string;
  /** 6-digit one-time code shown in the email and entered after clicking the link. */
  otp: string;
  expiresInMinutes: number;
  /** Active workspace brand — defaults to platform when omitted. */
  brand?: WorkspaceBrand | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function emailShell(brand: WorkspaceBrand, title: string, bodyHtml: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <body style="margin:0;padding:0;background:#f8fafc;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;">
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.6;">
                    ${brandEmailLogoHtml(brand)}
                    <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0b2d63;">${title}</h1>
                    ${bodyHtml}
                    <p style="margin:28px 0 0;font-size:12px;color:#94a3b8;">
                      ${brandEmailFooterHtml(brand)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export function buildPasswordResetEmail(input: PasswordResetEmailInput) {
  const brand = input.brand ?? brandFromWorkspaceClaim({ slug: "unit311", name: "Unit311 Central" });
  const firstName = input.displayName.trim().split(/\s+/)[0] || "there";
  const accountLabel = brand.showPlatformBranding
    ? "your Unit311 account"
    : `your ${brand.displayName} workspace account`;
  const subject = brand.showPlatformBranding
    ? `${input.otp} is your Unit311 password reset code`
    : `${input.otp} is your ${brand.displayName} password reset code`;

  const html = emailShell(
    brand,
    "Your one-time reset code",
    `
      <p style="margin:0 0 16px;font-size:15px;color:#334155;">
        Hi ${escapeHtml(firstName)},
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#334155;">
        We received a request to reset the password for ${escapeHtml(accountLabel)}.
        Copy the one-time code below and enter it on the reset page that is already open in your browser.
        This code expires in ${input.expiresInMinutes} minutes.
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">
        Your one-time code
      </p>
      <p style="margin:0 0 24px;font-size:32px;font-weight:700;letter-spacing:0.28em;color:#0b2d63;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">
        ${escapeHtml(input.otp)}
      </p>
      <p style="margin:0 0 16px;font-size:13px;color:#64748b;">
        Stay on the reset page, paste this code, then choose a new password.
        If you closed that page, you can reopen it here:
      </p>
      <p style="margin:0 0 16px;">
        <a href="${escapeHtml(input.resetUrl)}" style="display:inline-block;background:#0b2d63;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:8px;">
          Open reset page
        </a>
      </p>
      <p style="margin:0;font-size:13px;color:#64748b;">
        If you did not request this, you can ignore this email.
      </p>
    `,
  );

  const text = [
    `Hi ${firstName},`,
    "",
    `We received a request to reset the password for ${accountLabel}.`,
    `Your one-time code is: ${input.otp}`,
    "Copy that code into the reset page that is already open in your browser.",
    `If you closed the page, reopen it within ${input.expiresInMinutes} minutes:`,
    input.resetUrl,
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n");

  return { subject, html, text };
}

export type PasswordResetConfirmationEmailInput = {
  displayName: string;
  loginUrl: string;
  brand?: WorkspaceBrand | null;
};

/** Confirmation only — never includes the new password. */
export function buildPasswordResetConfirmationEmail(
  input: PasswordResetConfirmationEmailInput,
) {
  const brand = input.brand ?? brandFromWorkspaceClaim({ slug: "unit311", name: "Unit311 Central" });
  const firstName = input.displayName.trim().split(/\s+/)[0] || "there";
  const accountLabel = brand.showPlatformBranding
    ? "your Unit311 account"
    : `your ${brand.displayName} workspace account`;
  const subject = brand.showPlatformBranding
    ? "Your Unit311 password was reset"
    : `Your ${brand.displayName} password was reset`;

  const html = emailShell(
    brand,
    "Password reset complete",
    `
      <p style="margin:0 0 16px;font-size:15px;color:#334155;">
        Hi ${escapeHtml(firstName)},
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#334155;">
        The password for ${escapeHtml(accountLabel)} has been changed successfully.
        For your security, this email does not include your new password.
      </p>
      <p style="margin:0 0 24px;font-size:15px;color:#334155;">
        You can now sign in with the password you just chose.
      </p>
      <p style="margin:0 0 16px;">
        <a href="${escapeHtml(input.loginUrl)}" style="display:inline-block;background:#0b2d63;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:8px;">
          Sign in
        </a>
      </p>
      <p style="margin:0;font-size:13px;color:#64748b;">
        If you did not make this change, contact support immediately.
      </p>
    `,
  );

  const text = [
    `Hi ${firstName},`,
    "",
    `The password for ${accountLabel} has been changed successfully.`,
    "For your security, this email does not include your new password.",
    "You can now sign in with the password you just chose:",
    input.loginUrl,
    "",
    "If you did not make this change, contact support immediately.",
  ].join("\n");

  return { subject, html, text };
}
