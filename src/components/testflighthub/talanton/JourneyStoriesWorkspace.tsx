"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Filter,
  MapPin,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";

import {
  addDemoMediaToJourney,
  blankJourneyStory,
  buildInvestorEmailDraft,
  filterJourneyStories,
  generateJourneyContent,
  GUIDED_QUESTION_FIELDS,
  JOURNEY_DISTRIBUTION_TARGETS,
  JOURNEY_PUBLISH_STATUSES,
  journeyStoriesDashboardMetrics,
  regenerateJourneyContent,
  upsertJourneyStory,
  type GuidedJourneyAnswers,
  type InvestorAudience,
  type JourneyDistributionTarget,
  type JourneyMediaKind,
  type JourneyPublishStatus,
  type JourneyStory,
} from "@/lib/talanton/journey-stories-store";
import {
  addJourneyStoryToNewsletter,
  ingestJourneyMediaToLibrary,
} from "@/lib/talanton/marketing-stories-store";
import { TALANTON_PORTFOLIO_COMPANIES } from "@/lib/talanton/portfolio-data";
import { cn } from "@/lib/utils";
import {
  TalantonGeneratedPanel,
  TalantonImpactMetric,
  TalantonIntelligenceHeader,
} from "./talanton-intelligence-ui";
import { useTalantonJourneyStoriesStore } from "./useTalantonJourneyStoriesStore";

type Mode = "dashboard" | "editor";

function statusClass(status: JourneyPublishStatus) {
  if (status === "Published") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
  if (status === "Approved") return "border-sky-400/30 bg-sky-500/10 text-sky-100";
  if (status === "Review") return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  if (status === "Archived") return "border-white/15 bg-white/[0.04] text-white/45";
  return "border-white/15 bg-white/[0.04] text-white/60";
}

function syncMediaToLibrary(story: JourneyStory) {
  const companyId = story.companyIds[0] ?? "ti-co-arc-ride";
  const companyName = story.companyNames[0] ?? "Talanton portfolio visit";
  ingestJourneyMediaToLibrary({
    journeyStoryId: story.id,
    journeyTitle: story.title,
    country: story.country,
    author: story.author,
    companyId,
    companyName,
    uploadDate: story.endDate || story.startDate,
    assets: story.media.map((m) => ({
      id: m.id,
      name: m.name,
      mediaType:
        m.kind === "photo" ? "Image" : m.kind === "video" ? "Video" : ("Document" as const),
      caption: `${m.caption} · ${story.country} · ${story.author} · ${story.endDate}`,
    })),
  });
}

const GENERATED_PANELS: {
  key: keyof JourneyStory["generated"];
  title: string;
  eyebrow: string;
}[] = [
  { key: "journeyStory", title: "Journey Story", eyebrow: "Website-quality article" },
  { key: "executiveSummary", title: "Executive Summary", eyebrow: "Leadership brief" },
  { key: "boardSummary", title: "Board Summary", eyebrow: "Board Portal ready" },
  { key: "investorUpdate", title: "Investor Update", eyebrow: "LP communication" },
  { key: "newsletterArticle", title: "Newsletter Article", eyebrow: "Digital Newsletter" },
  { key: "linkedInPost", title: "LinkedIn Post", eyebrow: "Professional social" },
  { key: "impactHighlights", title: "Impact Highlights", eyebrow: "Bullet summary" },
];

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-emerald-400/40";

