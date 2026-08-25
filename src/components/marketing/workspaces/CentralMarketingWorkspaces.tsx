"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { MarketingDashboardShell } from "@/components/marketing/workspaces/MarketingDashboardShell";
import { demoClientPortalPublicPath } from "@/lib/demo/demo-client-portal-routes";
import {
  CentralEntityList,
  CentralMarketingShell,
  workspacePrimaryButtonClass,
  workspaceSecondaryButtonClass,
} from "@/components/marketing/workspaces/CentralMarketingShell";
import { WorkspaceSection, WorkspaceKpiTile, WorkspaceModuleHeader } from "@/components/workspace-ui";
import { useMarketingData } from "@/lib/marketing/client/use-marketing-data";
import { resolveMarketingShellChrome } from "@/lib/marketing/marketing-shell-chrome";
import { resolveBrowserMarketingWorkspaceKey } from "@/lib/marketing/workspace-context";
import type {
  Campaign,
  ExternalEvent,
  ManagedEvent,
  MarketingDashboardKpis,
  MediaAsset,
  Newsletter,
} from "@/lib/marketing/types";
import type { MarketingStoryRecord } from "@/lib/marketing/mappers";

const MARKETING_TILE_STORAGE_KEY = "unit311-demo-marketing-dashboard-tiles-v1";

type MarketingDashboardTile = {
  id: string;
  label: string;
  value: string;
  hint: string;
};

function buildDefaultMarketingTiles(kpis: MarketingDashboardKpis): MarketingDashboardTile[] {
  return [
    {
      id: "open-rate",
      label: "Newsletter open rate",
      value: kpis.newsletterOpenRate != null ? `${kpis.newsletterOpenRate.toFixed(1)}%` : "—",
      hint: `${kpis.sentNewsletterCount} sent campaigns`,
    },
    {
      id: "subscribers",
      label: "Mailing subscribers",
      value: kpis.mailingSubscribers.toLocaleString(),
      hint: `+${kpis.mailingGrowth30d} last 30 days`,
    },
    {
      id: "external",
      label: "External events",
      value: String(kpis.externalEventsConfirmed),
      hint: `${kpis.externalEventsTotal} on the calendar`,
    },
    {
      id: "hosted",
      label: "Hosted event fill",
      value: `${kpis.managedEventRegistered}/${kpis.managedEventCapacity}`,
      hint: `${kpis.managedEventCount} programmes`,
    },
  ];
}

function EntityActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <button type="button" className={workspaceSecondaryButtonClass()} onClick={onEdit}>
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </button>
      <button type="button" className={workspaceSecondaryButtonClass()} onClick={onDelete}>
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </button>
    </div>
  );
}

const EMPTY_KPIS: MarketingDashboardKpis = {
  newsletterOpenRate: null,
  sentNewsletterCount: 0,
  mailingSubscribers: 0,
  mailingGrowth30d: 0,
  externalEventsConfirmed: 0,
  externalEventsTotal: 0,
  managedEventRegistered: 0,
  managedEventCapacity: 0,
  managedEventCount: 0,
};

function LoadingState({ label }: { label: string }) {
  return <p className="text-sm text-white/45">Loading {label}…</p>;
}

function ErrorState({ message }: { message: string }) {
  return <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-2 text-sm text-rose-100">{message}</p>;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] uppercase tracking-wide text-white/60">
      {status}
    </span>
  );
}

