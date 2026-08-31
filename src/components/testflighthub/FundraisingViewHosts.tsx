"use client";

import type { ReactNode } from "react";

import {
  DemoFundraisingCapTableWorkspace,
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

import CapTableWorkspace from "./CapTableWorkspace";
import FundraisingCustomerRecordsWorkspace from "./FundraisingCustomerRecordsWorkspace";
import { useOperatorEntitlements } from "./OperatorEntitlementsProvider";
import { FundraisingCustomerEmptyWorkspace } from "./FundraisingCustomerEmptyWorkspace";

function Host({
  onwardair,
  demo,
  customer,
  customerTitle,
  customerSubtitle,
}: {
  onwardair: ReactNode;
  demo: ReactNode;
  customer: ReactNode;
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
  if (surface === "onwardair") return <>{onwardair}</>;
  return <>{customer}</>;
}

export function FundraisingDashboardHost() {
  return (
    <Host
      demo={<DemoFundraisingDashboardWorkspace />}
      onwardair={<FundraisingDashboardWorkspace />}
      customer={
        <FundraisingCustomerRecordsWorkspace
          section="dashboard"
          title="Fundraising dashboard"
          subtitle="Track active raises, investor pipeline, and capital milestones for this workspace."
        />
      }
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
      customer={
        <FundraisingCustomerRecordsWorkspace
          section="investors"
          title="Investors"
          subtitle="Manage investor relationships and engagement for this workspace."
        />
      }
      customerTitle="Investors"
      customerSubtitle="Manage investor relationships and engagement for this workspace."
    />
  );
}

export function FundraisingCapTableHost() {
  return (
    <Host
      demo={<DemoFundraisingCapTableWorkspace />}
      onwardair={<CapTableWorkspace />}
      customer={<CapTableWorkspace />}
      customerTitle="Cap table"
      customerSubtitle="Manage equity ownership and share classes for this workspace."
    />
  );
}

export function FundraisingPipelineHost() {
  return (
    <Host
      demo={<DemoFundraisingPipelineWorkspace />}
      onwardair={<FundraisingPipelineWorkspace />}
      customer={
        <FundraisingCustomerRecordsWorkspace
          section="pipeline"
          title="Pipeline"
          subtitle="Monitor fundraising pipeline stages and commitments for this workspace."
        />
      }
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
      customer={
        <FundraisingCustomerRecordsWorkspace
          section="meetings"
          title="Meetings"
          subtitle="Schedule and track investor meetings for this workspace."
        />
      }
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
      customer={
        <FundraisingCustomerRecordsWorkspace
          section="pitch-decks"
          title="Pitch decks"
          subtitle="Maintain investor pitch materials for this workspace."
        />
      }
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
      customer={
        <FundraisingCustomerRecordsWorkspace
          section="data-rooms"
          title="Data rooms"
          subtitle="Share diligence materials with investors from this workspace."
        />
      }
      customerTitle="Data rooms"
      customerSubtitle="Share diligence materials with investors from this workspace."
    />
  );
}
