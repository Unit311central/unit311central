"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  FileUp,
  ImageIcon,
  Sparkles,
  TrendingUp,
  Video,
} from "lucide-react";

import {
  blankImpactReport,
  blankStory,
  IMPACT_CATEGORIES,
  impactReportTrendSeries,
  listImpactReportHistory,
  listStoryHistory,
  saveImpactReport,
  saveStory,
  type ImpactCategory,
  type ImpactReport,
  type ImpactStory,
  type StoryStatus,
} from "@/lib/talanton/company-stories-impact";
import { ingestCompanyPortalStory } from "@/lib/talanton/marketing-stories-store";
import { companyById } from "@/lib/talanton/portfolio-data";

function mapCategoryForMarketing(
  category: ImpactCategory,
): "Jobs & Livelihoods" | "Women & Youth" | "Community Development" | "Climate & Environment" {
  if (category === "Gender Inclusion" || category === "Youth Skills") return "Women & Youth";
  if (category === "Climate & Air Quality") return "Climate & Environment";
  if (category === "Community Wellbeing" || category === "Mobility Access") {
    return "Community Development";
  }
  return "Jobs & Livelihoods";
}

function feedStoryToMarketing(story: ImpactStory) {
  if (story.status === "Draft") return;
  ingestCompanyPortalStory({
    id: story.id,
    title: story.title,
    summary: story.summary,
    fullStory: story.fullStory,
    companyId: story.companyId,
    companyName: story.companyName,
    country: story.country,
    impactCategory: mapCategoryForMarketing(story.impactCategory),
    status: story.status,
    submissionDate: story.submittedAt,
    photos: story.photos.map((p) => ({
      id: p.id,
      name: p.name,
      mediaType: "Image" as const,
      caption: p.caption ?? p.name,
    })),
    videos: story.videos.map((v) => ({
      id: v.id,
      name: v.name,
      mediaType: "Video" as const,
      caption: v.caption ?? v.name,
    })),
    attachments: story.attachments.map((a) => ({
      id: a.id,
      name: a.name,
      mediaType: "Document" as const,
      caption: a.caption ?? a.name,
    })),
    submittedBy: `${story.companyName} portal`,
  });
}

type Tab = "overview" | "story-form" | "story-history" | "impact-form" | "impact-history";

type Props = {
  companyId: string;
  initialTab?: Tab;
};

