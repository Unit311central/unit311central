export type EmployeeWriteInput = {
  firstName: string;
  lastName: string;
  employeeNumber: string;
  department: string;
  jobTitle: string;
  email: string;
  active: boolean;
};

export function parseEmployeeWrite(body: unknown): { value: EmployeeWriteInput } | { error: string } {
  if (!body || typeof body !== "object") return { error: "Invalid employee payload." };
  const record = body as Record<string, unknown>;
  const firstName = text(record.firstName);
  const lastName = text(record.lastName);
  const employeeNumber = text(record.employeeNumber);
  if (!firstName || !lastName || !employeeNumber) {
    return { error: "First name, last name, and employee number are required." };
  }
  if (employeeNumber.length > 40 || firstName.length > 80 || lastName.length > 80) {
    return { error: "One of the name fields is too long." };
  }
  const email = text(record.email);
  if (email && !/^[^\s@]+@[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  return {
    value: {
      firstName,
      lastName,
      employeeNumber,
      department: text(record.department),
      jobTitle: text(record.jobTitle),
      email,
      active: record.active !== false,
    },
  };
}

export function parseNfcUid(body: unknown): { value: string } | { error: string } {
  if (!body || typeof body !== "object") return { error: "Invalid badge payload." };
  const uid = text((body as Record<string, unknown>).nfcUid).toUpperCase();
  if (!/^[0-9A-F:]{4,64}$/.test(uid)) {
    return { error: "Enter an NFC badge identifier (letters, numbers, or colons)." };
  }
  return { value: uid };
}

function text(value: unknown): string {
  return String(value ?? "").trim();
}
