import { sendMailboxEmail } from "@/lib/email/smtp";
import { buildSupportEmail } from "@/lib/support-email-html";
import { QA_NOTIFY_EMAIL } from "@/lib/qa-workspace/constants";
import { formatQaTaskScopeLabel } from "@/lib/qa-workspace/scope";
import type { QaWorkspaceTask } from "@/lib/qa-workspace/types";

function taskSummaryRows(task: QaWorkspaceTask) {
  return [
    { label: "Scope", value: formatQaTaskScopeLabel(task.scope) },
    { label: "Module", value: task.moduleLabel },
    { label: "Page", value: task.pageLabel },
    { label: "Element", value: task.elementLabel },
    { label: "Status", value: task.completed ? "Completed" : "Open" },
  ];
}

function uniqueRecipients(task: QaWorkspaceTask): string[] {
  const recipients = new Set<string>();
  const creator = task.createdByEmail?.trim().toLowerCase();
  if (creator && creator.includes("@")) recipients.add(creator);
  recipients.add(QA_TASK_NOTIFY_EMAIL.toLowerCase());
  return [...recipients];
}

export async function notifyQaTaskCommentUpdated(
  task: QaWorkspaceTask,
  commentText: string,
): Promise<void> {
  const recipients = uniqueRecipients(task);
  if (recipients.length === 0) return;

  const email = buildSupportEmail({
    preheader: `QA task comment updated — ${task.moduleLabel}`,
    title: "QA task comment updated",
    intro: "A reviewer comment was saved on a QA task.",
    rows: taskSummaryRows(task),
    body: `Comment:\n${commentText.trim() || "—"}\n\nOriginal description:\n${task.description}`,
    footer: "— Unit311 QA Tasks",
  });

  try {
    await sendMailboxEmail({
      account: "info",
      workspaceId: task.workspaceId,
      to: recipients.join(", "),
      subject: `QA task comment — ${task.moduleLabel} / ${task.pageLabel}`,
      text: email.text,
      html: email.html,
    });
  } catch (error) {
    console.warn("[qa-workspace] comment notification email failed:", error);
  }
}

export async function notifyQaTaskCompleted(task: QaWorkspaceTask): Promise<void> {
  const recipients = uniqueRecipients(task);
  if (recipients.length === 0) return;

  const email = buildSupportEmail({
    preheader: `QA task completed — ${task.moduleLabel}`,
    title: "QA task marked completed",
    intro: "A QA task was marked done in the backlog.",
    rows: taskSummaryRows(task),
    body: task.comments?.trim()
      ? `Latest comment:\n${task.comments.trim()}\n\nOriginal description:\n${task.description}`
      : task.description,
    footer: "— Unit311 QA Tasks",
  });

  try {
    await sendMailboxEmail({
      account: "info",
      workspaceId: task.workspaceId,
      to: recipients.join(", "),
      subject: `QA task completed — ${task.moduleLabel} / ${task.pageLabel}`,
      text: email.text,
      html: email.html,
    });
  } catch (error) {
    console.warn("[qa-workspace] completion notification email failed:", error);
  }
}