export default function JourneyStoriesWorkspace() {
  const store = useTalantonJourneyStoriesStore();
  const [mode, setMode] = useState<Mode>("dashboard");
  const [draft, setDraft] = useState<JourneyStory | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("all");
  const [companyId, setCompanyId] = useState("all");
  const [author, setAuthor] = useState("all");
  const [status, setStatus] = useState<JourneyPublishStatus | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const metrics = useMemo(() => journeyStoriesDashboardMetrics(), [store.stories]);

  const filtered = useMemo(
    () =>
      filterJourneyStories({
        query,
        country,
        companyId,
        author,
        status,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
    [store.stories, query, country, companyId, author, status, dateFrom, dateTo],
  );

  const countries = useMemo(
    () => [...new Set(store.stories.map((s) => s.country))].sort(),
    [store.stories],
  );
  const authors = useMemo(
    () => [...new Set(store.stories.map((s) => s.author))].sort(),
    [store.stories],
  );

  useEffect(() => {
    for (const s of store.stories) {
      if (s.media.length) syncMediaToLibrary(s);
    }
    // Seed Media Library once on mount from journey demo media
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setDraft(blankJourneyStory());
    setMode("editor");
    setNotice(null);
  }

  function openEdit(story: JourneyStory) {
    setDraft({ ...story, answers: { ...story.answers }, generated: { ...story.generated } });
    setMode("editor");
    setNotice(null);
  }

  function saveDraft(nextStatus?: JourneyPublishStatus) {
    if (!draft) return;
    if (!draft.title.trim()) {
      setNotice("Journey title is required.");
      return;
    }
    const withCompanies = {
      ...draft,
      companyNames: draft.companyIds.map(
        (id) => TALANTON_PORTFOLIO_COMPANIES.find((c) => c.id === id)?.name ?? id,
      ),
      status: nextStatus ?? draft.status,
      generated: generateJourneyContent({
        ...draft,
        companyNames: draft.companyIds.map(
          (id) => TALANTON_PORTFOLIO_COMPANIES.find((c) => c.id === id)?.name ?? id,
        ),
      }),
    };
    const saved = upsertJourneyStory(withCompanies);
    syncMediaToLibrary(saved);
    setDraft(saved);
    setNotice(
      nextStatus
        ? `Journey story saved as ${nextStatus}. Media synced to Media Library.`
        : "Journey story saved. Media synced to Media Library.",
    );
  }

  function runGenerate() {
    if (!draft) return;
    const saved = upsertJourneyStory({
      ...draft,
      companyNames: draft.companyIds.map(
        (id) => TALANTON_PORTFOLIO_COMPANIES.find((c) => c.id === id)?.name ?? id,
      ),
    });
    const regenerated = regenerateJourneyContent(saved.id);
    if (regenerated) {
      setDraft(regenerated);
      setNotice("AI content pack regenerated from guided answers.");
    }
  }

  function toggleCompany(id: string) {
    if (!draft) return;
    const has = draft.companyIds.includes(id);
    const companyIds = has
      ? draft.companyIds.filter((x) => x !== id)
      : [...draft.companyIds, id];
    setDraft({ ...draft, companyIds });
  }

  function toggleTarget(id: JourneyDistributionTarget) {
    if (!draft) return;
    const has = draft.distributionTargets.includes(id);
    setDraft({
      ...draft,
      distributionTargets: has
        ? draft.distributionTargets.filter((t) => t !== id)
        : [...draft.distributionTargets, id],
    });
  }

  function setAnswer(key: keyof GuidedJourneyAnswers, value: string) {
    if (!draft) return;
    setDraft({ ...draft, answers: { ...draft.answers, [key]: value } });
  }

  function attachMedia(kind: JourneyMediaKind) {
    if (!draft) return;
    const updated = addDemoMediaToJourney(draft.id, kind);
    if (updated) {
      setDraft(updated);
      syncMediaToLibrary(updated);
      setNotice(`${kind} added and filed in Media Library.`);
      return;
    }
    // New unsaved draft — attach locally then upsert
    const local = { ...draft };
    const fake = addDemoMediaToJourney(
      upsertJourneyStory(local).id,
      kind,
    );
    if (fake) {
      setDraft(fake);
      syncMediaToLibrary(fake);
      setNotice(`${kind} added and filed in Media Library.`);
    }
  }

  function addToNewsletter() {
    if (!draft) return;
    const saved = upsertJourneyStory(draft);
    const nl = addJourneyStoryToNewsletter(saved.id);
    setNotice(
      nl
        ? `Added to Digital Newsletter draft “${nl.title}”.`
        : "Could not find a newsletter draft.",
    );
  }

  if (mode === "editor" && draft) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
        <TalantonIntelligenceHeader
          moduleLabel="Marketing & Stories · Journey Stories"
          title={draft.title || "Create Journey Story"}
          description="Guided capture from portfolio company visits — insights, impact, prayer, and media for Talanton’s stewardship ecosystem."
          actions={
            <button
              type="button"
              onClick={() => {
                setMode("dashboard");
                setDraft(null);
              }}
              className="rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-xs text-white/70"
            >
              Back to dashboard
            </button>
          }
        />

        {notice ? (
          <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {notice}
          </div>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold text-white">Journey Details</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-white/45 sm:col-span-2">
              Journey Title
              <input
                className={cn(inputClass, "mt-1")}
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="e.g. Kenya Founder Visit — Nairobi Corridor"
              />
            </label>
            <label className="block text-xs text-white/45">
              Country
              <input
                className={cn(inputClass, "mt-1")}
                value={draft.country}
                onChange={(e) => setDraft({ ...draft, country: e.target.value })}
              />
            </label>
            <label className="block text-xs text-white/45">
              Region
              <input
                className={cn(inputClass, "mt-1")}
                value={draft.region}
                onChange={(e) => setDraft({ ...draft, region: e.target.value })}
              />
            </label>
            <label className="block text-xs text-white/45">
              City
              <input
                className={cn(inputClass, "mt-1")}
                value={draft.city}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
              />
            </label>
            <label className="block text-xs text-white/45">
              Author
              <input
                className={cn(inputClass, "mt-1")}
                value={draft.author}
                onChange={(e) => setDraft({ ...draft, author: e.target.value })}
              />
            </label>
            <label className="block text-xs text-white/45">
              Start Date
              <input
                type="date"
                className={cn(inputClass, "mt-1")}
                value={draft.startDate}
                onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
              />
            </label>
            <label className="block text-xs text-white/45">
              End Date
              <input
                type="date"
                className={cn(inputClass, "mt-1")}
                value={draft.endDate}
                onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
              />
            </label>
            <label className="block text-xs text-white/45 sm:col-span-2">
              Team Members (comma-separated)
              <input
                className={cn(inputClass, "mt-1")}
                value={draft.teamMembers.join(", ")}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    teamMembers: e.target.value
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  })
                }
              />
            </label>
            <label className="block text-xs text-white/45">
              Sector
              <input
                className={cn(inputClass, "mt-1")}
                value={draft.sector}
                onChange={(e) => setDraft({ ...draft, sector: e.target.value })}
              />
            </label>
            <label className="block text-xs text-white/45">
              Journey Purpose
              <input
                className={cn(inputClass, "mt-1")}
                value={draft.purpose}
                onChange={(e) => setDraft({ ...draft, purpose: e.target.value })}
              />
            </label>
            <div className="sm:col-span-2">
              <p className="text-xs text-white/45">Portfolio Companies Visited</p>
              <div className="mt-2 flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                {TALANTON_PORTFOLIO_COMPANIES.map((c) => {
                  const on = draft.companyIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCompany(c.id)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px]",
                        on
                          ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                          : "border-white/10 text-white/55",
                      )}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold text-white">Media Uploads</h2>
          <p className="mt-1 text-sm text-white/55">
            Photos, videos, documents and PDFs are filed in Media Library with journey, country,
            company, date and author tags.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(
              [
                ["photo", "Photo"],
                ["video", "Video"],
                ["document", "Document"],
                ["pdf", "PDF"],
              ] as const
            ).map(([kind, label]) => (
              <button
                key={kind}
                type="button"
                onClick={() => attachMedia(kind)}
                className="rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-xs text-white/75"
              >
                Add {label}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {draft.media.map((m) => (
              <div
                key={m.id}
                className="overflow-hidden rounded-xl border border-white/10 bg-black/20"
              >
                {m.kind === "photo" && m.url.startsWith("http") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.name} className="h-32 w-full object-cover" />
                ) : (
                  <div className="flex h-32 items-center justify-center text-xs uppercase tracking-wide text-white/40">
                    {m.kind} preview
                  </div>
                )}
                <div className="p-3">
                  <p className="text-xs font-medium text-white">{m.name}</p>
                  <p className="mt-1 text-[10px] text-white/40">{m.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold text-white">Guided Journey Questions</h2>
          <p className="mt-1 text-sm text-white/55">
            Capture field wisdom — not a blog post. Answers feed every AI content pack below.
          </p>
          <div className="mt-4 space-y-4">
            {GUIDED_QUESTION_FIELDS.map((q) => (
              <label key={q.key} className="block text-xs text-white/45">
                {q.label}
                <span className="mt-0.5 block text-[11px] font-normal text-white/30">{q.hint}</span>
                <textarea
                  rows={3}
                  className={cn(inputClass, "mt-1")}
                  value={draft.answers[q.key]}
                  onChange={(e) => setAnswer(q.key, e.target.value)}
                />
              </label>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => saveDraft("Draft")}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80"
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={runGenerate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
          >
            <Sparkles className="h-4 w-4" />
            Generate AI content pack
          </button>
        </div>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">AI Content Generation</h2>
          <p className="text-sm text-white/55">
            One journey → seven stewardship-ready outputs. Each panel includes Copy.
          </p>
          {GENERATED_PANELS.map((p) => (
            <TalantonGeneratedPanel
              key={p.key}
              eyebrow={p.eyebrow}
              title={p.title}
              copyText={draft.generated[p.key] || `(Generate content for ${p.title})`}
            >
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/75">
                {draft.generated[p.key] || "Click “Generate AI content pack” to create this output."}
              </pre>
            </TalantonGeneratedPanel>
          ))}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold text-white">Publishing & Distribution</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="text-xs text-white/45">Publishing Status</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {JOURNEY_PUBLISH_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDraft({ ...draft, status: s })}
                    className={cn(
                      "rounded-full border px-3 py-1 text-[11px]",
                      draft.status === s
                        ? statusClass(s)
                        : "border-white/10 text-white/50",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-white/45">Publish To</p>
              <div className="mt-2 space-y-1.5">
                {JOURNEY_DISTRIBUTION_TARGETS.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-sm text-white/70">
                    <input
                      type="checkbox"
                      checked={draft.distributionTargets.includes(t.id)}
                      onChange={() => toggleTarget(t.id)}
                    />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-white/10 pt-5">
            <h3 className="text-sm font-semibold text-white">Investor Audience</h3>
            <p className="mt-1 text-xs text-white/45">
              When Publish To includes Investor Updates, choose which investors receive this Journey Story.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  ["all-investors", "All Investors"],
                  ["impact-fund", "Impact Fund Investors"],
                  ["momentum-fund", "Momentum Fund Investors"],
                  ["stewards-fund", "Stewards Fund Investors"],
                  ["custom", "Custom Selection"],
                ] as const
              ).map(([id, label]) => (
                <label
                  key={id}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-[11px]",
                    draft.investorAudience === id
                      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                      : "border-white/10 text-white/55",
                  )}
                >
                  <input
                    type="checkbox"
                    className="accent-emerald-400"
                    checked={draft.investorAudience === id}
                    onChange={() =>
                      setDraft({ ...draft, investorAudience: id as InvestorAudience })
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
            {draft.investorAudience === "custom" ? (
              <label className="mt-3 block text-xs text-white/45">
                Custom emails (comma-separated)
                <input
                  className={cn(inputClass, "mt-1")}
                  value={draft.customInvestorEmails.join(", ")}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      customInvestorEmails: e.target.value
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </label>
            ) : null}
            <TalantonGeneratedPanel
              className="mt-4"
              eyebrow="Investor-ready"
              title="Investor Email Draft"
              copyText={buildInvestorEmailDraft(draft)}
            >
              <pre className="whitespace-pre-wrap font-sans text-sm text-white/75">
                {buildInvestorEmailDraft(draft)}
              </pre>
            </TalantonGeneratedPanel>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => saveDraft()}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
            >
              Save & distribute
            </button>
            <button
              type="button"
              onClick={addToNewsletter}
              className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100"
            >
              Add To Newsletter
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <TalantonIntelligenceHeader
        moduleLabel="Marketing & Stories · Journey Stories"
        title="Journey Stories"
        description="Capture insights, impact, photos and prayer from portfolio company visits — then distribute across Marketing, Board, Newsletter, company portals and investors."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Create Journey Story
          </button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <TalantonImpactMetric label="Total Journey Stories" value={metrics.total} />
        <TalantonImpactMetric label="Countries Visited" value={metrics.countriesVisited} />
        <TalantonImpactMetric
          label="Portfolio Companies Visited"
          value={metrics.companiesVisited}
        />
        <TalantonImpactMetric label="Photos Uploaded" value={metrics.photosUploaded} />
        <TalantonImpactMetric label="Videos Uploaded" value={metrics.videosUploaded} />
        <TalantonImpactMetric
          label="Published Stories"
          value={metrics.publishedStories}
          tone="good"
        />
      </div>

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2 text-xs text-white/45">
          <Filter className="h-3.5 w-3.5" />
          Search & filtering
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <input
            className={inputClass}
            placeholder="Search journeys…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className={inputClass}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="all">All countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
          >
            <option value="all">All companies</option>
            {TALANTON_PORTFOLIO_COMPANIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          >
            <option value="all">All authors</option>
            {authors.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as JourneyPublishStatus | "all")}
          >
            <option value="all">All statuses</option>
            {JOURNEY_PUBLISH_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="date"
              className={inputClass}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              title="From"
            />
            <input
              type="date"
              className={inputClass}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              title="To"
            />
          </div>
        </div>
      </section>

      <TalantonGeneratedPanel
        eyebrow="Recent journeys"
        title="Journey Stories queue"
        copyText={filtered
          .map(
            (s) =>
              `• [${s.status}] ${s.title} — ${s.country} · ${s.startDate} · ${s.author}`,
          )
          .join("\n")}
      >
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
              <tr>
                <th className="px-3 py-2.5 font-medium">Title</th>
                <th className="px-3 py-2.5 font-medium">Country</th>
                <th className="px-3 py-2.5 font-medium">Date</th>
                <th className="px-3 py-2.5 font-medium">Author</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className="cursor-pointer border-t border-white/8 text-white/80 hover:bg-white/[0.03]"
                  onClick={() => openEdit(s)}
                >
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-white">{s.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/40">
                      <Users className="h-3 w-3" />
                      {s.companyNames.slice(0, 2).join(", ")}
                      {s.companyNames.length > 2 ? "…" : ""}
                    </p>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-white/40" />
                      {s.country}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3 w-3 text-white/40" />
                      {s.startDate}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">{s.author}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px]",
                        statusClass(s.status),
                      )}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TalantonGeneratedPanel>
    </div>
  );
}
