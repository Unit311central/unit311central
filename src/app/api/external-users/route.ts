import { NextRequest, NextResponse } from "next/server";

import {
  requireInternalWorkspaceSession,
  requireUsersModuleAdministratorSession,
} from "@/lib/internal-admin-auth";
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { getNorthstarExternalUsers } from "@/lib/demo/northstar-api-fixtures";
import {
  createExternalUser,
  listExternalUsers,
  listTalantonLinkableCompanies,
} from "@/lib/external-platform-users-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { TALANTON_IMPACT_SLUG } from "@/lib/talanton-surface";

export const dynamic = "force-dynamic";

export async function GET() {
  // Clients Dashboard metrics need a read for any authenticated workspace operator.
  const auth = await requireInternalWorkspaceSession();
  if ("error" in auth) return auth.error;

  if (await isDemoApiRequest()) {
    return NextResponse.json({ users: getNorthstarExternalUsers(), linkableCompanies: [] });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const users = await listExternalUsers();
    const linkableCompanies =
      auth.workspace.slug === TALANTON_IMPACT_SLUG
        ? await listTalantonLinkableCompanies()
        : [];
    return NextResponse.json({ users, linkableCompanies });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load external users";
    const status = message.includes("migration 095") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUsersModuleAdministratorSession();
  if ("error" in auth) return auth.error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      clientId?: string;
      organisation?: string;
      username?: string;
      email?: string;
      redirectPath?: string;
      password?: string;
    };

    if (!body.username?.trim()) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }
    if (!body.clientId?.trim()) {
      return NextResponse.json(
        { error: "clientId is required (Client Directory FK)." },
        { status: 400 },
      );
    }

    const result = await createExternalUser({
      name: body.name ?? "",
      clientId: body.clientId,
      username: body.username,
      email: body.email,
      redirectPath: body.redirectPath,
      password: body.password,
    });

    return NextResponse.json({
      user: result.user,
      temporaryPassword: result.temporaryPassword,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create external user";
    const status =
      message.includes("migration 095")
        ? 503
        : message.includes("required") || message.includes("not found")
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
