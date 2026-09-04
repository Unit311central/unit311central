"use client";

import { useMemo, useState } from "react";
import { CalendarDays, LayoutDashboard, Mail, Plus, Send, Ticket, Trash2, Users } from "lucide-react";

import {
  WorkspaceImpactMetric,
  WorkspaceModuleHeader,
  WorkspaceSection,
} from "@/components/workspace-ui";
import {
  GREENDESERT_MARKETING_BRAND_LABEL,
  GREENDESERT_MARKETING_MODULE_LABEL,
} from "@/lib/greendesert/greendesert-marketing-shell";
import {
  deleteNewsletter,
  sendNewsletterNow,
  upsertNewsletter,
  type RecipientMode,
  type StoriesNewsletter,
} from "@/lib/talanton/marketing-stories-store";
import { cn } from "@/lib/utils";
import { useTalantonMarketingStoriesStore } from "@/components/testflighthub/talanton/useTalantonMarketingStoriesStore";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none placeholder:text-white/30 focus:border-emerald-400/40";
const labelClass = "mb-1.5 block text-[11px] font-medium text-white/45";
const primaryBtn =
  "inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/25";
const secondaryBtn =
  "inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10";

type NewsletterForm = {
  id: string | null;
  title: string;
  subject: string;
  htmlBody: string;
  recipientMode: RecipientMode;
  recipientContactIds: string[];
  manualEmailsText: string;
};

function emptyNewsletterForm(): NewsletterForm {
  return {
    id: null,
    title: "",
    subject: "",
    htmlBody: "",
    recipientMode: "all",
    recipientContactIds: [],
    manualEmailsText: "",
  };
}

function formatWhen(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function GreenDesertMarketingHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <WorkspaceModuleHeader
      brandLabel={GREENDESERT_MARKETING_BRAND_LABEL}
      moduleLabel={GREENDESERT_MARKETING_MODULE_LABEL}
      title={title}
      description={description}
      actions={actions}
      themeId="talanton-emerald"
    />
  );
}

export function GreenDesertMarketingDashboardWorkspace() {
  return (
    <div className="space-y-5 p-5 sm:p-6">
      <GreenDesertMarketingHeader
        title="Marketing Dashboard"
        description="Newsletter performance, mailing list growth, and event pipeline for Green Desert stakeholders."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <WorkspaceImpactMetric label="Newsletter open rate" value="—" hint="No campaigns sent yet" />
        <WorkspaceImpactMetric label="Mailing subscribers" value="0" hint="Add contacts in Mailing List" />
        <WorkspaceImpactMetric label="External events" value="0" hint="No events scheduled" />
        <WorkspaceImpactMetric label="Hosted programmes" value="0" hint="No managed events yet" />
      </div>
      <WorkspaceSection title="Recent activity">
        <p className="text-sm text-white/45">
          No marketing activity yet. Create a digital newsletter or add an external event to get started.
        </p>
      </WorkspaceSection>
    </div>
  );
}

export function GreenDesertExternalEventsWorkspace() {
  return (
    <div className="space-y-5 p-5 sm:p-6">
      <GreenDesertMarketingHeader
        title="External Events"
        description="Track conferences, investor forums, and partner events Green Desert attends or sponsors."
        actions={
          <button type="button" className={primaryBtn} disabled>
            <Plus className="h-4 w-4" />
            Add event
          </button>
        }
      />
      <WorkspaceSection title="Upcoming events">
        <p className="text-sm text-white/45">No external events scheduled.</p>
      </WorkspaceSection>
    </div>
  );
}

export function GreenDesertEventManagementWorkspace() {
  return (
    <div className="space-y-5 p-5 sm:p-6">
      <GreenDesertMarketingHeader
        title="Event Management"
        description="Plan and manage Green Desert-hosted programmes, registrations, and follow-up."
        actions={
          <button type="button" className={primaryBtn} disabled>
            <Plus className="h-4 w-4" />
            New programme
          </button>
        }
      />
      <WorkspaceSection title="Managed events">
        <p className="text-sm text-white/45">No managed events yet.</p>
      </WorkspaceSection>
    </div>
  );
}

