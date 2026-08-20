import { NextResponse } from "next/server";

import { listSalesQuotes } from "@/lib/accounting/sales-quotes-service";
import { listLeads } from "@/lib/crm-leads-service";
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { getNorthstarCrmLeads, getNorthstarDiscoveryMeetings } from "@/lib/demo/module-fixtures";
import { listFounderSessionBookings } from "@/lib/founder-booking/service";
import { formatLondonDateTime } from "@/lib/founder-booking/slots";
import { formatDateTimeInTimezone, getFounderBookingTimezone } from "@/lib/founder-booking/timezones";
import { requirePlatformSession } from "@/lib/platform-session";
import { buildSalesDashboardMetrics, type SalesDashboardMeetingSummary } from "@/lib/sales-management-insights";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

async function loadMeetings(workspaceId: string): Promise<SalesDashboardMeetingSummary[]> {
  if (await isDemoApiRequest()) {
    return getNorthstarDiscoveryMeetings().map((meeting) => ({
      id: meeting.id,
      organization: meeting.organization,
      name: meeting.name,
      formattedWhen: meeting.formattedWhenGmt,
      status: meeting.status,
    }));
  }

  const bookings = await listFounderSessionBookings({ workspaceId });
  return Promise.all(
    bookings.map(async (booking) => {
      const timezoneMeta = getFounderBookingTimezone(booking.clientTimezone ?? "Europe/London");
      return {
        id: booking.id,
        organization: booking.organization,
        name: booking.name,
        formattedWhen:
          formatDateTimeInTimezone(booking.startsAt, timezoneMeta.id) ??
          formatLondonDateTime(booking.startsAt),
        status: booking.status,
      };
    }),
  );
}

export async function GET() {
  try {
    if (await isDemoApiRequest()) {
      const leads = getNorthstarCrmLeads();
      const quotes = await listSalesQuotes({ workspaceSlug: "demo" });
      const meetings = await loadMeetings("demo");
      return NextResponse.json({
        metrics: buildSalesDashboardMetrics({ leads, quotes, meetings }),
        workspace: { id: "demo", slug: "demo", name: "Demo" },
      });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
    }

    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const [leads, quotes, meetings] = await Promise.all([
      listLeads("All", { workspaceId: workspace.id }),
      listSalesQuotes({ workspaceId: workspace.id, workspaceSlug: workspace.slug }),
      loadMeetings(workspace.id),
    ]);

    return NextResponse.json({
      metrics: buildSalesDashboardMetrics({ leads, quotes, meetings }),
      workspace: { id: workspace.id, slug: workspace.slug, name: workspace.name },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load sales dashboard.";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
