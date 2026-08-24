"use client";

import type { ReactNode } from "react";

import {
  DemoFundraisingDashboardWorkspace,
  DemoFundraisingDataRoomsWorkspace,
  DemoFundraisingInvestorsWorkspace,
  DemoFundraisingMeetingsWorkspace,
  DemoFundraisingPipelineWorkspace,
  DemoFundraisingPitchDecksWorkspace,
} from "@/components/demo/DemoFundraisingWorkspaces";
import {
  FundraisingDashboardWorkspace,
  FundraisingDataRoomsWorkspace,
  FundraisingInvestorsWorkspace,
  FundraisingMeetingsWorkspace,
  FundraisingPipelineWorkspace,
  FundraisingPitchDecksWorkspace,
} from "@/components/onwardair/FundraisingWorkspaces";
import { resolveFundraisingSurfaceKind } from "@/lib/fundraising-workspace-surface";

import { useOperatorEntitlements } from "./OperatorEntitlementsProvider";
import { FundraisingCustomerEmptyWorkspace } from "./FundraisingCustomerEmptyWorkspace";

function Host({
  onwardair,
  demo,
  customerTitle,
  customerSubtitle,
}: {
  onwardair: ReactNode;
  demo: ReactNode;
  customerTitle: string;
  customerSubtitle: string;
}) {
  const { workspaceSlug, ready } = useOperatorEntitlements();
  if (!ready) {
    return (
      <FundraisingCustomerEmptyWorkspace
        title={customerTitle}
        subtitle="Loading workspace context…"
      />
    );
  }
  const surface = resolveFundraisingSurfaceKind(workspaceSlug);
  if (surface === "demo") return <>{demo}</>;
  if (surface === "onwardair" || surface === "workspace") return <>{onwardair}</>;
  return <FundraisingCustomerEmptyWorkspace title={customerTitle} subtitle={customerSubtitle} />;
}

export function FundraisingDashboardHost() {
  return (
    <Host
      demo={<DemoFundraisingDashboardWorkspace />}
      onwardair={<FundraisingDashboardWorkspace />}
      customerTitle="Fundraising dashboard"
      customerSubtitle="Track active raises, investor pipeline, and capital milestones for this workspace."
    />
  );
}

export function FundraisingInvestorsHost() {
  return (
    <Host
      demo={<DemoFundraisingInvestorsWorkspace />}
      onwardair={<FundraisingInvestorsWorkspace />}
      customerTitle="Investors"
      customerSubtitle="Manage investor relationships and engagement for this workspace."
    />
  );
}

export function FundraisingPipelineHost() {
  return (
    <Host
      demo={<DemoFundraisingPipelineWorkspace />}
      onwardair={<FundraisingPipelineWorkspace />}
      customerTitle="Pipeline"
      customerSubtitle="Monitor fundraising pipeline stages and commitments for this workspace."
    />
  );
}

export function FundraisingMeetingsHost() {
  return (
    <Host
      demo={<DemoFundraisingMeetingsWorkspace />}
      onwardair={<FundraisingMeetingsWorkspace />}
      customerTitle="Meetings"
      customerSubtitle="Schedule and track investor meetings for this workspace."
    />
  );
}

export function FundraisingPitchDecksHost() {
  return (
    <Host
      demo={<DemoFundraisingPitchDecksWorkspace />}
      onwardair={<FundraisingPitchDecksWorkspace />}
      customerTitle="Pitch decks"
      customerSubtitle="Maintain investor pitch materials for this workspace."
    />
  );
}

export function FundraisingDataRoomsHost() {
  return (
    <Host
      demo={<DemoFundraisingDataRoomsWorkspace />}
      onwardair={<FundraisingDataRoomsWorkspace />}
      customerTitle="Data rooms"
      customerSubtitle="Share diligence materials with investors from this workspace."
    />
  );
}
