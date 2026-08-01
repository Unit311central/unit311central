/**
 * ABHI reporting-line fixtures — used to seed manager_employee_id + departments
 * so the live Org Chart is a real hierarchy (not everyone flat under the CEO).
 */
export type AbhiOrgLink = {
  employeeId: string;
  department: string;
  /** null = top of chart (CEO) */
  managerEmployeeId: string | null;
};

const PETER = "abhi-emp-peter-ellingworth";
const JANE = "abhi-emp-jane-lewis";
const ANDREW = "abhi-emp-andrew-davies";
const PHIL = "abhi-emp-phil-brown";
const PAUL = "abhi-emp-paul-benton";
const JONATHAN = "abhi-emp-jonathan-evans";
const LUELLA = "abhi-emp-luella-trickett";
const MICHELLE = "abhi-emp-michelle-michelucci";
const JUDITH = "abhi-emp-judith-mellis";

/** Explicit hierarchy for known ABHI staff ids. Others fall back to CEO. */
export const ABHI_ORG_LINKS: readonly AbhiOrgLink[] = [
  { employeeId: PETER, department: "Leadership", managerEmployeeId: null },
  { employeeId: JANE, department: "Leadership", managerEmployeeId: PETER },
  { employeeId: ANDREW, department: "Digital Health", managerEmployeeId: PETER },
  { employeeId: "abhi-emp-rebecca-parkin", department: "Digital Health", managerEmployeeId: ANDREW },
  { employeeId: PHIL, department: "Regulatory", managerEmployeeId: PETER },
  { employeeId: PAUL, department: "International", managerEmployeeId: PETER },
  { employeeId: "abhi-emp-sophie-green", department: "International", managerEmployeeId: PAUL },
  { employeeId: JONATHAN, department: "Communications", managerEmployeeId: JANE },
  {
    employeeId: "abhi-emp-charlotte-hart",
    department: "Communications",
    managerEmployeeId: JONATHAN,
  },
  { employeeId: LUELLA, department: "Market Access", managerEmployeeId: JANE },
  {
    employeeId: "abhi-emp-owain-prescott",
    department: "Market Access",
    managerEmployeeId: LUELLA,
  },
  { employeeId: MICHELLE, department: "International Events", managerEmployeeId: JANE },
  { employeeId: JUDITH, department: "UK Market Affairs", managerEmployeeId: PETER },
  {
    employeeId: "abhi-emp-addie-macgregor",
    department: "Sustainability",
    managerEmployeeId: JANE,
  },
];

export function abhiOrgLinkByEmployeeId(): Map<string, AbhiOrgLink> {
  return new Map(ABHI_ORG_LINKS.map((link) => [link.employeeId, link]));
}
