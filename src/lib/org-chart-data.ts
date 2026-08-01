import type { HrEmployee } from "@/lib/hr-data";
import { isActiveHeadcountStatus } from "@/lib/hr-data";

export type OrgChartNode = {
  id: string;
  employee: HrEmployee;
  children: OrgChartNode[];
};

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Resolve reporting line: prefer managerEmployeeId, else match manager name. */
export function resolveManagerId(
  employee: HrEmployee,
  byId: Map<string, HrEmployee>,
  byName: Map<string, HrEmployee>,
): string | null {
  if (employee.managerEmployeeId && byId.has(employee.managerEmployeeId)) {
    return employee.managerEmployeeId;
  }
  const named = employee.manager?.trim();
  if (!named) return null;
  const match = byName.get(normalizeName(named));
  if (!match || match.id === employee.id) return null;
  return match.id;
}

export function buildOrgChartForest(employees: readonly HrEmployee[]): {
  roots: OrgChartNode[];
  orphanCount: number;
  activeCount: number;
} {
  const active = employees.filter((e) => isActiveHeadcountStatus(e.employmentStatus));
  const byId = new Map(active.map((e) => [e.id, e]));
  const byName = new Map<string, HrEmployee>();
  for (const employee of active) {
    byName.set(normalizeName(employee.fullName), employee);
    if (employee.preferredName) {
      const preferred = normalizeName(`${employee.preferredName} ${employee.fullName.split(" ").slice(-1)[0] ?? ""}`);
      if (!byName.has(preferred)) byName.set(preferred, employee);
    }
  }

  const childrenByManager = new Map<string, string[]>();
  const managerOf = new Map<string, string | null>();

  for (const employee of active) {
    const managerId = resolveManagerId(employee, byId, byName);
    managerOf.set(employee.id, managerId);
    if (!managerId) continue;
    const list = childrenByManager.get(managerId) ?? [];
    list.push(employee.id);
    childrenByManager.set(managerId, list);
  }

  const visiting = new Set<string>();
  const built = new Map<string, OrgChartNode>();

  function buildNode(id: string): OrgChartNode | null {
    if (built.has(id)) return built.get(id)!;
    if (visiting.has(id)) return null; // cycle guard
    visiting.add(id);
    const employee = byId.get(id);
    if (!employee) {
      visiting.delete(id);
      return null;
    }
    const childIds = (childrenByManager.get(id) ?? []).slice().sort((a, b) => {
      const left = byId.get(a)?.fullName ?? a;
      const right = byId.get(b)?.fullName ?? b;
      return left.localeCompare(right);
    });
    const children = childIds
      .map((childId) => buildNode(childId))
      .filter((node): node is OrgChartNode => node != null);
    const node: OrgChartNode = { id, employee, children };
    built.set(id, node);
    visiting.delete(id);
    return node;
  }

  const rootIds = active
    .filter((e) => !managerOf.get(e.id))
    .map((e) => e.id)
    .sort((a, b) => (byId.get(a)?.fullName ?? a).localeCompare(byId.get(b)?.fullName ?? b));

  const roots = rootIds
    .map((id) => buildNode(id))
    .filter((node): node is OrgChartNode => node != null);

  const inTree = new Set<string>();
  function walk(node: OrgChartNode) {
    inTree.add(node.id);
    node.children.forEach(walk);
  }
  roots.forEach(walk);

  return {
    roots,
    orphanCount: active.length - inTree.size,
    activeCount: active.length,
  };
}

export function countReports(node: OrgChartNode): number {
  let total = 0;
  for (const child of node.children) {
    total += 1 + countReports(child);
  }
  return total;
}

export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}
