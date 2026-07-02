export function formatAssigneeLabel(assignee: string) {
  return assignee.trim().replace(/\s+/g, "");
}

export function formatSupportFlowClientAssignedMessage(ticketId: string, assignee: string) {
  const label = formatAssigneeLabel(assignee);
  return `Support ticket ${ticketId} created. ${label} assigned. Please wait for further communications`;
}

export function formatSupportFlowOperatorAssignedMessage(ticketId: string, assignee: string) {
  const label = formatAssigneeLabel(assignee);
  const displayName = assignee.trim();
  return `Support ticket ${ticketId} created. ${label} assigned. ${displayName} – please check ticket record`;
}
