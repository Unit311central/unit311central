"use client";

import { useEffect, useState } from "react";

import {
  WorkspaceError,
  WorkspaceLoading,
} from "@/components/testflighthub/workspace-chrome";
import { getDemoEnterpriseFixtures, isBrowserDemoSurface } from "@/lib/demo-enterprise";
import { DEMO_PROSPECT_USERNAME } from "@/lib/demo/read-only";
import { createInitialUsers } from "@/lib/user-management-data";
import {
  fetchCachedJson,
  invalidateCachedJson,
  PLATFORM_CACHE_KEYS,
} from "@/lib/platform-fetch-cache";

type ProfilePayload = {
  displayName: string;
  username: string;
  email: string | null;
  role: string | null;
  userType: string;
  userId: string;
  workspaceId: string | null;
  workspaceSlug: string | null;
  workspaceName: string | null;
};

function buildDemoProfileFallback(): ProfilePayload {
  const fixtures = getDemoEnterpriseFixtures();
  const platformAdmin = createInitialUsers().find(
    (row) => row.username.toLowerCase() === "admin@unit311central.com",
  );
  const demoOwner = createInitialUsers().find(
    (row) => row.username.toLowerCase() === DEMO_PROSPECT_USERNAME.toLowerCase(),
  );
  const account = platformAdmin ?? demoOwner;

  return {
    displayName: account?.fullName ?? fixtures.company.tradingName,
    username: account?.username ?? DEMO_PROSPECT_USERNAME,
    email: account?.email ?? DEMO_PROSPECT_USERNAME,
    role: account?.role ?? "Admin",
    userType: "internal",
    userId: account?.id ?? "nst-demo-operator",
    workspaceId: "demo-workspace",
    workspaceSlug: "demo",
    workspaceName: fixtures.company.tradingName,
  };
}

export default function ProfileWorkspace() {
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(force = false) {
    setLoading(true);
    setError(null);
    if (force) invalidateCachedJson(PLATFORM_CACHE_KEYS.whoami);
    try {
      const body = await fetchCachedJson<ProfilePayload & { error?: string }>(
        PLATFORM_CACHE_KEYS.whoami,
        "/api/auth/whoami",
        { ttlMs: 120_000, force, credentials: "include" },
      );
      setProfile({
        displayName: body.displayName?.trim() || "Operator",
        username: body.username?.trim() || "",
        email: body.email ?? null,
        role: body.role ?? null,
        userType: body.userType ?? "internal",
        userId: body.userId ?? "",
        workspaceId: body.workspaceId ?? null,
        workspaceSlug: body.workspaceSlug ?? null,
        workspaceName: body.workspaceName ?? null,
      });
    } catch (err) {
      if (isBrowserDemoSurface()) {
        setProfile(buildDemoProfileFallback());
        setError(null);
      } else {
        setProfile(null);
        setError(err instanceof Error ? err.message : "Failed to load profile.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  return (
    <div className="space-y-6">
      {loading ? <WorkspaceLoading label="Loading profile…" /> : null}
      {!loading && error ? (
        <WorkspaceError message={error} onRetry={() => void loadProfile(true)} />
      ) : null}
      {!loading && !error && profile ? (
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
              Name
            </p>
            <p className="mt-2 text-white">{profile.displayName}</p>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
              Email
            </p>
            <p className="mt-2 text-white">
              {profile.email || profile.username || "—"}
            </p>
            {profile.username && profile.email && profile.username !== profile.email ? (
              <>
                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
                  Username
                </p>
                <p className="mt-2 text-white">{profile.username}</p>
              </>
            ) : null}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
              Role
            </p>
            <p className="mt-2 text-white">
              {profile.role ||
                (profile.userType === "internal"
                  ? "Internal operator"
                  : "External user")}
            </p>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
              Workspace
            </p>
            <p className="mt-2 text-white">
              {profile.workspaceName ||
                profile.workspaceSlug ||
                "No active workspace"}
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
