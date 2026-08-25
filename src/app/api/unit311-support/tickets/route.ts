import { NextRequest, NextResponse } from "next/server";

import {
  requireCustomerUnit311SupportApiContext,
  requireCustomerUnit311SupportWorkspace,
  unit311SupportErrorResponse,
} from "@/lib/unit311-support/api-helpers";
import {
  createUnit311SupportTicket,
  getUnit311SupportSummaryCounts,
  listUnit311SupportTicketsForOrganisation,
} from "@/lib/unit311-support/service";
import type { Unit311SupportCategory } from "@/lib/unit311-support/types";
import { UNIT311_SUPPORT_CATEGORIES } from "@/lib/unit311-support/data";

export const dynamic = "force-dynamic";

const VALID_CATEGORIES = new Set(UNIT311_SUPPORT_CATEGORIES.map((item) => item.value));

export async function GET() {
  try {
    const ctx = await requireCustomerUnit311SupportApiContext();
    const [tickets, summary] = await Promise.all([
      listUnit311SupportTicketsForOrganisation(ctx.organisationId),
      getUnit311SupportSummaryCounts(ctx.organisationId),
    ]);
    return NextResponse.json({ tickets, summary });
  } catch (error) {
    return unit311SupportErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireCustomerUnit311SupportApiContext();
    const body = (await request.json()) as {
      subject?: string;
      description?: string;
      category?: string;
      affectedModule?: string;
      workspaceId?: string;
    };

    const subject = String(body.subject ?? "").trim();
    const description = String(body.description ?? "").trim();
    const category = String(body.category ?? "other") as Unit311SupportCategory;
    const affectedModule = String(body.affectedModule ?? "").trim();
    const workspaceId = String(body.workspaceId ?? ctx.workspace.id).trim();

    if (!subject) {
      return NextResponse.json({ error: "Subject is required." }, { status: 400 });
    }
    if (!description) {
      return NextResponse.json({ error: "Description is required." }, { status: 400 });
    }
    if (!VALID_CATEGORIES.has(category)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    await requireCustomerUnit311SupportWorkspace(ctx, workspaceId);

    const ticket = await createUnit311SupportTicket({
      organisationId: ctx.organisationId,
      workspaceId,
      submittedByUserId: ctx.actor.userId,
      submittedByName: ctx.actor.displayName,
      submittedByEmail: ctx.actor.email,
      ticket: {
        subject,
        description,
        category,
        affectedModule,
        workspaceId,
      },
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    return unit311SupportErrorResponse(error);
  }
}
