import type { QaWorkspaceTask } from "@/lib/qa-workspace/types";

function escapeCsvCell(value: string | null | undefined): string {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function qaTasksToCsv(tasks: QaWorkspaceTask[], workspaceSlug: string): string {
  const headers = [
    "ID",
    "Status",
    "Completed",
    "Module",
    "Page",
    "Element",
    "Element Type",
    "Description",
    "Route",
    "Workspace",
    "Created At",
    "Updated At",
  ];

  const rows = tasks.map((task) => [
    task.id,
    task.status,
    task.completed ? "true" : "false",
    task.moduleLabel,
    task.pageLabel,
    task.elementLabel,
    task.elementType ?? "",
    task.description,
    task.routePath ?? "",
    workspaceSlug,
    task.createdAt,
    task.updatedAt,
  ]);

  return [headers, ...rows]
    .map((row) => row.map((cell) => escapeCsvCell(String(cell))).join(","))
    .join("\r\n");
}
