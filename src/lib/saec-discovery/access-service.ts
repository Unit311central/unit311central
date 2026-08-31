import "server-only";

import { getPlatformSession } from "@/lib/platform-session";
import { SAEC_SLUG } from "@/lib/saec-surface";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { authorizeUserForWorkspace } from "@/lib/workspace-authorization";
import { findWorkspaceBySlug } from "@/lib/workspace-host";

export type SaecDiscoveryAccess = {
  allowed: boolean;
  authRequired: boolean;
  userId: string | null;
};

export function isSaecDiscoveryAuthRequired(): boolean {
  const flag = process.env.NEXT_PUBLIC_SAEC_DISCOVERY_REQUIRE_AUTH;
  if (flag === "false") return false;
  if (flag === "true") return true;
  return process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview";
}

export async function getSaecDiscoveryAccess(): Promise<SaecDiscoveryAccess> {
  const authRequired = isSaecDiscoveryAuthRequired();
  if (!authRequired) {
    return { allowed: true, authRequired: false, userId: null };
  }

  const session = await getPlatformSession();
  if (!session?.sub?.trim()) {
    return { allowed: false, authRequired: true, userId: null };
  }

  if (!isSupabaseConfigured()) {
    return { allowed: false, authRequired: true, userId: null };
  }

  const workspace = await findWorkspaceBySlug(SAEC_SLUG);
  if (!workspace?.id) {
    return { allowed: false, authRequired: true, userId: null };
  }

  const decision = await authorizeUserForWorkspace(session.sub, workspace.id, {
    workspace,
    userTypeHint: session.userType,
  });

  if (!decision.allowed) {
    return { allowed: false, authRequired: true, userId: null };
  }

  return { allowed: true, authRequired: true, userId: session.sub };
}
