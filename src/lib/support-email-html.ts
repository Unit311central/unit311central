/** Shared HTML email layout for Support Lounge client + desk notifications. */

export const SUPPORT_DESK_NOTIFY_EMAIL = "info@unit311central.com";


function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraphBlock(text: string) {
  return escapeHtml(text)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(
      (line) =>
        `<p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#1f2937;">${line}</p>`,
    )
    .join("");
}

export function buildSupportEmail(input: {
  preheader?: string;
  title: string;
  intro?: string;
  rows?: Array<{ label: string; value: string }>;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footer?: string;
}): { text: string; html: string } {
  const rows = (input.rows || []).filter((row) => row.value.trim());
  const textParts = [
    input.title,
    "",
    input.intro || null,
    ...rows.map((row) => `${row.label}: ${row.value}`),
    input.body ? `\n${input.body}` : null,
    input.ctaUrl ? `\n${input.ctaLabel || "Open"}: ${input.ctaUrl}` : null,
    "",
    input.footer || "— Demo Support",
  ].filter((part) => part !== null);

  const rowHtml = rows.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0 8px;border-collapse:collapse;">
        ${rows
          .map(
            (row) => `<tr>
              <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;width:34%;font-size:13px;color:#6b7280;vertical-align:top;">${escapeHtml(row.label)}</td>
              <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;vertical-align:top;">${escapeHtml(row.value)}</td>
            </tr>`,
          )
          .join("")}
      </table>`
    : "";

  const ctaHtml =
    input.ctaUrl &&
    `<p style="margin:24px 0 8px;">
      <a href="${escapeHtml(input.ctaUrl)}" style="display:inline-block;background:#0ea5e9;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 18px;border-radius:10px;">
        ${escapeHtml(input.ctaLabel || "Open case")}
      </a>
    </p>
    <p style="margin:0 0 16px;font-size:12px;line-height:1.5;color:#6b7280;word-break:break-all;">${escapeHtml(input.ctaUrl)}</p>`;

  const html = `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
    ${input.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preheader)}</div>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:28px 28px 24px;border:1px solid #e5e7eb;">
            <tr>
              <td>
                <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#0284c7;">Demo Support</p>
                <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0f172a;">${escapeHtml(input.title)}</h1>
                ${input.intro ? paragraphBlock(input.intro) : ""}
                ${rowHtml}
                ${input.body ? `<div style="margin:16px 0;padding:14px 16px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">${paragraphBlock(input.body)}</div>` : ""}
                ${ctaHtml || ""}
                <p style="margin:24px 0 0;font-size:13px;color:#6b7280;">${escapeHtml(input.footer || "— Demo Support")}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { text: textParts.join("\n"), html };
}

export function clientLogoUrl(companyName: string, clientId?: string | null) {
  const seed = encodeURIComponent((clientId || companyName || "client").trim() || "client");
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundType=gradientLinear&fontFamily=Helvetica&fontSize=42`;
}
