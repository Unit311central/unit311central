import { NextRequest, NextResponse } from "next/server";

import { createHrEmployee, listHrEmployees } from "@/lib/hr-employees-service";
import type { HrDocuments } from "@/lib/hr-data";
import { ensureHrEmployeesTable } from "@/lib/internal-db-migrations";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type EmployeeBody = {
  fullName?: string;
  email?: string;
  phone?: string;
  dateJoined?: string;
  location?: string;
  role?: string;
  department?: string;
  manager?: string;
  salaryCurrent?: number;
  salaryPrevious?: number;
  salaryIncreaseDate?: string | null;
  salaryIncreaseAmount?: number;
  bonus?: number;
  holidayCalendar?: string;
  vacationDaysPerYear?: number;
  vacationDaysTaken?: number;
  documents?: HrDocuments;
};

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await ensureHrEmployeesTable();
    const employees = await listHrEmployees();
    return NextResponse.json({ employees });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load employees";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as EmployeeBody;

    if (!body.fullName?.trim()) {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    }

    await ensureHrEmployeesTable();
    const employee = await createHrEmployee({
      ...body,
      fullName: body.fullName.trim(),
    });
    return NextResponse.json({ employee });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create employee";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
