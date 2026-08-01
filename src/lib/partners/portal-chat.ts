import type { PartnerInvoice, PartnerRecord } from "@/lib/partners/types";

function money(amount: number | null | undefined, currency = "USD") {
  const value = Number(amount) || 0;
  const code = String(currency || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${code} ${value.toFixed(2)}`;
  }
}

function statusLabel(status: string) {
  if (status === "job_not_started") return "Job not started";
  if (status === "pending") return "Pending payment";
  if (status === "paid") return "Paid";
  return status;
}

function summarizeInvoices(invoices: PartnerInvoice[]) {
  const pending = invoices.filter((row) => row.status === "pending");
  const paid = invoices.filter((row) => row.status === "paid");
  const notStarted = invoices.filter((row) => row.status === "job_not_started");
  const currency = invoices[0]?.currency || "USD";
  const pendingTotal = pending.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const paidTotal = paid.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  return { pending, paid, notStarted, currency, pendingTotal, paidTotal };
}

/** Rule-based partner portal assistant using live partner + invoice records. */
export function answerPartnerPortalChat(input: {
  partner: PartnerRecord;
  invoices: PartnerInvoice[];
  message: string;
}): string {
  const q = input.message.trim().toLowerCase();
  const { partner, invoices } = input;
  const summary = summarizeInvoices(invoices);

  if (!q) {
    return "Ask about your invoices, payment status, bank details, or how to submit a new invoice.";
  }

  if (/(hello|hi|hey)\b/.test(q)) {
    return `Hello ${partner.firstName || "there"}. I can help with ${partner.companyName}'s partner profile and ${invoices.length} invoice${invoices.length === 1 ? "" : "s"}. What do you need?`;
  }

  if (/(how (do|to)|submit|upload).*(invoice|bill)/.test(q) || q.includes("new invoice")) {
    return "To submit an invoice: open the Invoices tab, enter the job reference, description, amount, attach your invoice file, then submit. Status starts as Pending until Unit311 marks it Paid.";
  }

  if (/(bank|payment detail|sort code|iban|swift|account number|where.*pay)/.test(q)) {
    const parts = [
      partner.accountHolder ? `Account holder: ${partner.accountHolder}` : null,
      partner.bankName ? `Bank: ${partner.bankName}` : null,
      partner.accountNumber ? `Account: ${partner.accountNumber}` : null,
      partner.sortCode ? `Sort code: ${partner.sortCode}` : null,
      partner.iban ? `IBAN: ${partner.iban}` : null,
      partner.swift ? `SWIFT: ${partner.swift}` : null,
      partner.bic ? `BIC: ${partner.bic}` : null,
      partner.routing ? `Routing: ${partner.routing}` : null,
    ].filter(Boolean);
    if (parts.length === 0) {
      return "No bank details are saved yet. Update them on the Details tab so Unit311 can pay approved invoices.";
    }
    return `Your saved bank details:\n${parts.join("\n")}\n\nYou can edit these on the Details tab.`;
  }

  if (/(profile|company|address|phone|email|contact)/.test(q)) {
    return [
      `Company: ${partner.companyName}`,
      `Contact: ${partner.firstName} ${partner.lastName}`,
      `Email: ${partner.email}`,
      partner.phoneNumber
        ? `Phone: ${[partner.phoneCountryCode, partner.phoneNumber].filter(Boolean).join(" ")}`
        : null,
      partner.addressLine1
        ? `Address: ${[partner.addressLine1, partner.city, partner.country, partner.postcode].filter(Boolean).join(", ")}`
        : "Address: not set",
      "Use the Details tab to update any of these.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (/(pending|unpaid|outstanding|owe|owed|awaiting)/.test(q)) {
    if (summary.pending.length === 0) {
      return "You have no pending invoices right now.";
    }
    const lines = summary.pending
      .slice(0, 8)
      .map(
        (row) =>
          `• ${row.jobReference} — ${money(row.amount, row.currency)} — ${statusLabel(row.status)}${row.description ? ` — ${row.description}` : ""}`,
      );
    return `Pending invoices (${summary.pending.length}), total ${money(summary.pendingTotal, summary.currency)}:\n${lines.join("\n")}`;
  }

  if (/\bpaid\b|payment received|already paid/.test(q)) {
    if (summary.paid.length === 0) {
      return "No paid invoices are on file yet.";
    }
    const lines = summary.paid
      .slice(0, 8)
      .map((row) => `• ${row.jobReference} — ${money(row.amount, row.currency)}`);
    return `Paid invoices (${summary.paid.length}), total ${money(summary.paidTotal, summary.currency)}:\n${lines.join("\n")}`;
  }

  if (/(status|invoice|invoices|job|reference|payment)/.test(q)) {
    if (invoices.length === 0) {
      return "You have no invoices submitted yet. Use the Invoices tab to upload one with a job reference.";
    }

    const jobMatch = q.match(/\b([a-z0-9][-a-z0-9/]{2,})\b/i);
    if (jobMatch) {
      const needle = jobMatch[1].toLowerCase();
      const hit = invoices.find(
        (row) =>
          row.jobReference.toLowerCase() === needle ||
          row.jobReference.toLowerCase().includes(needle) ||
          row.id.toLowerCase().includes(needle),
      );
      if (hit) {
        return [
          `Invoice for job ${hit.jobReference}:`,
          `Status: ${statusLabel(hit.status)}`,
          `Amount: ${hit.amount == null ? "Not set" : money(hit.amount, hit.currency)}`,
          hit.description ? `Description: ${hit.description}` : null,
          `Submitted: ${new Date(hit.submittedAt).toLocaleDateString("en-GB")}`,
          hit.fileName ? `File: ${hit.fileName}` : "No file attached",
        ]
          .filter(Boolean)
          .join("\n");
      }
    }

    const lines = invoices
      .slice(0, 10)
      .map(
        (row) =>
          `• ${row.jobReference} — ${row.amount == null ? "amount n/a" : money(row.amount, row.currency)} — ${statusLabel(row.status)}`,
      );
    return [
      `You have ${invoices.length} invoice${invoices.length === 1 ? "" : "s"}:`,
      `${summary.pending.length} pending (${money(summary.pendingTotal, summary.currency)}), ${summary.paid.length} paid (${money(summary.paidTotal, summary.currency)}), ${summary.notStarted.length} job not started.`,
      ...lines,
      invoices.length > 10 ? `…and ${invoices.length - 10} more on the Invoices tab.` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `I can answer from your live partner record for ${partner.companyName}.`,
    `Try asking: “What invoices are pending?”, “Show paid invoices”, “What are my bank details?”, or a specific job reference.`,
    invoices.length > 0
      ? `You currently have ${invoices.length} invoice${invoices.length === 1 ? "" : "s"} on file.`
      : "You have no invoices on file yet — submit one from the Invoices tab.",
  ].join(" ");
}
