"use client";

import { useMemo, useState } from "react";
import { Check, Mail, Plus, Send, Trash2 } from "lucide-react";

import {
  deleteNewsletter,
  listApprovedStoriesForNewsletter,
  sendNewsletterNow,
  upsertNewsletter,
  type PortfolioStory,
  type RecipientMode,
  type StoriesNewsletter,
} from "@/lib/talanton/marketing-stories-store";
import { listJourneyStoriesForNewsletter } from "@/lib/talanton/journey-stories-store";
import { cn } from "@/lib/utils";
import { TalantonIntelligenceHeader } from "./talanton-intelligence-ui";
import { useTalantonMarketingStoriesStore } from "./useTalantonMarketingStoriesStore";

type FormState = {
  id: string | null;
  title: string;
  subject: string;
  htmlBody: string;
  selectedStoryIds: string[];
  selectedJourneyStoryIds: string[];
  recipientMode: RecipientMode;
  recipientContactIds: string[];
  manualEmailsText: string;
};

function emptyForm(): FormState {
  return {
    id: null,
    title: "",
    subject: "",
    htmlBody: "",
    selectedStoryIds: [],
    selectedJourneyStoryIds: [],
    recipientMode: "all",
    recipientContactIds: [],
    manualEmailsText: "",
  };
}

function formFromNewsletter(item: StoriesNewsletter): FormState {
  return {
    id: item.id,
    title: item.title,
    subject: item.subject,
    htmlBody: item.htmlBody,
    selectedStoryIds: item.selectedStoryIds,
    selectedJourneyStoryIds: item.selectedJourneyStoryIds ?? [],
    recipientMode: item.recipientMode,
    recipientContactIds: item.recipientContactIds,
    manualEmailsText: item.manualEmails.join("\n"),
  };
}

