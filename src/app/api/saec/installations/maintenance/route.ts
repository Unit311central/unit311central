import { NextRequest, NextResponse } from "next/server";

import { requireSaecInstallationsWorkspace } from "@/lib/saec/installations-auth";
import { createSaecMaintenanceAssignment } from "@/lib/saec/installations-service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { workspace } = await requireSaecInstallationsWorkspace();
    const body = (await request.json()) as {
      assetId?: string;
      date?: string;
      engineerName?: string;
      maintenanceType?: string;
      result?: string;
      notes?: string;
    };
    if (!body.assetId?.trim()) {
      return NextResponse.json({ error: "Asset ID is required." }, { status: 400 });
    }
    if (!body.date?.trim()) {
      return NextResponse.json({ error: "Date is required." }, { status: 400 });
    }
    if (!body.engineerName?.trim()) {
      return NextResponse.json({ error: "Engineer is required." }, { status: 400 });
    }
    if (!body.maintenanceType?.trim()) {
      return NextResponse.json({ error: "Maintenance type is required." }, { status: 400 });
    }
    const record = await createSaecMaintenanceAssignment(workspace.id, {
      assetId: body.assetId,
      date: body.date,
      engineerName: body.engineerName,
      maintenanceType: body.maintenanceType,
      result: body.result,
      notes: body.notes,
    });
    return NextResponse.json({ record });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create maintenance assignment.";
    const status =
      message.includes("Authentication") || message.includes("Workspace context") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
