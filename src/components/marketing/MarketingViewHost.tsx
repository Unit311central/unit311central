"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import {
  AbhiCalendarEventsWorkspace,
  AbhiComplianceTrainingWorkspace,
  AbhiEventManagementWorkspace,
  AbhiEventsWorkspace,
  AbhiMailingListWorkspace,
  AbhiNewsletterWorkspace,
  AbhiProgrammesWorkspace,
  SocialWorkspace,
  StaffTrainingWorkspace,
} from "@/components/testflighthub/lazy-workspaces";
import WorkspaceErrorBoundary from "@/components/testflighthub/WorkspaceErrorBoundary";
import WorkspaceLoadingFallback from "@/components/testflighthub/WorkspaceLoadingFallback";
import OnwardAirMarketingEventsWorkspace, {
  type OnwardAirMarketingPage,
} from "@/components/onwardair/OnwardAirMarketingEventsWorkspace";
import type { InternalOperationsView } from "@/lib/internal-operations-data";
import { isMarketingModuleView } from "@/lib/marketing/views";
import { resolveMarketingView } from "@/lib/marketing/view-resolver";
import {
  resolveBrowserMarketingWorkspaceKey,
  resolveMarketingWorkspaceKey,
} from "@/lib/marketing/workspace-context";
import { MARKETING_RENDERER_IDS } from "@/lib/marketing/workspace-packs/types";

import { useOperatorEntitlements } from "@/components/testflighthub/OperatorEntitlementsProvider";

import { MarketingWorkspaceUnavailable } from "./MarketingWorkspaceUnavailable";
import {
  CentralExternalEventsWorkspace,
  CentralManagedEventsWorkspace,
  CentralMarketingDashboardWorkspace,
  CentralMediaLibraryWorkspace,
  CentralMailingWorkspace,
  CentralNewsletterWorkspace,
  CentralStoriesWorkspace,
} from "./workspaces/CentralMarketingWorkspaces";
import {
  GreenDesertClientStoriesWorkspace,
  GreenDesertDigitalNewsletterWorkspace,
  GreenDesertEventManagementWorkspace,
  GreenDesertExternalEventsWorkspace,
  GreenDesertMailingListWorkspace,
  GreenDesertMarketingDashboardWorkspace,
} from "@/components/greendesert/marketing/GreenDesertMarketingWorkspaces";

const PortfolioStoriesWorkspace = dynamic(
  () => import("@/components/testflighthub/talanton/PortfolioStoriesWorkspace"),
  {
    loading: () => <WorkspaceLoadingFallback label="Loading portfolio stories" />,
    ssr: false,
  },
);

const JourneyStoriesWorkspace = dynamic(
  () => import("@/components/testflighthub/talanton/JourneyStoriesWorkspace"),
  {
    loading: () => <WorkspaceLoadingFallback label="Loading journey stories" />,
    ssr: false,
  },
);

const StoriesNewsletterWorkspace = dynamic(
  () => import("@/components/testflighthub/talanton/StoriesNewsletterWorkspace"),
  {
    loading: () => <WorkspaceLoadingFallback label="Loading digital newsletter" />,
    ssr: false,
  },
);

const MediaLibraryWorkspace = dynamic(
  () => import("@/components/testflighthub/talanton/MediaLibraryWorkspace"),
  {
    loading: () => <WorkspaceLoadingFallback label="Loading media library" />,
    ssr: false,
  },
);

const StoriesMailingListWorkspace = dynamic(
  () => import("@/components/testflighthub/talanton/StoriesMailingListWorkspace"),
  {
    loading: () => <WorkspaceLoadingFallback label="Loading mailing list management" />,
    ssr: false,
  },
);

type AbhiProgrammesMode = "working-groups" | "us-accelerator" | "me-accelerator";

function readOaPage(props?: Record<string, unknown>): OnwardAirMarketingPage {
  const page = props?.page;
  if (
    page === "dashboard" ||
    page === "newsletter" ||
    page === "events" ||
    page === "event-management" ||
    page === "mailing-list"
  ) {
    return page;
  }
  return "dashboard";
}

function readAbhiProgrammesMode(props?: Record<string, unknown>): AbhiProgrammesMode {
  const mode = props?.mode;
  if (mode === "us-accelerator" || mode === "me-accelerator" || mode === "working-groups") {
    return mode;
  }
  return "working-groups";
}

function readStoryKind(props?: Record<string, unknown>): "portfolio" | "journey" | "generic" | undefined {
  const kind = props?.storyKind;
  if (kind === "portfolio" || kind === "journey" || kind === "generic") return kind;
  return undefined;
}

