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

/** Drop trailing credentials so "Scott Parazynski, MD" ≈ "Scott Parazynski". */
function nameKeyVariants(value: string): string[] {
  const base = normalizeName(value);
  if (!base) return [];
  const stripped = base.replace(/,\s*(md|phd|mba|pe|cpa)\.?$/i, "").trim();
  return stripped && stripped !== base ? [base, stripped] : [base];
}

function indexEmployeeNames(byName: Map<string, HrEmployee>, employee: HrEmployee) {
  for (const key of nameKeyVariants(employee.fullName)) {
    if (!byName.has(key)) byName.set(key, employee);
  }
  if (employee.preferredName) {
    const last = employee.fullName
      .replace(/,\s*(md|phd|mba|pe|cpa)\.?$/i, "")
      .trim()
      .split(/\s+/)
      .slice(-1)[0];
    if (last) {
      for (const key of nameKeyVariants(`${employee.preferredName} ${last}`)) {
        if (!byName.has(key)) byName.set(key, employee);
      }
    }
  }
}

function lookupByName(
  byName: Map<string, HrEmployee>,
  named: string,
): HrEmployee | undefined {
  for (const key of nameKeyVariants(named)) {
    const match = byName.get(key);
    if (match) return match;
  }
  return undefined;
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
  const match = lookupByName(byName, named);
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
    indexEmployeeNames(byName, employee);
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
    .sort((a, b) => {
      const left = byId.get(a);
      const right = byId.get(b);
      const leftCeo = /ceo|founder/i.test(left?.role ?? "") ? 0 : 1;
      const rightCeo = /ceo|founder/i.test(right?.role ?? "") ? 0 : 1;
      if (leftCeo !== rightCeo) return leftCeo - rightCeo;
      return (left?.fullName ?? a).localeCompare(right?.fullName ?? b);
    });

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
