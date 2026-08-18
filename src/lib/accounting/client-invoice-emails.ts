import { emailLogoHtml } from "@/lib/email-logo";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function buildClientSalesInvoiceEmail(input: {
  companyName: string;
  contactName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  paymentReference: string;
  paymentUrl: string;
  dueDate: string;
}) {
  const firstName = input.contactName.trim().split(/\s+/)[0] || "there";
  const amountLabel = money(input.amount, input.currency);
  const subject = `Invoice ${input.invoiceNumber} — ${input.companyName}`;

  const html = `
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
                    <h1 style="margin:0 0 16px;font-size:22px;color:#0b2d63;">Your invoice is ready</h1>
                    <p style="margin:0 0 16px;font-size:15px;color:#334155;">Hi ${escapeHtml(firstName)},</p>
                    <p style="margin:0 0 16px;font-size:15px;color:#334155;">
                      Please find invoice <strong>${escapeHtml(input.invoiceNumber)}</strong> for
                      <strong>${escapeHtml(input.companyName)}</strong> attached.
                      Amount due: <strong>${escapeHtml(amountLabel)}</strong> by ${escapeHtml(input.dueDate)}.
                    </p>
                    <p style="margin:0 0 16px;font-size:14px;color:#334155;">
                      <strong>Payment reference:</strong> ${escapeHtml(input.paymentReference)}
                    </p>
                    <p style="margin:0 0 24px;">
                      <a href="${escapeHtml(input.paymentUrl)}" style="display:inline-block;background:#0b2d63;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:8px;">
                        Pay online
                      </a>
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

  const text = [
    `Hi ${firstName},`,
    "",
    `Invoice ${input.invoiceNumber} for ${input.companyName} is attached.`,
    `Amount due: ${amountLabel} by ${input.dueDate}.`,
    `Payment reference: ${input.paymentReference}`,
    "",
    `Pay online: ${input.paymentUrl}`,
  ].join("\n");

  return { subject, html, text };
}