export function GreenDesertDigitalNewsletterWorkspace() {
  const store = useTalantonMarketingStoriesStore();
  const [form, setForm] = useState<NewsletterForm>(emptyNewsletterForm);
  const [notice, setNotice] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...store.newsletters].sort(
        (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
      ),
    [store.newsletters],
  );

  function patchForm(patch: Partial<NewsletterForm>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function startNewNewsletter() {
    setForm(emptyNewsletterForm());
    setNotice(null);
  }

  function saveDraft() {
    const id = form.id ?? `nl-${Math.random().toString(36).slice(2, 9)}`;
    upsertNewsletter({
      id,
      title: form.title.trim() || "Untitled newsletter",
      subject: form.subject.trim() || "Green Desert update",
      htmlBody: form.htmlBody,
      status: "draft",
      selectedStoryIds: [],
      selectedJourneyStoryIds: [],
      recipientMode: form.recipientMode,
      recipientContactIds: form.recipientContactIds,
      manualEmails: form.manualEmailsText
        .split(/[\n,;]+/)
        .map((e) => e.trim())
        .filter(Boolean),
      scheduledAt: null,
      sentAt: null,
    });
    patchForm({ id });
    setNotice("Draft saved.");
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <GreenDesertMarketingHeader
        title="Digital Newsletter"
        description="Compose stakeholder updates from approved client stories and Green Desert programme highlights."
        actions={
          <button type="button" className={primaryBtn} onClick={startNewNewsletter}>
            <Plus className="h-4 w-4" />
            New newsletter
          </button>
        }
      />

      {notice ? (
        <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-100">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[19rem_minmax(0,1fr)]">
        <aside className="space-y-2">
          <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
            Newsletters
          </p>
          {sorted.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-black/20 px-4 py-6 text-center text-sm text-white/45">
              No newsletters yet.
            </p>
          ) : (
            sorted.map((item: StoriesNewsletter) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setForm({
                    id: item.id,
                    title: item.title,
                    subject: item.subject,
                    htmlBody: item.htmlBody,
                    recipientMode: item.recipientMode,
                    recipientContactIds: item.recipientContactIds,
                    manualEmailsText: item.manualEmails.join("\n"),
                  });
                  setNotice(null);
                }}
                className={cn(
                  "w-full rounded-2xl border px-3.5 py-3 text-left transition",
                  form.id === item.id
                    ? "border-emerald-400/40 bg-emerald-500/10"
                    : "border-white/10 bg-black/20 hover:border-white/20",
                )}
              >
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="mt-1 truncate text-xs text-white/45">{item.subject}</p>
                <p className="mt-1 text-[11px] text-white/35">{formatWhen(item.updatedAt)}</p>
              </button>
            ))
          )}
        </aside>

        <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f2a1f]/60 via-[#0b1a14]/85 to-[#08110d] p-5">
          <h2 className="text-lg font-semibold text-white">Compose</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label>
              <span className={labelClass}>Title</span>
              <input
                className={inputClass}
                value={form.title}
                onChange={(e) => patchForm({ title: e.target.value })}
                placeholder="Internal title"
              />
            </label>
            <label>
              <span className={labelClass}>Subject line</span>
              <input
                className={inputClass}
                value={form.subject}
                onChange={(e) => patchForm({ subject: e.target.value })}
                placeholder="Email subject"
              />
            </label>
          </div>
          <label className="mt-4 block">
            <span className={labelClass}>Body</span>
            <textarea
              className={cn(inputClass, "min-h-[180px]")}
              value={form.htmlBody}
              onChange={(e) => patchForm({ htmlBody: e.target.value })}
              placeholder="HTML body — add content for your newsletter."
            />
          </label>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className={secondaryBtn} onClick={saveDraft}>
              Save draft
            </button>
            {form.id ? (
              <>
                <button
                  type="button"
                  className={primaryBtn}
                  onClick={() => {
                    sendNewsletterNow(form.id!);
                    setNotice("Newsletter marked as sent.");
                  }}
                >
                  <Send className="h-4 w-4" />
                  Send now
                </button>
                <button
                  type="button"
                  className={cn(secondaryBtn, "border-rose-400/20 text-rose-200")}
                  onClick={() => {
                    deleteNewsletter(form.id!);
                    startNewNewsletter();
                    setNotice("Newsletter deleted.");
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

export function GreenDesertMailingListWorkspace() {
  const store = useTalantonMarketingStoriesStore();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div className="space-y-5 p-5 sm:p-6">
      <GreenDesertMarketingHeader
        title="Mailing List Management"
        description="Manage Green Desert stakeholder segments and send campaign updates."
        actions={
          <button
            type="button"
            className={primaryBtn}
            onClick={() => {
              setSubject("");
              setBody("");
              setNotice("New campaign draft started.");
            }}
          >
            <Plus className="h-4 w-4" />
            New campaign
          </button>
        }
      />

      {notice ? (
        <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-100">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <WorkspaceImpactMetric label="Contacts" value={store.contacts.length} />
        <WorkspaceImpactMetric label="Campaigns" value={store.campaigns.length} />
        <WorkspaceImpactMetric label="Sent" value={store.campaigns.filter((c) => c.status === "sent").length} />
      </div>

      <WorkspaceSection title="Compose campaign">
        <div className="grid gap-3">
          <label>
            <span className={labelClass}>Subject</span>
            <input
              className={inputClass}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Campaign subject"
            />
          </label>
          <label>
            <span className={labelClass}>Body</span>
            <textarea
              className={cn(inputClass, "min-h-[140px]")}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Campaign message"
            />
          </label>
        </div>
        {store.contacts.length === 0 ? (
          <p className="mt-4 text-sm text-white/45">No mailing contacts yet. Add contacts when ready.</p>
        ) : null}
      </WorkspaceSection>
    </div>
  );
}

export function GreenDesertClientStoriesWorkspace() {
  const store = useTalantonMarketingStoriesStore();
  const approvedCount = store.stories.filter(
    (s) => s.status === "Approved" || s.status === "Published",
  ).length;
  const clientSubmissions = store.stories.filter((s) => s.status === "Submitted").length;

  return (
    <div className="space-y-5 p-5 sm:p-6">
      <GreenDesertMarketingHeader
        title="Client Stories"
        description="Review client-submitted stories for newsletters, events, and stakeholder updates."
        actions={
          <button type="button" className={primaryBtn} disabled>
            <Plus className="h-4 w-4" />
            Add story
          </button>
        }
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <WorkspaceImpactMetric label="Stories in feed" value={store.stories.length} />
        <WorkspaceImpactMetric
          label="Client submissions"
          value={clientSubmissions}
          hint="Client portal"
          tone="good"
        />
        <WorkspaceImpactMetric label="Ready for newsletter" value={approvedCount} />
      </div>
      <WorkspaceSection title="Story feed">
        {store.stories.length === 0 ? (
          <p className="text-sm text-white/45">No client stories yet.</p>
        ) : (
          <ul className="space-y-2">
            {store.stories.map((story) => (
              <li
                key={story.id}
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/75"
              >
                <span className="font-medium text-white">{story.title}</span>
                <span className="text-white/45"> · {story.status}</span>
              </li>
            ))}
          </ul>
        )}
      </WorkspaceSection>
    </div>
  );
}

export function GreenDesertMarketingIconRow() {
  return (
    <div className="flex flex-wrap gap-2 text-white/35">
      <LayoutDashboard className="h-4 w-4" />
      <Mail className="h-4 w-4" />
      <CalendarDays className="h-4 w-4" />
      <Ticket className="h-4 w-4" />
      <Users className="h-4 w-4" />
    </div>
  );
}
