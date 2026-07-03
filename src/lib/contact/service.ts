import {
  buildContactConfirmationEmail,
  buildContactInternalNotificationEmail,
  type ContactEnquiryInput,
} from "@/lib/contact/emails";
import { getAccountDefinition } from "@/lib/email/accounts";
import { sendMailboxEmail } from "@/lib/email/smtp";
import { EmailServiceError } from "@/lib/email/types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeInput(input: {
  name?: string;
  company?: string;
  email?: string;
  subject?: string;
  message?: string;
}): ContactEnquiryInput {
  const name = input.name?.trim() ?? "";
  const company = input.company?.trim() ?? "";
  const email = input.email?.trim() ?? "";
  const subject = input.subject?.trim() ?? "";
  const message = input.message?.trim() ?? "";

  if (!name) throw new Error("Name is required.");
  if (!email) throw new Error("Email is required.");
  if (!EMAIL_PATTERN.test(email)) throw new Error("Please enter a valid email address.");
  if (!message) throw new Error("Project details are required.");
  if (name.length > 120) throw new Error("Name is too long.");
  if (company.length > 160) throw new Error("Company name is too long.");
  if (subject.length > 200) throw new Error("Subject is too long.");
  if (message.length > 8000) throw new Error("Message is too long.");

  return { name, company, email, subject, message };
}

export async function sendContactEnquiry(rawInput: {
  name?: string;
  company?: string;
  email?: string;
  subject?: string;
  message?: string;
}) {
  const input = normalizeInput(rawInput);
  const confirmation = buildContactConfirmationEmail(input);
  const internal = buildContactInternalNotificationEmail(input);
  const infoEmail = getAccountDefinition("info").email;

  try {
    const [confirmationResult, internalResult] = await Promise.all([
      sendMailboxEmail({
        account: "info",
        to: input.email,
        subject: confirmation.subject,
        html: confirmation.html,
        text: confirmation.text,
      }),
      sendMailboxEmail({
        account: "info",
        to: infoEmail,
        replyTo: input.email,
        subject: internal.subject,
        html: internal.html,
        text: internal.text,
      }),
    ]);

    return {
      confirmationMessageId: confirmationResult.messageId,
      internalMessageId: internalResult.messageId,
    };
  } catch (error) {
    if (error instanceof EmailServiceError) {
      throw new Error(
        error.code === "NOT_CONFIGURED" || error.message.includes("not configured")
          ? "Email is not configured yet. Please email us directly at info@unit311central.com."
          : "We couldn't send your enquiry right now. Please try again or email info@unit311central.com.",
      );
    }
    throw error instanceof Error
      ? error
      : new Error("We couldn't send your enquiry right now. Please try again.");
  }
}