export function CentralMarketingDashboardWorkspace() {
  const { bundle, loading, error } = useMarketingData();
  const workspace = resolveBrowserMarketingWorkspaceKey();
  const chrome = resolveMarketingShellChrome(workspace);
  const isDemo = workspace === "demo";
  const kpis = bundle?.kpis ?? EMPTY_KPIS;
  const [editingTiles, setEditingTiles] = useState(false);
  const [tiles, setTiles] = useState<MarketingDashboardTile[]>(() => buildDefaultMarketingTiles(EMPTY_KPIS));

  useEffect(() => {
    if (!isDemo) return;
    try {
      const raw = localStorage.getItem(MARKETING_TILE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MarketingDashboardTile[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTiles(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    setTiles(buildDefaultMarketingTiles(kpis));
  }, [isDemo, kpis.mailingSubscribers, kpis.newsletterOpenRate, kpis.externalEventsConfirmed, kpis.managedEventRegistered, kpis.managedEventCapacity, kpis.managedEventCount, kpis.sentNewsletterCount, kpis.mailingGrowth30d, kpis.externalEventsTotal]);

  const saveTiles = useCallback((next: MarketingDashboardTile[]) => {
    setTiles(next);
    try {
      localStorage.setItem(MARKETING_TILE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const recentNewsletterTitle =
    bundle?.newsletters.find((row) => row.status === "sent")?.title ?? null;
  const draftNewsletters = bundle?.newsletters.filter((row) => row.status === "draft").length ?? 0;
  const scheduledCampaigns = bundle?.campaigns.filter((row) => row.status === "scheduled").length ?? 0;
  const clientStoriesPending =
    bundle?.portfolioStories.filter((row) =>
      ["Under Review", "Submitted", "draft"].includes(String(row.status ?? "")),
    ).length ?? 0;

  return (
    <div className="space-y-4">
      {error ? <ErrorState message={error} /> : null}
      {loading && !bundle ? (
        <LoadingState label="marketing dashboard" />
      ) : isDemo ? (
        <>
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <WorkspaceModuleHeader
                moduleLabel={chrome.moduleLabel ?? "Marketing and Events"}
                brandLabel={chrome.brandLabel}
                title="Marketing and Events"
                description="Newsletter performance, upcoming events, client stories, and mailing list growth in one place."
              />
              <button
                type="button"
                onClick={() => setEditingTiles((value) => !value)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white/70 hover:border-white/20"
              >
                <Pencil className="h-3.5 w-3.5" />
                {editingTiles ? "Done editing" : "Edit tiles"}
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {tiles.map((tile, index) =>
                editingTiles ? (
                  <div key={tile.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <input
                      className="w-full rounded-lg border border-white/10 bg-[#060d18] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70"
                      value={tile.label}
                      onChange={(e) => {
                        const next = [...tiles];
                        next[index] = { ...tile, label: e.target.value };
                        saveTiles(next);
                      }}
                    />
                    <input
                      className="mt-2 w-full rounded-lg border border-white/10 bg-[#060d18] px-2 py-1 text-xl font-semibold text-white"
                      value={tile.value}
                      onChange={(e) => {
                        const next = [...tiles];
                        next[index] = { ...tile, value: e.target.value };
                        saveTiles(next);
                      }}
                    />
                    <input
                      className="mt-2 w-full rounded-lg border border-white/10 bg-[#060d18] px-2 py-1 text-xs text-white/50"
                      value={tile.hint}
                      onChange={(e) => {
                        const next = [...tiles];
                        next[index] = { ...tile, hint: e.target.value };
                        saveTiles(next);
                      }}
                    />
                  </div>
                ) : (
                  <WorkspaceKpiTile key={tile.id} label={tile.label} value={tile.value} hint={tile.hint} />
                ),
              )}
            </div>
          </div>
          <WorkspaceSection
            title="Recommended on this dashboard"
            subtitle="Quick links to the workflows teams use most on the Demo workspace."
          >
            <ul className="grid gap-2 text-sm text-white/70 sm:grid-cols-2">
              <li>Newsletter drafts ready: {draftNewsletters}</li>
              <li>Scheduled campaigns: {scheduledCampaigns}</li>
              <li>Client stories pending review: {clientStoriesPending}</li>
              <li>
                Client portal submissions feed Client Stories —{" "}
                <a href={demoClientPortalPublicPath()} className="text-sky-300 hover:underline">
                  demo.unit311central.com{demoClientPortalPublicPath()}
                </a>
              </li>
            </ul>
          </WorkspaceSection>
        </>
      ) : (
        <>
          <MarketingDashboardShell
            brandLabel={chrome.brandLabel}
            moduleLabel={chrome.moduleLabel ?? "Marketing & Events"}
            title="Marketing dashboard"
            description="Central Marketing & Events workspace — newsletters, campaigns, events, and media in one place."
            kpis={kpis}
            recentNewsletterTitle={recentNewsletterTitle}
            upcomingExternalEvents={bundle?.externalEvents ?? []}
            liveManagedEvents={(bundle?.managedEvents ?? []).filter((row) =>
              ["active", "Live", "Booking", "Planning", "Registration open"].includes(
                String(row.status ?? row.stage ?? ""),
              ),
            )}
          />
        </>
      )}
    </div>
  );
}

export function CentralNewsletterWorkspace() {
  const { bundle, loading, error, save, remove } = useMarketingData();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSubject, setEditSubject] = useState("");

  const newsletters = bundle?.newsletters ?? [];

  async function createDraft() {
    if (!title.trim()) return;
    await save("newsletters", {
      title: title.trim(),
      subject: subject.trim() || title.trim(),
      htmlBody: "<p>Draft newsletter content</p>",
      status: "draft",
      recipientMode: "all",
      recipientIds: [],
      manualEmails: [],
    });
    setTitle("");
    setSubject("");
  }

  async function saveEdit(row: Newsletter) {
    if (!editTitle.trim()) return;
    await save("newsletters", {
      id: row.id,
      title: editTitle.trim(),
      subject: editSubject.trim() || editTitle.trim(),
      htmlBody: row.htmlBody,
      status: row.status,
      recipientMode: row.recipientMode,
      recipientIds: row.recipientIds,
      manualEmails: row.manualEmails,
    });
    setEditingId(null);
  }

  return (
    <CentralMarketingShell
      title="Digital newsletter"
      description="Create, schedule, and track newsletter issues for this workspace."
      actions={
        <button type="button" className={workspacePrimaryButtonClass()} onClick={() => void createDraft()}>
          <Plus className="h-4 w-4" />
          New draft
        </button>
      }
    >
      {error ? <ErrorState message={error} /> : null}
      <WorkspaceSection title="Quick compose">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35"
            placeholder="Newsletter title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/35"
            placeholder="Email subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
      </WorkspaceSection>
      <CentralEntityList title="Issues" emptyMessage="No newsletters yet — create a draft to get started.">
        {loading && !bundle ? (
          <LoadingState label="newsletters" />
        ) : newsletters.length === 0 ? (
          <p className="text-sm text-white/45">No newsletters yet — create a draft to get started.</p>
        ) : (
          <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
            {newsletters.map((row: Newsletter) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                {editingId === row.id ? (
                  <div className="grid flex-1 gap-2 sm:grid-cols-2">
                    <input
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                    <input
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                    />
                    <div className="flex gap-2 sm:col-span-2">
                      <button type="button" className={workspacePrimaryButtonClass()} onClick={() => void saveEdit(row)}>
                        Save
                      </button>
                      <button type="button" className={workspaceSecondaryButtonClass()} onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="font-medium text-white/90">{row.title}</p>
                      <p className="text-white/50">{row.subject}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={row.status} />
                      <EntityActions
                        onEdit={() => {
                          setEditingId(row.id);
                          setEditTitle(row.title);
                          setEditSubject(row.subject);
                        }}
                        onDelete={() => void remove("newsletters", row.id)}
                      />
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </CentralEntityList>
    </CentralMarketingShell>
  );
}

export function CentralMailingWorkspace() {
  const { bundle, loading, error, save, remove } = useMarketingData();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const contacts = bundle?.contacts ?? [];
  const campaigns = bundle?.campaigns ?? [];

  async function addContact() {
    if (!email.trim()) return;
    await save("contacts", {
      name: name.trim() || email.trim(),
      email: email.trim(),
      status: "active",
    });
    setEmail("");
    setName("");
  }

  return (
    <CentralMarketingShell
      title="Mailing lists & campaigns"
      description="Manage subscribers and one-shot email campaigns."
      actions={
        <button type="button" className={workspaceSecondaryButtonClass()} onClick={() => void addContact()}>
          Add contact
        </button>
      }
    >
      {error ? <ErrorState message={error} /> : null}
      <WorkspaceSection title="Add subscriber">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </WorkspaceSection>
      <CentralEntityList title="Subscribers" emptyMessage="No mailing contacts yet.">
        {loading && !bundle ? (
          <LoadingState label="contacts" />
        ) : contacts.length === 0 ? (
          <p className="text-sm text-white/45">No mailing contacts yet.</p>
        ) : (
          <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
            {contacts.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-white/90">{row.name}</p>
                  <p className="text-white/50">{row.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={row.status ?? "active"} />
                  <EntityActions
                    onEdit={() => void save("contacts", { id: row.id, name: `${row.name} (updated)`, email: row.email, status: row.status ?? "active" })}
                    onDelete={() => void remove("contacts", row.id)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CentralEntityList>
      <CentralEntityList title="Campaigns" emptyMessage="No campaigns yet.">
        {campaigns.length === 0 ? (
          <p className="text-sm text-white/45">No campaigns yet.</p>
        ) : (
          <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
            {campaigns.map((row: Campaign) => (
              <li key={row.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <p className="font-medium text-white/90">{row.subject}</p>
                <StatusBadge status={row.status} />
              </li>
            ))}
          </ul>
        )}
      </CentralEntityList>
    </CentralMarketingShell>
  );
}

export function CentralExternalEventsWorkspace() {
  const { bundle, loading, error, save, remove } = useMarketingData();
  const [name, setName] = useState("");
  const events = bundle?.externalEvents ?? [];

  async function addEvent() {
    if (!name.trim()) return;
    const today = new Date().toISOString().slice(0, 10);
    await save("external-events", {
      name: name.trim(),
      startDate: today,
      endDate: today,
      city: "",
      country: "",
      status: "Planning",
    });
    setName("");
  }

  return (
    <CentralMarketingShell
      title="External events"
      description="Trade shows, conferences, and partner events your organisation attends."
      actions={
        <button type="button" className={workspacePrimaryButtonClass()} onClick={() => void addEvent()}>
          <Plus className="h-4 w-4" />
          Add event
        </button>
      }
    >
      {error ? <ErrorState message={error} /> : null}
      <WorkspaceSection title="New event">
        <input
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          placeholder="Event name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </WorkspaceSection>
      <CentralEntityList title="Calendar" emptyMessage="No external events yet.">
        {loading && !bundle ? (
          <LoadingState label="external events" />
        ) : events.length === 0 ? (
          <p className="text-sm text-white/45">No external events yet.</p>
        ) : (
          <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
            {events.map((row: ExternalEvent) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-white/90">{row.name}</p>
                  <p className="text-white/50">
                    {row.startDate} — {row.city}, {row.country}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={row.status} />
                  <EntityActions
                    onEdit={() => void save("external-events", { ...row, name: `${row.name} (updated)` })}
                    onDelete={() => void remove("external-events", row.id)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CentralEntityList>
    </CentralMarketingShell>
  );
}

export function CentralManagedEventsWorkspace() {
  const { bundle, loading, error, save, remove } = useMarketingData();
  const [name, setName] = useState("");
  const events = bundle?.managedEvents ?? [];

  async function addEvent() {
    if (!name.trim()) return;
    await save("managed-events", {
      name: name.trim(),
      venue: "TBC",
      date: new Date().toISOString().slice(0, 10),
      capacity: 100,
      registered: 0,
      stage: "Concept",
      status: "Planning",
    });
    setName("");
  }

  return (
    <CentralMarketingShell
      title="Managed events"
      description="Owned programmes — webinars, member days, and hosted conferences."
      actions={
        <button type="button" className={workspacePrimaryButtonClass()} onClick={() => void addEvent()}>
          <Plus className="h-4 w-4" />
          New programme
        </button>
      }
    >
      {error ? <ErrorState message={error} /> : null}
      <WorkspaceSection title="New programme">
        <input
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          placeholder="Programme name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </WorkspaceSection>
      <CentralEntityList title="Programmes" emptyMessage="No managed events yet.">
        {loading && !bundle ? (
          <LoadingState label="managed events" />
        ) : events.length === 0 ? (
          <p className="text-sm text-white/45">No managed events yet.</p>
        ) : (
          <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
            {events.map((row: ManagedEvent) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-white/90">{row.name}</p>
                  <p className="text-white/50">
                    {row.date} — {row.registered}/{row.capacity} registered
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={row.status ?? row.stage} />
                  <EntityActions
                    onEdit={() => void save("managed-events", { ...row, name: `${row.name} (updated)` })}
                    onDelete={() => void remove("managed-events", row.id)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CentralEntityList>
    </CentralMarketingShell>
  );
}

export function CentralMediaLibraryWorkspace() {
  const { bundle, loading, error, save, remove } = useMarketingData();
  const [name, setName] = useState("");
  const media = bundle?.media ?? [];

  async function addAsset() {
    if (!name.trim()) return;
    await save("media", {
      name: name.trim(),
      mediaType: "image",
      caption: "",
    });
    setName("");
  }

  return (
    <CentralMarketingShell
      title="Media library"
      description="Shared images and assets for newsletters, stories, and campaigns."
      actions={
        <button type="button" className={workspacePrimaryButtonClass()} onClick={() => void addAsset()}>
          <Plus className="h-4 w-4" />
          Add asset
        </button>
      }
    >
      {error ? <ErrorState message={error} /> : null}
      <WorkspaceSection title="Register asset">
        <input
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          placeholder="Asset name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </WorkspaceSection>
      <CentralEntityList title="Assets" emptyMessage="No media assets yet.">
        {loading && !bundle ? (
          <LoadingState label="media library" />
        ) : media.length === 0 ? (
          <p className="text-sm text-white/45">No media assets yet.</p>
        ) : (
          <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
            {media.map((row: MediaAsset) => (
              <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-white/90">{row.name}</p>
                  <p className="text-white/50">{row.mediaType}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={row.sourceLabel ?? "central"} />
                  <button
                    type="button"
                    className={workspaceSecondaryButtonClass()}
                    onClick={() => void remove("media", row.id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CentralEntityList>
    </CentralMarketingShell>
  );
}

export function CentralStoriesWorkspace({ storyKind }: { storyKind?: "portfolio" | "journey" | "generic" }) {
  const { bundle, loading, error, save, remove } = useMarketingData();
  const [title, setTitle] = useState("");

  const stories = useMemo(() => {
    const portfolio = bundle?.portfolioStories ?? [];
    const journey = bundle?.journeyStories ?? [];
    if (storyKind === "portfolio") return portfolio;
    if (storyKind === "journey") return journey;
    return [...portfolio, ...journey];
  }, [bundle, storyKind]);

  const label =
    storyKind === "portfolio"
      ? "Portfolio stories"
      : storyKind === "journey"
        ? "Journey stories"
        : "Stories & content";

  async function addStory() {
    if (!title.trim()) return;
    await save("stories", {
      title: title.trim(),
      storyKind: storyKind ?? "generic",
      summary: "",
      body: "",
      status: "draft",
    });
    setTitle("");
  }

  return (
    <CentralMarketingShell
      title={label}
      description="Generic story and content records — specialist workspaces extend this with portfolio or journey workflows."
      actions={
        <button type="button" className={workspacePrimaryButtonClass()} onClick={() => void addStory()}>
          <Plus className="h-4 w-4" />
          New story
        </button>
      }
    >
      {error ? <ErrorState message={error} /> : null}
      <WorkspaceSection title="New story">
        <input
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
          placeholder="Story title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </WorkspaceSection>
      <CentralEntityList title="Records" emptyMessage="No stories yet.">
        {loading && !bundle ? (
          <LoadingState label="stories" />
        ) : stories.length === 0 ? (
          <p className="text-sm text-white/45">No stories yet.</p>
        ) : (
          <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
            {stories.map((row: MarketingStoryRecord) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-white/90">{row.title}</p>
                  <p className="text-white/50">{row.storyKind}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={row.status} />
                  <EntityActions
                    onEdit={() => void save("stories", { ...row, title: `${row.title} (updated)` })}
                    onDelete={() => void remove("stories", row.id)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CentralEntityList>
    </CentralMarketingShell>
  );
}
