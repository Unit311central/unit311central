import { CENTRAL_SITE_URL } from "@/lib/app-domains";

export type ContactEnquiryInput = {
  name: string;
  company: string;
  email: string;
  subject: string;
  message: string;
};

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function emailLogoHtml() {
  return `
    <div style="margin-bottom:24px;">
      <span style="font-family:Arial,Helvetica,sans-serif;font-size:28px;font-weight:700;color:#0b2d63;letter-spacing:-0.03em;">
        Unit<span style="color:#2563eb;">311</span>
      </span>
      <div style="margin-top:6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#64748b;letter-spacing:0.12em;text-transform:uppercase;">
        Unit311 Central
      </div>
    </div>
  `;
}

function emailShell(title: string, bodyHtml: string) {
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
                    ${emailLogoHtml()}
                    <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#0b2d63;">${title}</h1>
                    ${bodyHtml}
                    <p style="margin:28px 0 0;font-size:12px;color:#94a3b8;">
                      Unit311 Central · <a href="${CENTRAL_SITE_URL}" style="color:#2563eb;text-decoration:none;">unit311central.com</a>
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

function enquiryDetailsHtml(input: ContactEnquiryInput) {
  const subjectLine = input.subject
    ? `<strong>Subject:</strong> ${escapeHtml(input.subject)}<br/>`
    : "";

  return `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;">
      <strong>Name:</strong> ${escapeHtml(input.name)}<br/>
      <strong>Company:</strong> ${escapeHtml(input.company || "Not provided")}<br/>
      <strong>Email:</strong> <a href="mailto:${escapeHtml(input.email)}" style="color:#2563eb;">${escapeHtml(input.email)}</a><br/>
      ${subjectLine}
    </p>
    <div style="margin:0 0 16px;padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">
        Message
      </p>
      <p style="margin:0;font-size:15px;color:#334155;white-space:pre-wrap;">${escapeHtml(input.message)}</p>
    </div>
  `;
}

export function buildContactConfirmationEmail(input: ContactEnquiryInput) {
  const greeting = escapeHtml(firstName(input.name));
  const html = emailShell(
    "We received your enquiry",
    `
      <p style="margin:0 0 16px;font-size:15px;color:#334155;">
        Hi ${greeting},
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#334155;">
        Thank you for contacting Unit311 Central. We&apos;ve received your enquiry and will review it within one business day.
      </p>
      ${enquiryDetailsHtml(input)}
      <p style="margin:0;font-size:14px;color:#475569;">
        If you need to add anything, simply reply to this email.
      </p>
    `,
  );

  return {
    subject: "We received your enquiry — Unit311 Central",
    html,
    text: `Hi ${greeting},\n\nThank you for contacting Unit311 Central. We've received your enquiry and will review it within one business day.\n\nName: ${input.name}\nCompany: ${input.company || "Not provided"}\nEmail: ${input.email}\n${input.subject ? `Subject: ${input.subject}\n` : ""}\nMessage:\n${input.message}\n\nUnit311 Central`,
  };
}

export function buildContactInternalNotificationEmail(input: ContactEnquiryInput) {
  const html = emailShell(
    "New contact form enquiry",
    `
      <p style="margin:0 0 16px;font-size:15px;color:#334155;">
        A new enquiry was submitted on unit311central.com/contact.
      </p>
      ${enquiryDetailsHtml(input)}
      <p style="margin:0;font-size:14px;color:#475569;">
        Reply directly to this email to respond to ${escapeHtml(input.name)}.
      </p>
    `,
  );

  return {
    subject: `New contact enquiry — ${input.name} (${input.subject.trim() || "General enquiry"})`,
    html,
    text: `New contact form enquiry from unit311central.com/contact.\n\nName: ${input.name}\nCompany: ${input.company || "Not provided"}\nEmail: ${input.email}\n${input.subject ? `Subject: ${input.subject}\n` : ""}\nMessage:\n${input.message}`,
  };
}