function statusClass(status: string) {
  if (status === "Approved") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
  if (status === "Under Review") return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  if (status === "Submitted") return "border-sky-400/30 bg-sky-500/10 text-sky-100";
  return "border-white/15 bg-white/[0.04] text-white/60";
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs text-white/45">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-emerald-400/40";

export function CompanyPortalStoriesImpact({ companyId, initialTab = "overview" }: Props) {
  const company = companyById(companyId);
  const companyName = company?.name ?? "Portfolio company";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [tick, setTick] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const stories = useMemo(() => listStoryHistory(companyId), [companyId, tick]);
  const reports = useMemo(() => listImpactReportHistory(companyId), [companyId, tick]);
  const trends = useMemo(() => impactReportTrendSeries(companyId), [companyId, tick]);
  const featuredStory = useMemo(() => {
    const rank = (s: ImpactStory) =>
      s.status === "Approved" ? 0 : s.status === "Under Review" ? 1 : s.status === "Submitted" ? 2 : 3;
    return [...stories].sort((a, b) => rank(a) - rank(b))[0] ?? null;
  }, [stories]);

  const [storyDraft, setStoryDraft] = useState<ImpactStory>(() =>
    blankStory(companyId, companyName),
  );
  const [reportDraft, setReportDraft] = useState<ImpactReport>(() =>
    blankImpactReport(companyId, companyName),
  );

  function refresh(msg: string) {
    setTick((n) => n + 1);
    setNotice(msg);
  }

  function persistStory(status: StoryStatus) {
    if (!storyDraft.title.trim() || !storyDraft.summary.trim()) {
      setNotice("Story title and summary are required.");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const next: ImpactStory = {
      ...storyDraft,
      companyId,
      companyName,
      status,
      submittedAt: status === "Draft" ? storyDraft.submittedAt : today,
      updatedAt: today,
      photos: storyDraft.photos.length
        ? storyDraft.photos
        : [
            {
              id: `ph-${Date.now()}`,
              kind: "photo",
              name: "Uploaded story photo (demo)",
              url: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80",
              caption: "Demo photo attached on submit",
            },
          ],
    };
    saveStory(companyId, next);
    feedStoryToMarketing(next);
    setStoryDraft(blankStory(companyId, companyName));
    refresh(
      status === "Draft"
        ? "Story saved as draft."
        : "Story submitted — queued for Marketing & Stories, Portfolio Stories, Media Library, and Newsletter once approved.",
    );
    setTab("story-history");
  }

  function persistReport(status: ImpactReport["status"]) {
    if (!reportDraft.reportingPeriod.trim()) {
      setNotice("Reporting period is required.");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const next: ImpactReport = {
      ...reportDraft,
      companyId,
      companyName,
      status,
      submittedAt: status === "Draft" ? reportDraft.submittedAt : today,
      updatedAt: today,
    };
    saveImpactReport(companyId, next);
    setReportDraft(blankImpactReport(companyId, companyName));
    refresh(
      status === "Draft"
        ? "Impact report saved as draft."
        : "Impact report submitted — feeding Impact Intelligence, Board Portal Impact Intelligence, and future analytics.",
    );
    setTab("impact-history");
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "story-form", label: "Submit Story" },
    { id: "story-history", label: "Story History" },
    { id: "impact-form", label: "Report Impact" },
    { id: "impact-history", label: "Impact History" },
  ];

  const latest = reports.find((r) => r.status !== "Draft");

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
          Stories & Impact
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-white">{companyName}</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/55">
          Submit impact stories and quantitative impact data. Approved stories flow to Marketing &
          Stories, Portfolio Stories, Media Library, and the Digital Newsletter. Impact metrics feed
          Impact Intelligence and the Board Portal.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              tab === t.id
                ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                : "border-white/10 bg-white/[0.04] text-white/65 hover:border-white/20 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {notice ? (
        <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </div>
      ) : null}

      {tab === "overview" ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(
              [
                { label: "Stories on file", value: String(stories.length), Icon: BookOpen },
                {
                  label: "Approved stories",
                  value: String(stories.filter((s) => s.status === "Approved").length),
                  Icon: Sparkles,
                },
                { label: "Impact reports", value: String(reports.length), Icon: BarChart3 },
                {
                  label: "Latest people served",
                  value: latest ? latest.peopleServed.toLocaleString() : "—",
                  Icon: TrendingUp,
                },
              ] as const
            ).map(({ label, value, Icon }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex items-center gap-2 text-white/40">
                  <Icon className="h-3.5 w-3.5" />
                  <p className="text-[10px] font-semibold uppercase tracking-wide">{label}</p>
                </div>
                <p className="mt-2 text-xl font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold text-white">Platform feeds</h2>
            <ul className="mt-3 grid gap-2 text-sm text-white/65 sm:grid-cols-2">
              <li className="rounded-lg border border-white/8 bg-black/20 px-3 py-2">
                Impact data → Impact Intelligence
              </li>
              <li className="rounded-lg border border-white/8 bg-black/20 px-3 py-2">
                Impact data → Board Portal Impact Intelligence
              </li>
              <li className="rounded-lg border border-white/8 bg-black/20 px-3 py-2">
                Stories → Marketing & Stories / Portfolio Stories
              </li>
              <li className="rounded-lg border border-white/8 bg-black/20 px-3 py-2">
                Stories → Media Library / Digital Newsletter
              </li>
            </ul>
          </section>

          {featuredStory ? (
            <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              <div className="grid gap-0 lg:grid-cols-[1.1fr_1fr]">
                {featuredStory.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={featuredStory.photos[0].url}
                    alt={featuredStory.photos[0].name}
                    className="h-56 w-full object-cover lg:h-full"
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center bg-black/30 text-white/40 lg:h-full">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
                <div className="p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300/80">
                    Featured story
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-white">{featuredStory.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{featuredStory.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] ${statusClass(featuredStory.status)}`}
                    >
                      {featuredStory.status}
                    </span>
                    <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] text-white/55">
                      {featuredStory.community}
                    </span>
                    <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] text-white/55">
                      {featuredStory.impactCategory}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      {tab === "story-form" ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold text-white">Story Submission</h2>
          <p className="mt-1 text-sm text-white/55">
            Capture a field story with media for Talanton marketing and LP narratives.
          </p>
          <form
            className="mt-4 grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              persistStory("Submitted");
            }}
          >
            <div className="sm:col-span-2">
              <Field label="Story Title">
                <input
                  className={inputClass}
                  value={storyDraft.title}
                  onChange={(e) => setStoryDraft({ ...storyDraft, title: e.target.value })}
                  placeholder="e.g. Women Riders Leading Nairobi’s Night Economy"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Summary">
                <textarea
                  rows={2}
                  className={inputClass}
                  value={storyDraft.summary}
                  onChange={(e) => setStoryDraft({ ...storyDraft, summary: e.target.value })}
                  placeholder="One or two sentences for Portfolio Stories cards"
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Full Story">
                <textarea
                  rows={6}
                  className={inputClass}
                  value={storyDraft.fullStory}
                  onChange={(e) => setStoryDraft({ ...storyDraft, fullStory: e.target.value })}
                  placeholder="Narrative with outcomes, quotes, and context…"
                />
              </Field>
            </div>
            <Field label="Country">
              <input
                className={inputClass}
                value={storyDraft.country}
                onChange={(e) => setStoryDraft({ ...storyDraft, country: e.target.value })}
              />
            </Field>
            <Field label="Community">
              <input
                className={inputClass}
                value={storyDraft.community}
                onChange={(e) => setStoryDraft({ ...storyDraft, community: e.target.value })}
                placeholder="e.g. Kibera, Nairobi"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Impact Category">
                <select
                  className={inputClass}
                  value={storyDraft.impactCategory}
                  onChange={(e) =>
                    setStoryDraft({
                      ...storyDraft,
                      impactCategory: e.target.value as ImpactCategory,
                    })
                  }
                >
                  {IMPACT_CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-[#0b1a14]">
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="sm:col-span-2 grid gap-3 sm:grid-cols-3">
              {(
                [
                  { label: "Photos", Icon: ImageIcon, hint: "JPG / PNG — field photos" },
                  { label: "Videos", Icon: Video, hint: "MP4 / YouTube link" },
                  { label: "Attachments", Icon: FileUp, hint: "PDF consent / fact sheets" },
                ] as const
              ).map(({ label, Icon, hint }) => (
                <div
                  key={label}
                  className="rounded-xl border border-dashed border-white/15 bg-black/20 px-3 py-4 text-center"
                >
                  <Icon className="mx-auto h-5 w-5 text-emerald-300/80" />
                  <p className="mt-2 text-sm font-medium text-white">{label}</p>
                  <p className="mt-1 text-[11px] text-white/40">{hint}</p>
                  <p className="mt-2 text-[11px] text-emerald-200/80">Demo: media attached on submit</p>
                </div>
              ))}
            </div>

            <div className="sm:col-span-2 flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => persistStory("Draft")}
                className="rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2 text-sm text-white/80"
              >
                Save draft
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Submit story
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {tab === "story-history" ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold text-white">Company story history</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Submission Date</th>
                  <th className="px-3 py-2.5 font-medium">Title</th>
                  <th className="px-3 py-2.5 font-medium">Category</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {stories.map((s) => (
                  <tr key={s.id} className="border-t border-white/8 text-white/80">
                    <td className="px-3 py-2.5">{s.submittedAt ?? "— (draft)"}</td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-white">{s.title}</p>
                      <p className="mt-0.5 text-xs text-white/45">{s.community}</p>
                    </td>
                    <td className="px-3 py-2.5">{s.impactCategory}</td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] ${statusClass(s.status)}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === "impact-form" ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold text-white">Impact Reporting</h2>
          <p className="mt-1 text-sm text-white/55">
            Quantitative metrics for the reporting period. Submitted figures refresh Impact
            Intelligence scorecards.
          </p>
          <form
            className="mt-4 grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              persistReport("Submitted");
            }}
          >
            <Field label="Reporting Period">
              <input
                className={inputClass}
                value={reportDraft.reportingPeriod}
                onChange={(e) =>
                  setReportDraft({ ...reportDraft, reportingPeriod: e.target.value })
                }
                placeholder="Q3 2026"
              />
            </Field>
            <Field label="Countries Impacted">
              <input
                type="number"
                min={0}
                className={inputClass}
                value={reportDraft.countriesImpacted}
                onChange={(e) =>
                  setReportDraft({
                    ...reportDraft,
                    countriesImpacted: Number(e.target.value) || 0,
                  })
                }
              />
            </Field>
            {(
              [
                ["Jobs Created", "jobsCreated"],
                ["Jobs Retained", "jobsRetained"],
                ["Women Employed", "womenEmployed"],
                ["Youth Employed", "youthEmployed"],
                ["People Served", "peopleServed"],
                ["Communities Impacted", "communitiesImpacted"],
              ] as const
            ).map(([label, key]) => (
              <Field key={key} label={label}>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={reportDraft[key]}
                  onChange={(e) =>
                    setReportDraft({
                      ...reportDraft,
                      [key]: Number(e.target.value) || 0,
                    })
                  }
                />
              </Field>
            ))}
            <div className="sm:col-span-2">
              <Field label="Additional Impact Notes (optional)">
                <textarea
                  rows={3}
                  className={inputClass}
                  value={reportDraft.additionalNotes}
                  onChange={(e) =>
                    setReportDraft({ ...reportDraft, additionalNotes: e.target.value })
                  }
                  placeholder="Context for Talanton Impact Directors…"
                />
              </Field>
            </div>
            <div className="sm:col-span-2 flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => persistReport("Draft")}
                className="rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2 text-sm text-white/80"
              >
                Save draft
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Submit impact report
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {tab === "impact-history" ? (
        <div className="space-y-4">
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold text-white">Historical reporting</h2>
            <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
                  <tr>
                    <th className="px-3 py-2.5 font-medium">Period</th>
                    <th className="px-3 py-2.5 font-medium">Jobs created</th>
                    <th className="px-3 py-2.5 font-medium">People served</th>
                    <th className="px-3 py-2.5 font-medium">Communities</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="px-3 py-2.5 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} className="border-t border-white/8 text-white/80">
                      <td className="px-3 py-2.5 font-medium text-white">{r.reportingPeriod}</td>
                      <td className="px-3 py-2.5">{r.jobsCreated.toLocaleString()}</td>
                      <td className="px-3 py-2.5">{r.peopleServed.toLocaleString()}</td>
                      <td className="px-3 py-2.5">{r.communitiesImpacted}</td>
                      <td className="px-3 py-2.5">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] ${statusClass(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">{r.submittedAt ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold text-white">Trends</h2>
            <p className="mt-1 text-sm text-white/55">
              Jobs created and people served across submitted periods.
            </p>
            <div className="mt-4 space-y-3">
              {trends.map((t) => {
                const maxJobs = Math.max(...trends.map((x) => x.jobsCreated), 1);
                const maxPeople = Math.max(...trends.map((x) => x.peopleServed), 1);
                return (
                  <div key={t.period} className="rounded-xl border border-white/8 bg-black/20 p-3">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-white">{t.period}</span>
                      <span className="text-xs text-white/45">
                        Women {t.womenEmployed} · Youth {t.youthEmployed} · Communities{" "}
                        {t.communitiesImpacted}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="mb-1 flex justify-between text-[11px] text-white/45">
                          <span>Jobs created</span>
                          <span>{t.jobsCreated}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-emerald-400/80"
                            style={{ width: `${(t.jobsCreated / maxJobs) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 flex justify-between text-[11px] text-white/45">
                          <span>People served</span>
                          <span>{t.peopleServed.toLocaleString()}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-sky-400/70"
                            style={{ width: `${(t.peopleServed / maxPeople) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
