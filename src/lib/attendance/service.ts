import "server-only";

import { ATTENDANCE_CAST } from "@/lib/attendance/cast";
import { DEMO_ATTENDANCE_WORKSPACE_ID } from "@/lib/attendance/constants";
import { simulationResetFilter } from "@/lib/attendance/isolation";
import { classifyAttendanceDay, type AttendanceStatusLabel } from "@/lib/attendance/status";
import { londonIsoDate, londonParts, londonWallTimeToUtc } from "@/lib/attendance/time";
import type { EmployeeWriteInput } from "@/lib/attendance/validation";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";

const WORKSPACE_ID = DEMO_ATTENDANCE_WORKSPACE_ID;

export type AttendanceEmployeeRecord = {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  department: string;
  jobTitle: string;
  email: string;
  active: boolean;
  nfcUid: string | null;
  badgeId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AttendanceHistoryEvent = {
  id: string;
  eventType: "IN" | "OUT";
  eventTimestamp: string;
  source: "SIMULATED" | "NFC";
  simulationId: string | null;
  nfcUid: string | null;
};

export type AttendanceDashboardRow = {
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  department: string;
  clockIn: string | null;
  clockOut: string | null;
  hoursWorked: number | null;
  status: AttendanceStatusLabel;
};

type EmployeeRow = {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  department: string;
  job_title: string;
  email: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  attendance_badges?: Array<{ id: string; nfc_uid: string; active: boolean }> | null;
};

type EventRow = {
  id: string;
  employee_id: string;
  badge_id: string | null;
  event_type: "IN" | "OUT";
  event_timestamp: string;
  source: "SIMULATED" | "NFC";
  simulation_id: string | null;
};

function client() {
  return createTenancyServerClient();
}

async function withBadges(rows: EmployeeRow[]): Promise<AttendanceEmployeeRecord[]> {
  if (!rows.length) return [];
  const supabase = client();
  const { data, error } = await supabase
    .from("attendance_badges")
    .select("id, employee_id, nfc_uid, active")
    .eq("workspace_id", WORKSPACE_ID)
    .in(
      "employee_id",
      rows.map((row) => row.id),
    );
  if (error) throw error;
  const badges = new Map<string, Array<{ id: string; nfc_uid: string; active: boolean }>>();
  for (const badge of data ?? []) {
    const employeeId = badge.employee_id as string;
    const list = badges.get(employeeId) ?? [];
    list.push({
      id: badge.id as string,
      nfc_uid: badge.nfc_uid as string,
      active: Boolean(badge.active),
    });
    badges.set(employeeId, list);
  }
  return rows.map((row) => mapEmployee({ ...row, attendance_badges: badges.get(row.id) ?? [] }));
}

function mapEmployee(row: EmployeeRow): AttendanceEmployeeRecord {
  const badge = (row.attendance_badges ?? []).find((item) => item.active) ?? null;
  return {
    id: row.id,
    employeeNumber: row.employee_number,
    firstName: row.first_name,
    lastName: row.last_name,
    department: row.department,
    jobTitle: row.job_title,
    email: row.email,
    active: row.active,
    nfcUid: badge?.nfc_uid ?? null,
    badgeId: badge?.id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

let attendanceCastReady = false;

export async function ensureAttendanceCast(): Promise<void> {
  if (attendanceCastReady) return;
  const supabase = client();
  const { data: existing, error } = await supabase
    .from("attendance_employees")
    .select("id, employee_number")
    .eq("workspace_id", WORKSPACE_ID);
  if (error) throw error;

  const byNumber = new Map((existing ?? []).map((row) => [row.employee_number as string, row.id as string]));

  for (const member of ATTENDANCE_CAST) {
    let employeeId = byNumber.get(member.employeeNumber);
    if (!employeeId) {
      const { data, error: insertError } = await supabase
        .from("attendance_employees")
        .insert({
          workspace_id: WORKSPACE_ID,
          employee_number: member.employeeNumber,
          first_name: member.firstName,
          last_name: member.lastName,
          department: member.department,
          job_title: member.jobTitle,
          email: member.email,
          active: true,
        })
        .select("id")
        .single();
      if (insertError) throw insertError;
      employeeId = data.id as string;
      byNumber.set(member.employeeNumber, employeeId);
    }

    const { data: badges, error: badgeError } = await supabase
      .from("attendance_badges")
      .select("id, nfc_uid, active")
      .eq("workspace_id", WORKSPACE_ID)
      .eq("employee_id", employeeId);
    if (badgeError) throw badgeError;
    const activeBadge = (badges ?? []).find((badge) => badge.active);
    if (!activeBadge) {
      const { error: assignError } = await supabase.from("attendance_badges").insert({
        workspace_id: WORKSPACE_ID,
        employee_id: employeeId,
        nfc_uid: member.nfcUid,
        active: true,
      });
      if (assignError && assignError.code !== "23505") throw assignError;
    }

    const scheduleRows = [1, 2, 3, 4, 5].map((day) => ({
      workspace_id: WORKSPACE_ID,
      employee_id: employeeId,
      day_of_week: day,
      expected_start: member.expectedStart,
      expected_end: member.expectedEnd,
    }));
    const { error: scheduleError } = await supabase
      .from("attendance_schedules")
      .upsert(scheduleRows, { onConflict: "workspace_id,employee_id,day_of_week", ignoreDuplicates: true });
    if (scheduleError) throw scheduleError;
  }
  attendanceCastReady = true;
}

export async function listAttendanceEmployees(): Promise<AttendanceEmployeeRecord[]> {
  await ensureAttendanceCast();
  const supabase = client();
  const { data, error } = await supabase
    .from("attendance_employees")
    .select("*")
    .eq("workspace_id", WORKSPACE_ID)
    .order("employee_number", { ascending: true });
  if (error) throw error;
  return withBadges((data ?? []) as EmployeeRow[]);
}

export async function createAttendanceEmployee(
  input: EmployeeWriteInput,
): Promise<AttendanceEmployeeRecord> {
  const supabase = client();
  const { data, error } = await supabase
    .from("attendance_employees")
    .insert({
      workspace_id: WORKSPACE_ID,
      employee_number: input.employeeNumber,
      first_name: input.firstName,
      last_name: input.lastName,
      department: input.department,
      job_title: input.jobTitle,
      email: input.email,
      active: input.active,
    })
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") throw new Error("That employee number is already in use.");
    throw error;
  }
  const [employee] = await withBadges([data as EmployeeRow]);
  return employee;
}

export async function updateAttendanceEmployee(
  employeeId: string,
  input: EmployeeWriteInput,
): Promise<AttendanceEmployeeRecord> {
  const supabase = client();
  const { data, error } = await supabase
    .from("attendance_employees")
    .update({
      employee_number: input.employeeNumber,
      first_name: input.firstName,
      last_name: input.lastName,
      department: input.department,
      job_title: input.jobTitle,
      email: input.email,
      active: input.active,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", WORKSPACE_ID)
    .eq("id", employeeId)
    .select("*")
    .maybeSingle();
  if (error) {
    if (error.code === "23505") throw new Error("That employee number is already in use.");
    throw error;
  }
  if (!data) throw new Error("Employee not found.");
  const [employee] = await withBadges([data as EmployeeRow]);
  return employee;
}

export async function replaceAttendanceBadge(
  employeeId: string,
  nfcUid: string,
): Promise<AttendanceEmployeeRecord> {
  const supabase = client();
  const { data: employee, error: employeeError } = await supabase
    .from("attendance_employees")
    .select("id")
    .eq("workspace_id", WORKSPACE_ID)
    .eq("id", employeeId)
    .maybeSingle();
  if (employeeError) throw employeeError;
  if (!employee) throw new Error("Employee not found.");

  const { data: holders, error: holderError } = await supabase
    .from("attendance_badges")
    .select("id, employee_id")
    .eq("workspace_id", WORKSPACE_ID)
    .eq("nfc_uid", nfcUid)
    .eq("active", true);
  if (holderError) throw holderError;
  const other = (holders ?? []).find((badge) => badge.employee_id !== employeeId);
  if (other) throw new Error("That NFC badge is already assigned to another employee.");

  const current = (holders ?? []).find((badge) => badge.employee_id === employeeId);
  if (!current) {
    const { error: retireError } = await supabase
      .from("attendance_badges")
      .update({ active: false })
      .eq("workspace_id", WORKSPACE_ID)
      .eq("employee_id", employeeId)
      .eq("active", true);
    if (retireError) throw retireError;

    const { error: insertError } = await supabase.from("attendance_badges").insert({
      workspace_id: WORKSPACE_ID,
      employee_id: employeeId,
      nfc_uid: nfcUid,
      active: true,
    });
    if (insertError) {
      if (insertError.code === "23505") {
        throw new Error("That NFC badge is already assigned to another employee.");
      }
      throw insertError;
    }
  }

  const employees = await listAttendanceEmployees();
  const updated = employees.find((item) => item.id === employeeId);
  if (!updated) throw new Error("Employee not found.");
  return updated;
}

export async function listAttendanceHistory(employeeId: string): Promise<AttendanceHistoryEvent[]> {
  const supabase = client();
  const { data, error } = await supabase
    .from("attendance_events")
    .select("id, event_type, event_timestamp, source, simulation_id, badge_id")
    .eq("workspace_id", WORKSPACE_ID)
    .eq("employee_id", employeeId)
    .order("event_timestamp", { ascending: false })
    .limit(200);
  if (error) throw error;

  const badgeIds = [...new Set((data ?? []).map((row) => row.badge_id).filter(Boolean))] as string[];
  const uidByBadge = new Map<string, string>();
  if (badgeIds.length) {
    const { data: badges, error: badgeError } = await supabase
      .from("attendance_badges")
      .select("id, nfc_uid")
      .eq("workspace_id", WORKSPACE_ID)
      .in("id", badgeIds);
    if (badgeError) throw badgeError;
    for (const badge of badges ?? []) uidByBadge.set(badge.id as string, badge.nfc_uid as string);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    eventType: row.event_type as "IN" | "OUT",
    eventTimestamp: row.event_timestamp as string,
    source: row.source as "SIMULATED" | "NFC",
    simulationId: (row.simulation_id as string | null) ?? null,
    nfcUid: row.badge_id ? (uidByBadge.get(row.badge_id as string) ?? null) : null,
  }));
}

export async function recordAttendanceEvent(input: {
  employeeId?: string | null;
  employeeNumber?: string | null;
  nfcUid?: string | null;
  eventType: "IN" | "OUT";
  eventTimestamp: string;
  source: "SIMULATED" | "NFC";
  simulationId?: string | null;
}): Promise<{ id: string; duplicate: boolean }> {
  if (input.eventType !== "IN" && input.eventType !== "OUT") {
    throw new Error("Event type must be IN or OUT.");
  }
  if (input.source !== "SIMULATED" && input.source !== "NFC") {
    throw new Error("Event source must be SIMULATED or NFC.");
  }
  const timestamp = new Date(input.eventTimestamp);
  if (Number.isNaN(timestamp.getTime())) throw new Error("Event timestamp is invalid.");

  const simulationId = input.simulationId?.trim() || null;
  if (input.source === "SIMULATED" && !simulationId) {
    throw new Error("Simulated events must include a simulation id.");
  }
  if (input.source === "NFC" && simulationId) {
    throw new Error("NFC events cannot belong to a simulation.");
  }

  await ensureAttendanceCast();
  const supabase = client();
  const resolved = await resolveEmployee(input);
  const badgeId = resolved.badgeId;

  if (simulationId) {
    const { data: existing, error: existingError } = await supabase
      .from("attendance_events")
      .select("id")
      .eq("workspace_id", WORKSPACE_ID)
      .eq("simulation_id", simulationId)
      .eq("employee_id", resolved.employeeId)
      .eq("event_type", input.eventType)
      .eq("event_timestamp", timestamp.toISOString())
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing?.id) return { id: existing.id as string, duplicate: true };
  }

  const { data, error } = await supabase
    .from("attendance_events")
    .insert({
      workspace_id: WORKSPACE_ID,
      employee_id: resolved.employeeId,
      badge_id: badgeId,
      event_type: input.eventType,
      event_timestamp: timestamp.toISOString(),
      source: input.source,
      simulation_id: simulationId,
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505" && simulationId) {
      const { data: existing } = await supabase
        .from("attendance_events")
        .select("id")
        .eq("workspace_id", WORKSPACE_ID)
        .eq("simulation_id", simulationId)
        .eq("employee_id", resolved.employeeId)
        .eq("event_type", input.eventType)
        .eq("event_timestamp", timestamp.toISOString())
        .maybeSingle();
      if (existing?.id) return { id: existing.id as string, duplicate: true };
    }
    throw error;
  }
  return { id: data.id as string, duplicate: false };
}

async function resolveEmployee(input: {
  employeeId?: string | null;
  employeeNumber?: string | null;
  nfcUid?: string | null;
}): Promise<{ employeeId: string; badgeId: string | null }> {
  const supabase = client();
  if (input.nfcUid) {
    const uid = input.nfcUid.trim().toUpperCase();
    const { data, error } = await supabase
      .from("attendance_badges")
      .select("id, employee_id")
      .eq("workspace_id", WORKSPACE_ID)
      .eq("nfc_uid", uid)
      .eq("active", true)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("No active employee is assigned to that NFC badge.");
    return { employeeId: data.employee_id as string, badgeId: data.id as string };
  }

  let query = supabase.from("attendance_employees").select("id").eq("workspace_id", WORKSPACE_ID);
  if (input.employeeId) query = query.eq("id", input.employeeId);
  else if (input.employeeNumber) query = query.eq("employee_number", input.employeeNumber.trim());
  else throw new Error("An employee or NFC badge is required.");

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Employee not found in the demo attendance roster.");
  const { data: badges, error: badgeError } = await supabase
    .from("attendance_badges")
    .select("id, active")
    .eq("workspace_id", WORKSPACE_ID)
    .eq("employee_id", data.id)
    .eq("active", true)
    .limit(1);
  if (badgeError) throw badgeError;
  return { employeeId: data.id as string, badgeId: (badges?.[0]?.id as string | undefined) ?? null };
}

export async function resetAttendanceSimulation(simulationId: string): Promise<{ deleted: number }> {
  const filter = simulationResetFilter(simulationId);
  const supabase = client();
  const { data, error } = await supabase
    .from("attendance_events")
    .delete()
    .eq("workspace_id", filter.workspaceId)
    .eq("simulation_id", filter.simulationId)
    .eq("source", filter.source)
    .select("id");
  if (error) throw error;
  return { deleted: data?.length ?? 0 };
}

export async function buildAttendanceDashboard(input: {
  date: string;
  employeeId?: string | null;
  asOf?: string | null;
}): Promise<{
  date: string;
  kpis: {
    totalEmployees: number;
    onSite: number;
    clockIns: number;
    missingClockOuts: number;
    lateArrivals: number;
    earlyDepartures: number;
  };
  rows: AttendanceDashboardRow[];
  employees: Array<{ id: string; employeeNumber: string; name: string }>;
}> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error("Choose a valid date.");
  await ensureAttendanceCast();
  const supabase = client();
  const weekday = londonParts(londonWallTimeToUtc(input.date, "12:00")).weekday;
  const dayStart = londonWallTimeToUtc(input.date, "00:00").toISOString();
  const dayEnd = londonWallTimeToUtc(addOneDay(input.date), "00:00").toISOString();
  const asOf = resolveAsOf(input.date, input.asOf);

  const [{ data: employees, error: employeeError }, { data: schedules, error: scheduleError }, { data: events, error: eventError }] =
    await Promise.all([
      supabase
        .from("attendance_employees")
        .select("id, employee_number, first_name, last_name, department, active")
        .eq("workspace_id", WORKSPACE_ID)
        .order("employee_number", { ascending: true }),
      supabase
        .from("attendance_schedules")
        .select("employee_id, expected_start, expected_end")
        .eq("workspace_id", WORKSPACE_ID)
        .eq("day_of_week", weekday),
      supabase
        .from("attendance_events")
        .select("employee_id, event_type, event_timestamp")
        .eq("workspace_id", WORKSPACE_ID)
        .gte("event_timestamp", dayStart)
        .lt("event_timestamp", dayEnd),
    ]);
  if (employeeError) throw employeeError;
  if (scheduleError) throw scheduleError;
  if (eventError) throw eventError;

  const scheduleByEmployee = new Map(
    (schedules ?? []).map((row) => [
      row.employee_id as string,
      {
        expectedStart: String(row.expected_start).slice(0, 5),
        expectedEnd: String(row.expected_end).slice(0, 5),
      },
    ]),
  );
  const eventsByEmployee = new Map<string, EventRow[]>();
  for (const event of (events ?? []) as EventRow[]) {
    const list = eventsByEmployee.get(event.employee_id) ?? [];
    list.push(event);
    eventsByEmployee.set(event.employee_id, list);
  }

  const active = (employees ?? []).filter((employee) => employee.active);
  const rows = active.map((employee) => {
    const classified = classifyAttendanceDay({
      events: (eventsByEmployee.get(employee.id as string) ?? []).map((event) => ({
        eventType: event.event_type,
        eventTimestamp: event.event_timestamp,
      })),
      schedule: scheduleByEmployee.get(employee.id as string) ?? null,
      dayIso: input.date,
      asOf,
    });
    return {
      employeeId: employee.id as string,
      employeeNumber: employee.employee_number as string,
      employeeName: `${employee.first_name} ${employee.last_name}`,
      department: (employee.department as string) || "—",
      clockIn: classified.clockIn,
      clockOut: classified.clockOut,
      hoursWorked: classified.hoursWorked,
      status: classified.status,
      clockInCount: classified.clockInCount,
      late: classified.late,
      early: classified.early,
      onSite: classified.onSite,
      missingClockOut: classified.missingClockOut,
    };
  });

  const filtered = input.employeeId
    ? rows.filter((row) => row.employeeId === input.employeeId)
    : rows;

  return {
    date: input.date,
    kpis: {
      totalEmployees: active.length,
      onSite: rows.filter((row) => row.onSite).length,
      clockIns: rows.reduce((sum, row) => sum + row.clockInCount, 0),
      missingClockOuts: rows.filter((row) => row.missingClockOut).length,
      lateArrivals: rows.filter((row) => row.late).length,
      earlyDepartures: rows.filter((row) => row.early).length,
    },
    rows: filtered.map(({ clockInCount: _clockInCount, late: _late, early: _early, onSite: _onSite, missingClockOut: _missing, ...row }) => row),
    employees: active.map((employee) => ({
      id: employee.id as string,
      employeeNumber: employee.employee_number as string,
      name: `${employee.first_name} ${employee.last_name}`,
    })),
  };
}

function resolveAsOf(date: string, override?: string | null): Date {
  if (override) {
    const parsed = new Date(override);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const today = londonIsoDate(new Date());
  if (date === today) return new Date();
  if (date > today) return londonWallTimeToUtc(date, "08:00");
  return londonWallTimeToUtc(date, "23:59");
}

function addOneDay(isoDate: string): string {
  const noon = londonWallTimeToUtc(isoDate, "12:00");
  noon.setUTCDate(noon.getUTCDate() + 1);
  return londonIsoDate(noon);
}
