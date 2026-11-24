import { NextResponse } from "next/server";

import { listLeads } from "@/lib/crm-leads-service";
import { listFounderSessionBookings } from "@/lib/founder-booking/service";
import { formatLondonDateTime } from "@/lib/founder-booking/slots";
import { formatDateTimeInTimezone, getFounderBookingTimezone } from "@/lib/founder-booking/timezones";
import { resolveSlugReportingCurrency } from "@/lib/financial-reporting-currency";
import { requirePlatformSession } from "@/lib/platform-session";
import { buildSalesDashboardMetrics, type SalesDashboardMeetingSummary } from "@/lib/sales-management-insights";
import { loadSalesQuotesForWorkspace } from "@/lib/sales-management-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { readRequestedSalesBusinessContext, salesRecordScope } from "@/lib/sales-business-context";
import { salesManagementErrorResponse } from "@/lib/sales-management-api";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

async function loadMeetings(
  workspaceId: string,
  businessContext?: import("@/lib/sales-business-context").SalesBusinessContext | null,
): Promise<SalesDashboardMeetingSummary[]> {
  const bookings = await listFounderSessionBookings({ workspaceId, businessContext });
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

export async function GET(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
    }

    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const scope = salesRecordScope(workspace, readRequestedSalesBusinessContext(request));
    const reportingCurrency = resolveSlugReportingCurrency(workspace.slug);
    const [leads, quotes, meetings] = await Promise.all([
      listLeads("All", scope),
      loadSalesQuotesForWorkspace(scope),
      loadMeetings(workspace.id, scope.businessContext),
    ]);

    return NextResponse.json({
      metrics: buildSalesDashboardMetrics({
        leads,
        quotes,
        meetings,
        workspaceSlug: workspace.slug,
        reportingCurrency: reportingCurrency as import("@/lib/sales-management-insights").SalesReportingCurrency,
      }),
      workspace: { id: workspace.id, slug: workspace.slug, name: workspace.name },
    });
  } catch (error) {
    return salesManagementErrorResponse(error);
  }
}
