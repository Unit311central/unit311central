import { NextResponse } from "next/server";

import { isDemoApiRequest } from "@/lib/demo/demo-request";
import {
  getDemoPublicEmailAccounts,
  isDemoEmailAccountConfigured,
} from "@/lib/email/demo-mailbox";
import { ensureWorkspaceMailboxCredentialsFromEnv } from "@/lib/email/credentials-service";
import { listWorkspaceMailboxProfiles } from "@/lib/email/mailbox-registry";
import { PLATFORM_EMAIL_ACCOUNT_IDS } from "@/lib/email/platform-mailbox";
import { requirePlatformSession } from "@/lib/platform-session";
import { isDemoWiseWorkspaceSlug } from "@/lib/treasury/bank-provider";
import { isPlatformWorkspaceSlug } from "@/lib/workspace-brand";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authErrorStatus(message: string) {
  return message.includes("Authentication required") || message.includes("Workspace context")
    ? 401
    : 500;
}

export async function GET() {
  if (await isDemoApiRequest()) {
    const accounts = getDemoPublicEmailAccounts()
      .filter((account) => account.id === "demo")
      .map((account) => ({
        ...account,
        configured: isDemoEmailAccountConfigured(account.id),
        provider: "zoho" as const,
        addresses: [{ address: account.email, kind: "primary" as const }],
      }));
    return NextResponse.json(accounts);
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    void isDemoWiseWorkspaceSlug(workspace.slug);

    if (isPlatformWorkspaceSlug(workspace.slug)) {
      await ensureWorkspaceMailboxCredentialsFromEnv(PLATFORM_EMAIL_ACCOUNT_IDS, {
        workspaceId: workspace.id,
      });
    }

    const profiles = await listWorkspaceMailboxProfiles({
      workspaceId: workspace.id,
      workspaceSlug: workspace.slug,
    });

    return NextResponse.json(
      profiles.map((profile) => ({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        provider: profile.provider,
        configured: profile.configured,
        addresses: profile.addresses,
      })),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load email accounts";
    return NextResponse.json({ error: message }, { status: authErrorStatus(message) });
  }
}
