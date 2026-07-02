import { NextRequest, NextResponse } from "next/server";

import { deleteHrEmployee, updateHrEmployee } from "@/lib/hr-employees-service";
import type { HrDocuments } from "@/lib/hr-data";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

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

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as EmployeeBody;

    const employee = await updateHrEmployee(id, body);
    return NextResponse.json({ employee });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update employee";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    await deleteHrEmployee(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete employee";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
