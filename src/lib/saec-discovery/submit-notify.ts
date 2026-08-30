import "server-only";

import { SAEC_DISCOVERY_SECTIONS, readSectionAnswer } from "@/lib/saec-discovery/config";
import type { SaecDiscoverySubmissionRecord } from "@/lib/saec-discovery/types";

const SAEC_DISCOVERY_NOTIFY_EMAIL = "paul@unit311central.com";

function formatSubmissionSummary(submission: SaecDiscoverySubmissionRecord): string {
  const lines: string[] = [
    "SAEC Discovery questionnaire submitted.",
    "",
    `Workspace: ${submission.workspaceName}`,
    `Submitted at: ${submission.submittedAt}`,
    submission.submittedByEmail ? `Submitted by: ${submission.submittedByEmail}` : "",
    "",
    "Summary:",
  ].filter(Boolean);

  for (const section of SAEC_DISCOVERY_SECTIONS) {
    const answered = section.kind === "software"
      ? (section.functions ?? []).filter((fn) =>
          readSectionAnswer(submission.responses, section.id, fn.id),
        ).length
      : (section.questions ?? []).filter((question) =>
          readSectionAnswer(submission.responses, section.id, question.id),
        ).length;
    lines.push(`- ${section.title}: ${answered} answered field(s)`);
  }

  lines.push("", "View full responses in Internal → Analytics → SAEC Feedback.");
  return lines.join("\n");
}

/** Notify Paul when SAEC submits the discovery questionnaire (not on draft save). */
export async function notifySaecDiscoverySubmitted(
  submission: SaecDiscoverySubmissionRecord,
): Promise<boolean> {
  try {
    const { sendMailboxEmail } = await import("@/lib/email/smtp");
    const text = formatSubmissionSummary(submission);
    await sendMailboxEmail({
      account: "info",
      to: SAEC_DISCOVERY_NOTIFY_EMAIL,
      subject: "SAEC Discovery submitted",
      text,
      html: text
        .split("\n")
        .map((line) => (line ? `<p>${line.replace(/</g, "&lt;")}</p>` : "<br/>"))
        .join(""),
    });
    return true;
  } catch (error) {
    console.warn("[saec-discovery] submit notification email failed:", error);
    return false;
  }
}
