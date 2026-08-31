"use client";

import { useCallback, useEffect, useState } from "react";

import SaecDiscoveryApp from "@/components/saec-discovery/SaecDiscoveryApp";
import SaecDiscoveryLogin from "@/components/saec-discovery/SaecDiscoveryLogin";

type AuthState = "loading" | "guest" | "authed" | "open";

const REQUIRE_AUTH =
  process.env.NEXT_PUBLIC_SAEC_DISCOVERY_REQUIRE_AUTH !== "false" &&
  (process.env.NEXT_PUBLIC_SAEC_DISCOVERY_REQUIRE_AUTH === "true" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.VERCEL_ENV === "preview");

export default function SaecDiscoveryShell() {
  const [authState, setAuthState] = useState<AuthState>(REQUIRE_AUTH ? "loading" : "open");
  const [draftOwnerId, setDraftOwnerId] = useState<string | null>(null);

  const refreshAuth = useCallback(async () => {
    if (!REQUIRE_AUTH) {
      setDraftOwnerId(null);
      setAuthState("open");
      return;
    }
    try {
      const response = await fetch("/api/saec-discovery/access", { cache: "no-store" });
      if (!response.ok) {
        setDraftOwnerId(null);
        setAuthState("guest");
        return;
      }
      const payload = (await response.json()) as {
        allowed?: boolean;
        userId?: string | null;
      };
      if (!payload.allowed) {
        setDraftOwnerId(null);
        setAuthState("guest");
        return;
      }
      const userId = payload.userId?.trim() || null;
      setDraftOwnerId(userId);
      setAuthState("authed");
    } catch {
      setDraftOwnerId(null);
      setAuthState("guest");
    }
  }, []);

  useEffect(() => {
    void refreshAuth();
  }, [refreshAuth]);

  if (authState === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020617]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-sky-400" />
      </div>
    );
  }

  if (authState === "guest") {
    return <SaecDiscoveryLogin onAuthenticated={() => void refreshAuth()} />;
  }

  return <SaecDiscoveryApp draftOwnerId={draftOwnerId} />;
}