function MarketingRenderer({
  view,
  rendererId,
  props,
  unavailableTitle,
  unavailableMessage,
}: {
  view: InternalOperationsView;
  rendererId: string;
  props?: Record<string, unknown>;
  unavailableTitle?: string;
  unavailableMessage?: string;
}) {
  switch (rendererId) {
    case MARKETING_RENDERER_IDS.CENTRAL_DASHBOARD:
      return <CentralMarketingDashboardWorkspace />;

    case MARKETING_RENDERER_IDS.CENTRAL_NEWSLETTER:
      return <CentralNewsletterWorkspace />;

    case MARKETING_RENDERER_IDS.CENTRAL_MAILING:
      return <CentralMailingWorkspace />;

    case MARKETING_RENDERER_IDS.CENTRAL_EXTERNAL_EVENTS:
      return <CentralExternalEventsWorkspace />;

    case MARKETING_RENDERER_IDS.CENTRAL_MANAGED_EVENTS:
      return <CentralManagedEventsWorkspace />;

    case MARKETING_RENDERER_IDS.CENTRAL_MEDIA_LIBRARY:
      return <CentralMediaLibraryWorkspace />;

    case MARKETING_RENDERER_IDS.CENTRAL_STORIES:
      return <CentralStoriesWorkspace storyKind={readStoryKind(props)} />;

    case MARKETING_RENDERER_IDS.SOCIAL:
      return <SocialWorkspace />;

    case MARKETING_RENDERER_IDS.OA_MARKETING:
      return <OnwardAirMarketingEventsWorkspace page={readOaPage(props)} />;

    case MARKETING_RENDERER_IDS.ABHI_NEWSLETTER:
      return <AbhiNewsletterWorkspace />;

    case MARKETING_RENDERER_IDS.ABHI_EVENTS:
      return <AbhiEventsWorkspace />;

    case MARKETING_RENDERER_IDS.ABHI_CALENDAR_EVENTS:
      return <AbhiCalendarEventsWorkspace />;

    case MARKETING_RENDERER_IDS.ABHI_EVENT_MANAGEMENT:
      return <AbhiEventManagementWorkspace />;

    case MARKETING_RENDERER_IDS.ABHI_MAILING_LIST:
      return <AbhiMailingListWorkspace />;

    case MARKETING_RENDERER_IDS.ABHI_PROGRAMMES:
      return <AbhiProgrammesWorkspace mode={readAbhiProgrammesMode(props)} />;

    case MARKETING_RENDERER_IDS.ABHI_COMPLIANCE_TRAINING:
      return <AbhiComplianceTrainingWorkspace mode="courses" />;

    case MARKETING_RENDERER_IDS.STAFF_TRAINING:
      return <StaffTrainingWorkspace />;

    case MARKETING_RENDERER_IDS.TALANTON_PORTFOLIO_STORIES:
      return (
        <WorkspaceErrorBoundary title="Portfolio Stories">
          <PortfolioStoriesWorkspace />
        </WorkspaceErrorBoundary>
      );

    case MARKETING_RENDERER_IDS.TALANTON_JOURNEY_STORIES:
      return (
        <WorkspaceErrorBoundary title="Journey Stories">
          <JourneyStoriesWorkspace />
        </WorkspaceErrorBoundary>
      );

    case MARKETING_RENDERER_IDS.TALANTON_STORIES_NEWSLETTER:
      return (
        <WorkspaceErrorBoundary title="Digital Newsletter">
          <StoriesNewsletterWorkspace />
        </WorkspaceErrorBoundary>
      );

    case MARKETING_RENDERER_IDS.TALANTON_MEDIA_LIBRARY:
      return (
        <WorkspaceErrorBoundary title="Media Library">
          <MediaLibraryWorkspace />
        </WorkspaceErrorBoundary>
      );

    case MARKETING_RENDERER_IDS.TALANTON_STORIES_MAILING_LIST:
      return (
        <WorkspaceErrorBoundary title="Mailing List Management">
          <StoriesMailingListWorkspace />
        </WorkspaceErrorBoundary>
      );

    case MARKETING_RENDERER_IDS.GREENDESERT_MARKETING_DASHBOARD:
      return <GreenDesertMarketingDashboardWorkspace />;

    case MARKETING_RENDERER_IDS.GREENDESERT_EXTERNAL_EVENTS:
      return <GreenDesertExternalEventsWorkspace />;

    case MARKETING_RENDERER_IDS.GREENDESERT_EVENT_MANAGEMENT:
      return <GreenDesertEventManagementWorkspace />;

    case MARKETING_RENDERER_IDS.GREENDESERT_NEWSLETTER:
      return (
        <WorkspaceErrorBoundary title="Digital Newsletter">
          <GreenDesertDigitalNewsletterWorkspace />
        </WorkspaceErrorBoundary>
      );

    case MARKETING_RENDERER_IDS.GREENDESERT_MAILING_LIST:
      return (
        <WorkspaceErrorBoundary title="Mailing List Management">
          <GreenDesertMailingListWorkspace />
        </WorkspaceErrorBoundary>
      );

    case MARKETING_RENDERER_IDS.GREENDESERT_CLIENT_STORIES:
      return (
        <WorkspaceErrorBoundary title="Client Stories">
          <GreenDesertClientStoriesWorkspace />
        </WorkspaceErrorBoundary>
      );

    case MARKETING_RENDERER_IDS.UNAVAILABLE:
      return (
        <MarketingWorkspaceUnavailable
          title={unavailableTitle}
          message={unavailableMessage ?? `“${view}” is not available on this workspace.`}
        />
      );

    default:
      return (
        <MarketingWorkspaceUnavailable
          message={`No renderer is registered for marketing view “${view}”.`}
        />
      );
  }
}

export function MarketingViewHost({ view }: { view: InternalOperationsView }) {
  const { workspaceSlug } = useOperatorEntitlements();
  const resolution = useMemo(() => {
    if (!isMarketingModuleView(view)) return null;
    const workspaceKey = resolveMarketingWorkspaceKey(workspaceSlug);
    return resolveMarketingView({
      view,
      workspaceKey,
      workspaceSlug,
    });
  }, [view, workspaceSlug]);

  if (!resolution) return null;

  return (
    <MarketingRenderer
      view={view}
      rendererId={resolution.rendererId}
      props={resolution.props}
      unavailableTitle={resolution.unavailableTitle}
      unavailableMessage={resolution.unavailableMessage}
    />
  );
}

export type { MarketingViewHostProps } from "./MarketingWorkspaceUnavailable";
