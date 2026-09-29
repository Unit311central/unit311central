import { NextResponse } from "next/server";

import { apiErrorStatus } from "@/lib/api-error-status";
import { listCronofyCalendars } from "@/lib/cronofy/client";
import { getCronofyConfig } from "@/lib/cronofy/config";
import { getCronofyAccount, getValidCronofyAccessToken } from "@/lib/cronofy/cronofy-account-service";
import { requireTalantonGovernanceWorkspace } from "@/lib/talanton/workspace-governance-service";
import { getPlatformSession } from "@/lib/platform-session";
import { WorkspaceAccessError } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!getCronofyConfig()) {
    return NextResponse.json({ configured: false, connected: false });
  }

  try {
    const workspace = await requireTalantonGovernanceWorkspace();
    const account = await getCronofyAccount({
      platformUserId: session.sub,
      workspaceId: workspace.id,
    });
    if (!account?.refreshToken) {
      return NextResponse.json({
        configured: true,
        connected: false,
        username: session.username,
      });
    }

    const { accessToken } = await getValidCronofyAccessToken({
      platformUserId: session.sub,
      workspaceId: workspace.id,
    });
    const calendars = await listCronofyCalendars(accessToken);
    const writable = calendars.filter((c) => !c.calendar_deleted && !c.calendar_readonly);

    console.info(
      "[cronofy/status]",
      JSON.stringify({
        platformUserId: session.sub,
        workspaceId: workspace.id,
        linkedProviderName: account.linkedProviderName,
        linkedProfileName: account.linkedProfileName,
        writableCalendarCount: writable.length,
        calendars: writable.map((c) => ({
          calendarId: c.calendar_id,
          calendarName: c.calendar_name,
          providerName: c.provider_name,
          profileName: c.profile_name,
          calendarPrimary: c.calendar_primary,
          integratedConferencingAvailable: c.calendar_integrated_conferencing_available,
        })),
      }),
    );

    return NextResponse.json({
      configured: true,
      connected: true,
      username: session.username,
      platformUserId: session.sub,
      linkedProfileName: account.linkedProfileName,
      linkedProviderName: account.linkedProviderName,
      calendars: writable.map((c) => ({
        calendarId: c.calendar_id,
        calendarName: c.calendar_name,
        providerName: c.provider_name,
        profileName: c.profile_name,
        calendarPrimary: c.calendar_primary,
        integratedConferencingAvailable: c.calendar_integrated_conferencing_available,
      })),
    });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to load Cronofy status.";
    return NextResponse.json({ error: message }, { status: apiErrorStatus(error) });
  }
}
