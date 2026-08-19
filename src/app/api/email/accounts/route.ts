import { NextResponse } from "next/server";

import { isDemoApiRequest } from "@/lib/demo/demo-request";
import {
  getDemoPublicEmailAccounts,
  isDemoEmailAccountConfigured,
  listDemoMailboxMessages,
} from "@/lib/email/demo-mailbox";
import { getPublicEmailAccounts, isAccountConfigured } from "@/lib/email/accounts";
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
      }));
    return NextResponse.json(accounts);
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const demo = isDemoWiseWorkspaceSlug(workspace.slug);
    const accounts = getPublicEmailAccounts({ demo, workspaceSlug: workspace.slug });

    if (isPlatformWorkspaceSlug(workspace.slug)) {
      const { ensureWorkspaceMailboxCredentialsFromEnv } = await import(
        "@/lib/email/credentials-service"
      );
      await ensureWorkspaceMailboxCredentialsFromEnv(PLATFORM_EMAIL_ACCOUNT_IDS, {
        workspaceId: workspace.id,
      });
    } else if (accounts.some((account) => account.id === "demo")) {
      const { ensureWorkspaceMailboxCredentialsFromEnv } = await import(
        "@/lib/email/credentials-service"
      );
      await ensureWorkspaceMailboxCredentialsFromEnv(
        accounts.map((account) => account.id),
        { workspaceId: workspace.id },
      );
    }

    const withStatus = await Promise.all(
      accounts.map(async (account) => ({
        ...account,
        configured: await isAccountConfigured(account.id, { workspaceId: workspace.id }),
      })),
    );

    return NextResponse.json(withStatus);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load email accounts";
    return NextResponse.json({ error: message }, { status: authErrorStatus(message) });
  }
}
