import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { createPartnerJob, listPartnerJobs } from "@/lib/partners/jobs-service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    await requirePlatformSession();
    await requireCurrentWorkspace();
    const { id } = await context.params;
    const jobs = await listPartnerJobs(id);
    return NextResponse.json({ jobs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list jobs";
    const status = message.includes("Authentication") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    const session = await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const { id } = await context.params;
    const body = (await request.json()) as {
      jobDate?: string;
      description?: string;
      location?: string;
      clientId?: string;
      clientName?: string;
      baseAmount?: number;
      currency?: string;
      commissionRateId?: string;
      commissionRatePct?: number;
      paymentDueDate?: string;
      createClientInvoice?: boolean;
      createApPayable?: boolean;
    };

    if (!body.jobDate?.trim() || !body.description?.trim()) {
      return NextResponse.json({ error: "Job date and description are required." }, { status: 400 });
    }

    const job = await createPartnerJob({
      partnerId: id,
      workspaceId: workspace.id,
      jobDate: body.jobDate.trim(),
      description: body.description.trim(),
      location: body.location?.trim() || null,
      clientId: body.clientId?.trim() || null,
      clientName: body.clientName?.trim() || null,
      baseAmount: Number(body.baseAmount) || 0,
      currency: body.currency,
      commissionRateId: body.commissionRateId || null,
      commissionRatePct: body.commissionRatePct,
      paymentDueDate: body.paymentDueDate || null,
      createClientInvoice: body.createClientInvoice !== false,
      createApPayable: body.createApPayable !== false,
      submitterUserId: session.sub,
    });

    return NextResponse.json({ job });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create job";
    const status = message.includes("Authentication") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
