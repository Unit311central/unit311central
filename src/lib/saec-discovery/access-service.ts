import "server-only";

import { getPlatformSession } from "@/lib/platform-session";
import { SAEC_SLUG } from "@/lib/saec-surface";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { authorizeUserForWorkspace } from "@/lib/workspace-authorization";
import { findWorkspaceBySlug } from "@/lib/workspace-host";

export type SaecDiscoveryAccess = {
  allowed: boolean;
  userId: string | null;
};

export function isSaecDiscoveryAuthRequired(): boolean {
  const flag = process.env.NEXT_PUBLIC_SAEC_DISCOVERY_REQUIRE_AUTH;
  if (flag === "false") return false;
  if (flag === "true") return true;
  return process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview";
}

export async function getSaecDiscoveryAccess(): Promise<SaecDiscoveryAccess> {
  if (!isSaecDiscoveryAuthRequired()) {
    return { allowed: true, userId: null };
  }

  const session = await getPlatformSession();
  if (!session?.sub?.trim()) {
    return { allowed: false, userId: null };
  }

  if (!isSupabaseConfigured()) {
    return { allowed: false, userId: null };
  }

  const workspace = await findWorkspaceBySlug(SAEC_SLUG);
  if (!workspace?.id) {
    return { allowed: false, userId: null };
  }

  const decision = await authorizeUserForWorkspace(session.sub, workspace.id, {
    workspace,
    userTypeHint: session.userType,
  });

  if (!decision.allowed) {
    return { allowed: false, userId: null };
  }

  return { allowed: true, userId: session.sub };
}
