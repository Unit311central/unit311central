import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { calculateEmployeePayroll, nextBonusPayDate, prorateAnnualBonus } from "@/lib/payroll/engine";
import {
  getEmployeePayrollProfile,
  getPayrollSettings,
  upsertEmployeePayrollProfile,
} from "@/lib/payroll/payroll-service";
import { getHrEmployee } from "@/lib/hr-employees-service";
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { getNorthstarEmployeePayrollProfile } from "@/lib/demo/northstar-hr-data";
import {
  getSaecEmployeePayrollProfile,
  getSaecPayrollSettings,
} from "@/lib/saec/saec-payroll-fixtures";
import { isSaecSlug } from "@/lib/saec-surface";
import { requirePlatformSession } from "@/lib/platform-session";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  if (await isDemoApiRequest()) {
    const { id } = await params;
    const payload = getNorthstarEmployeePayrollProfile(id);
    if (!payload) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }
    return NextResponse.json(payload);
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const { id } = await params;
    if (isSaecSlug(workspace.slug)) {
      const saecPayload = getSaecEmployeePayrollProfile(id);
      if (saecPayload) {
        return NextResponse.json({
          profile: saecPayload.profile,
          calculation: saecPayload.calculation,
          settings: getSaecPayrollSettings(),
          nextBonusPayDate: "2027-03-28",
          bonusDueThisYear: saecPayload.profile.bonus,
        });
      }
    }
    const [employee, profileRow, settings] = await Promise.all([
      getHrEmployee(id, { workspaceId: workspace.id }),
      getEmployeePayrollProfile(id, { workspaceId: workspace.id }),
      getPayrollSettings({ workspaceId: workspace.id }),
    ]);
    if (!employee) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }
    const profile = profileRow ?? {
      annualSalary: employee.salaryCurrent,
      monthlySalary: employee.salaryCurrent > 0 ? employee.salaryCurrent / 12 : null,
      bonus: employee.bonus,
      currency: employee.currency,
      payrollFrequency: "monthly",
      taxState: "CA",
      payrollStatus: "active" as const,
      hireDate: employee.dateJoined,
    };
    const joinedOn = profileRow?.hireDate || employee.dateJoined || null;
    const payInput = {
      salaryCurrent: employee.salaryCurrent,
      bonus: employee.bonus,
      payFrequency: employee.payFrequency,
      currency: employee.currency,
      profile: profileRow,
      joinedOn,
    };
    const calculation = calculateEmployeePayroll(payInput, settings);
    const nextBonusDate = nextBonusPayDate(settings);
    const bonusDueThisYear = prorateAnnualBonus({
      annualBonus: Number(profileRow?.bonus ?? employee.bonus ?? 0),
      joinedOn,
      year: Number(nextBonusDate.slice(0, 4)),
      throughMonth: settings.bonusPayMonth,
    });
    return NextResponse.json({
      profile,
      calculation,
      settings,
      employee,
      nextBonusPayDate: nextBonusDate,
      bonusDueThisYear,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load payroll profile.";
    const status = message.includes("Authentication") || message.includes("Workspace") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const { id } = await params;
    const body = await request.json();
    const profile = await upsertEmployeePayrollProfile(id, body ?? {}, {
      workspaceId: workspace.id,
    });
    const [employee, settings] = await Promise.all([
      getHrEmployee(id, { workspaceId: workspace.id }),
      getPayrollSettings({ workspaceId: workspace.id }),
    ]);
    const joinedOn = profile.hireDate || employee?.dateJoined || null;
    const calculation = employee
      ? calculateEmployeePayroll(
          {
            salaryCurrent: employee.salaryCurrent,
            bonus: employee.bonus,
            payFrequency: employee.payFrequency,
            currency: employee.currency,
            profile,
            joinedOn,
          },
          settings,
        )
      : null;
    const nextBonusDate = nextBonusPayDate(settings);
    const bonusDueThisYear = prorateAnnualBonus({
      annualBonus: Number(profile.bonus ?? employee?.bonus ?? 0),
      joinedOn,
      year: Number(nextBonusDate.slice(0, 4)),
      throughMonth: settings.bonusPayMonth,
    });
    return NextResponse.json({
      profile,
      calculation,
      nextBonusPayDate: nextBonusDate,
      bonusDueThisYear,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update payroll profile.";
    const status = message.includes("Authentication") || message.includes("Workspace") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