function statusClass(status: StoriesNewsletter["status"]) {
  if (status === "sent") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
  if (status === "scheduled") return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  return "border-white/15 bg-white/[0.04] text-white/55";
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

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none placeholder:text-white/30 focus:border-emerald-400/40";
const labelClass = "mb-1.5 block text-[11px] font-medium text-white/45";
const primaryBtn =
  "inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/25";
const secondaryBtn =
  "inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10";

function storyBlockHtml(story: PortfolioStory) {
  return `<h3>${story.title}</h3><p><em>${story.companyName} · ${story.country} · ${story.impactCategory}</em></p><p>${story.summary}</p>`;
}

export default function StoriesNewsletterWorkspace() {
  const store = useTalantonMarketingStoriesStore();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [notice, setNotice] = useState<string | null>(null);

  const approvedStories = useMemo(() => listApprovedStoriesForNewsletter(), [store.stories]);
  const journeySources = useMemo(() => listJourneyStoriesForNewsletter(), []);

  const sorted = useMemo(
    () =>
      [...store.newsletters].sort((a, b) => {
        const rank = (item: StoriesNewsletter) => (item.status === "sent" ? 1 : 0);
        if (rank(a) !== rank(b)) return rank(a) - rank(b);
        return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
      }),
    [store.newsletters],
  );

  function patchForm(patch: Partial<FormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function toggleStory(storyId: string) {
    setForm((current) => {
      const has = current.selectedStoryIds.includes(storyId);
      const selectedStoryIds = has
        ? current.selectedStoryIds.filter((id) => id !== storyId)
        : [...current.selectedStoryIds, storyId];
      const selected = approvedStories.filter((s) => selectedStoryIds.includes(s.id));
      const journeys = journeySources.filter((j) =>
        current.selectedJourneyStoryIds.includes(j.id),
      );
      const blocks = [
        ...selected.map(storyBlockHtml),
        ...journeys.map(
          (j) =>
            `<h3>${j.title}</h3><p><em>${j.country} · ${j.startDate} · Journey Story</em></p><p>${j.generated.newsletterArticle.replace(/\n/g, "</p><p>")}</p>`,
        ),
      ].join("");
      const intro =
        current.htmlBody.trim().length > 0 && !current.htmlBody.includes("<h3>")
          ? current.htmlBody
          : "<p>Dear partners,</p><p>Selected portfolio and journey stories for this update:</p>";
      return {
        ...current,
        selectedStoryIds,
        htmlBody: `${intro}${blocks}<p>With gratitude,<br/>Talanton Impact</p>`,
      };
    });
  }

  function toggleJourney(journeyId: string) {
    setForm((current) => {
      const has = current.selectedJourneyStoryIds.includes(journeyId);
      const selectedJourneyStoryIds = has
        ? current.selectedJourneyStoryIds.filter((id) => id !== journeyId)
        : [...current.selectedJourneyStoryIds, journeyId];
      const selected = approvedStories.filter((s) => current.selectedStoryIds.includes(s.id));
      const journeys = journeySources.filter((j) => selectedJourneyStoryIds.includes(j.id));
      const blocks = [
        ...selected.map(storyBlockHtml),
        ...journeys.map(
          (j) =>
            `<h3>${j.title}</h3><p><em>${j.country} · ${j.startDate} · Journey Story</em></p><p>${j.generated.newsletterArticle.replace(/\n/g, "</p><p>")}</p>`,
        ),
      ].join("");
      const intro =
        "<p>Dear partners,</p><p>Selected portfolio and journey stories for this update:</p>";
      return {
        ...current,
        selectedJourneyStoryIds,
        htmlBody: `${intro}${blocks}<p>With gratitude,<br/>Talanton Impact</p>`,
      };
    });
  }

  function saveDraft() {
    const id = form.id ?? `nl-${Math.random().toString(36).slice(2, 9)}`;
    upsertNewsletter({
      id,
      title: form.title.trim() || "Untitled newsletter",
      subject: form.subject.trim() || "Talanton Impact update",
      htmlBody: form.htmlBody,
      status: "draft",
      selectedStoryIds: form.selectedStoryIds,
      selectedJourneyStoryIds: form.selectedJourneyStoryIds,
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
      <TalantonIntelligenceHeader
        moduleLabel="Marketing & Stories"
        title="Digital Newsletter"
        description="Compose investor and stakeholder updates from Portfolio Stories, Journey Stories, and Impact Intelligence highlights."
        actions={
          <button type="button" className={primaryBtn} onClick={() => setForm(emptyForm())}>
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
            sorted.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setForm(formFromNewsletter(item));
                  setNotice(null);
                }}
                className={cn(
                  "w-full rounded-2xl border px-3.5 py-3 text-left transition",
                  form.id === item.id
                    ? "border-emerald-400/40 bg-emerald-500/10"
                    : "border-white/10 bg-black/20 hover:border-white/20",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] capitalize",
                      statusClass(item.status),
                    )}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-white/45">{item.subject}</p>
                <p className="mt-1 text-[11px] text-white/35">
                  {item.selectedStoryIds.length} portfolio ·{" "}
                  {(item.selectedJourneyStoryIds ?? []).length} journeys ·{" "}
                  {formatWhen(item.updatedAt)}
                </p>
              </button>
            ))
          )}
        </aside>

        <div className="space-y-4">
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

            <div className="mt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300/75">
                Approved portfolio stories
              </p>
              <p className="mt-1 text-xs text-white/45">
                Select cleared stories to insert into this newsletter or investor update.
              </p>
              <div className="mt-3 grid max-h-56 gap-2 overflow-auto sm:grid-cols-2">
                {approvedStories.map((story) => {
                  const selected = form.selectedStoryIds.includes(story.id);
                  return (
                    <button
                      key={story.id}
                      type="button"
                      onClick={() => toggleStory(story.id)}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-left transition",
                        selected
                          ? "border-emerald-400/40 bg-emerald-500/10"
                          : "border-white/10 bg-black/25 hover:border-white/20",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={cn(
                            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                            selected
                              ? "border-emerald-400/50 bg-emerald-500/30 text-emerald-100"
                              : "border-white/20",
                          )}
                        >
                          {selected ? <Check className="h-3 w-3" /> : null}
                        </span>
                        <div>
                          <p className="text-xs font-medium text-white/90">{story.title}</p>
                          <p className="mt-0.5 text-[11px] text-white/45">
                            {story.companyName} · {story.status}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300/75">
                Journey Stories
              </p>
              <p className="mt-1 text-xs text-white/45">
                Field journeys from Harry and the investment team.
              </p>
              <div className="mt-3 grid max-h-48 gap-2 overflow-auto sm:grid-cols-2">
                {journeySources.map((j) => {
                  const selected = form.selectedJourneyStoryIds.includes(j.id);
                  return (
                    <button
                      key={j.id}
                      type="button"
                      onClick={() => toggleJourney(j.id)}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-left transition",
                        selected
                          ? "border-emerald-400/40 bg-emerald-500/10"
                          : "border-white/10 bg-black/25 hover:border-white/20",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={cn(
                            "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                            selected
                              ? "border-emerald-400/50 bg-emerald-500/30 text-emerald-100"
                              : "border-white/20",
                          )}
                        >
                          {selected ? <Check className="h-3 w-3" /> : null}
                        </span>
                        <div>
                          <p className="text-xs font-medium text-white/90">{j.title}</p>
                          <p className="mt-0.5 text-[11px] text-white/45">
                            {j.country} · {j.author}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="mt-5 block">
              <span className={labelClass}>Body</span>
              <textarea
                className={cn(inputClass, "min-h-[160px] font-mono text-[13px]")}
                value={form.htmlBody}
                onChange={(e) => patchForm({ htmlBody: e.target.value })}
                placeholder="HTML body — stories insert when selected above"
              />
            </label>

            <div className="mt-5">
              <p className={labelClass}>Recipients</p>
              <div className="flex flex-wrap gap-3 text-sm text-white/70">
                {(["all", "selected", "manual"] as RecipientMode[]).map((mode) => (
                  <label key={mode} className="inline-flex items-center gap-2 capitalize">
                    <input
                      type="radio"
                      name="recipientMode"
                      checked={form.recipientMode === mode}
                      onChange={() => patchForm({ recipientMode: mode })}
                    />
                    {mode}
                  </label>
                ))}
              </div>
              {form.recipientMode === "selected" ? (
                <div className="mt-3 max-h-36 space-y-1.5 overflow-auto rounded-xl border border-white/10 bg-black/25 p-3">
                  {store.contacts.map((c) => {
                    const checked = form.recipientContactIds.includes(c.id);
                    return (
                      <label key={c.id} className="flex items-center gap-2 text-xs text-white/70">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            patchForm({
                              recipientContactIds: checked
                                ? form.recipientContactIds.filter((id) => id !== c.id)
                                : [...form.recipientContactIds, c.id],
                            })
                          }
                        />
                        {c.name} · {c.organisation} ({c.segment})
                      </label>
                    );
                  })}
                </div>
              ) : null}
              {form.recipientMode === "manual" ? (
                <textarea
                  className={cn(inputClass, "mt-3 min-h-[80px]")}
                  value={form.manualEmailsText}
                  onChange={(e) => patchForm({ manualEmailsText: e.target.value })}
                  placeholder="One email per line"
                />
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" className={secondaryBtn} onClick={saveDraft}>
                <Mail className="h-4 w-4" />
                Save draft
              </button>
              <button
                type="button"
                className={primaryBtn}
                onClick={() => {
                  const id = form.id ?? `nl-${Math.random().toString(36).slice(2, 9)}`;
                  upsertNewsletter({
                    id,
                    title: form.title.trim() || "Untitled newsletter",
                    subject: form.subject.trim() || "Talanton Impact update",
                    htmlBody: form.htmlBody,
                    status: "draft",
                    selectedStoryIds: form.selectedStoryIds,
                    selectedJourneyStoryIds: form.selectedJourneyStoryIds,
                    recipientMode: form.recipientMode,
                    recipientContactIds: form.recipientContactIds,
                    manualEmails: form.manualEmailsText
                      .split(/[\n,;]+/)
                      .map((e) => e.trim())
                      .filter(Boolean),
                    scheduledAt: null,
                    sentAt: null,
                  });
                  sendNewsletterNow(id);
                  patchForm({ id });
                  setNotice(`Newsletter sent · ${form.subject || "Talanton Impact update"}`);
                }}
              >
                <Send className="h-4 w-4" />
                Send now
              </button>
              {form.id ? (
                <button
                  type="button"
                  className={cn(secondaryBtn, "border-rose-400/20 text-rose-200")}
                  onClick={() => {
                    deleteNewsletter(form.id!);
                    setForm(emptyForm());
                    setNotice("Newsletter deleted.");
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white p-5 text-[#0b1a14]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700/80">
              Live preview
            </p>
            <h3 className="mt-1 text-lg font-semibold">{form.subject || "Subject line"}</h3>
            <div
              className="prose prose-sm mt-3 max-w-none text-[#1a2e24] [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold"
              dangerouslySetInnerHTML={{
                __html: form.htmlBody || "<p class='text-neutral-400'>Select stories to build content.</p>",
              }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
