export type AttendanceCastMember = {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  department: string;
  jobTitle: string;
  email: string;
  nfcUid: string;
  expectedStart: string;
  expectedEnd: string;
};

/** Fictional demonstration roster. Not linked to HR employee records. */
export const ATTENDANCE_CAST: readonly AttendanceCastMember[] = [
  {
    employeeNumber: "EMP001",
    firstName: "John",
    lastName: "Smith",
    department: "Care",
    jobTitle: "Care Assistant",
    email: "john.smith@northstar.demo",
    nfcUid: "04A111000001",
    expectedStart: "08:30",
    expectedEnd: "17:00",
  },
  {
    employeeNumber: "EMP002",
    firstName: "Sarah",
    lastName: "Jones",
    department: "Nursing",
    jobTitle: "Nurse",
    email: "sarah.jones@northstar.demo",
    nfcUid: "04A111000002",
    expectedStart: "08:00",
    expectedEnd: "16:30",
  },
  {
    employeeNumber: "EMP003",
    firstName: "David",
    lastName: "Brown",
    department: "Maintenance",
    jobTitle: "Maintenance Technician",
    email: "david.brown@northstar.demo",
    nfcUid: "04A111000003",
    expectedStart: "08:00",
    expectedEnd: "17:00",
  },
  {
    employeeNumber: "EMP004",
    firstName: "Emma",
    lastName: "Wilson",
    department: "Administration",
    jobTitle: "Administrator",
    email: "emma.wilson@northstar.demo",
    nfcUid: "04A111000004",
    expectedStart: "09:00",
    expectedEnd: "17:30",
  },
  {
    employeeNumber: "EMP005",
    firstName: "James",
    lastName: "Taylor",
    department: "Care",
    jobTitle: "Senior Care Assistant",
    email: "james.taylor@northstar.demo",
    nfcUid: "04A111000005",
    expectedStart: "08:15",
    expectedEnd: "17:15",
  },
];

export function castMember(employeeNumber: string): AttendanceCastMember | undefined {
  return ATTENDANCE_CAST.find((member) => member.employeeNumber === employeeNumber);
}
