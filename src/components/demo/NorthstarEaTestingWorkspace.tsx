"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { NorthstarEaQuestionResult } from "@/lib/demo/ea-question-runner";
import type { NorthstarEaTestSection } from "@/lib/demo/ea-module-test-bank";

type RunState = "idle" | "running" | "done" | "error";

type SectionProgress = {
  section: NorthstarEaTestSection;
  results: NorthstarEaQuestionResult[];
  status: "pending" | "running" | "done";
  modulePdfUrl?: string;
};

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        ok ? "bg-sky-500/15 text-sky-300" : "bg-rose-500/15 text-rose-300"
      }`}
    >
      {ok ? "PASS" : "FAIL"}
    </span>
  );
}

export function NorthstarEaTestingWorkspace() {
  const [bank, setBank] = useState<NorthstarEaTestSection[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [state, setState] = useState<RunState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<SectionProgress[]>([]);
  const [summaryPdfUrl, setSummaryPdfUrl] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/demo/ea-tests", { cache: "no-store" });
      if (!response.ok) return;
      const body = (await response.json()) as {
        sections: NorthstarEaTestSection[];
        totalQuestions: number;
      };
      setBank(body.sections);
      setTotalQuestions(body.totalQuestions);
      setProgress(
        body.sections.map((section) => ({
          section,
          results: [],
          status: "pending",
        })),
      );
      const open: Record<string, boolean> = {};
      for (const section of body.sections) open[section.id] = section.id === "home";
      setExpanded(open);
    })();
  }, []);

  const completedCount = useMemo(
    () => progress.reduce((sum, row) => sum + row.results.length, 0),
    [progress],
  );
  const passedCount = useMemo(
    () => progress.reduce((sum, row) => sum + row.results.filter((r) => r.status === "pass").length, 0),
    [progress],
  );
  const failedCount = completedCount - passedCount;
  const progressPct = totalQuestions > 0 ? Math.round((completedCount / totalQuestions) * 100) : 0;

  const downloadModulePdf = useCallback(async (sectionProgress: SectionProgress) => {
    const response = await fetch("/api/demo/ea-tests/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "module",
        section: {
          label: sectionProgress.section.label,
          passed: sectionProgress.results.filter((r) => r.status === "pass").length,
          failed: sectionProgress.results.filter((r) => r.status === "fail").length,
          results: sectionProgress.results,
        },
      }),
    });
    if (!response.ok) throw new Error(`PDF failed (${response.status})`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    return url;
  }, []);

  const runSuite = useCallback(async () => {
    setState("running");
    setError(null);
    if (summaryPdfUrl) URL.revokeObjectURL(summaryPdfUrl);
    setSummaryPdfUrl(null);

    const next = bank.map((section) => ({
      section,
      results: [] as NorthstarEaQuestionResult[],
      status: "pending" as const,
    }));
    setProgress(next);

    try {
      for (let s = 0; s < bank.length; s++) {
        const section = bank[s]!;
        setActiveSectionId(section.id);
        setProgress((prev) =>
          prev.map((row, index) => (index === s ? { ...row, status: "running" } : row)),
        );

        const results: NorthstarEaQuestionResult[] = [];
        for (const question of section.questions) {
          const response = await fetch("/api/demo/ea-tests/run-one", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questionId: question.id }),
          });
          const body = (await response.json()) as NorthstarEaQuestionResult | { error?: string };
          if (!response.ok) {
            throw new Error("error" in body && body.error ? body.error : `HTTP ${response.status}`);
          }
          results.push(body as NorthstarEaQuestionResult);
          setProgress((prev) =>
            prev.map((row, index) => (index === s ? { ...row, results: [...results] } : row)),
          );
        }

        const modulePdfUrl = await downloadModulePdf({ section, results, status: "done" });
        setProgress((prev) =>
          prev.map((row, index) =>
            index === s ? { ...row, status: "done", results, modulePdfUrl } : row,
          ),
        );
        setExpanded((prev) => ({ ...prev, [section.id]: results.some((r) => r.status === "fail") }));
      }

      const summaryResponse = await fetch("/api/demo/ea-tests/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "summary" }),
      });
      if (summaryResponse.ok) {
        const blob = await summaryResponse.blob();
        setSummaryPdfUrl(URL.createObjectURL(blob));
      }

      setActiveSectionId(null);
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test run failed.");
      setState("error");
    }
  }, [bank, downloadModulePdf, summaryPdfUrl]);

  return (
    <div className="relative h-full min-h-0 overflow-y-auto bg-[#070b10] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(56,189,248,0.1),_transparent_55%)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-8 pb-16 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400/80">
              Northstar Industrial Technologies
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Executive Assistant — Full Module Test Suite
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-white/60">
              {totalQuestions} questions across HOME, EA, and every LHS nav module (up to 30 per module).
              Automated run with per-module PDF reports and a summary PDF.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10"
            >
              Back to dashboard
            </Link>
            <button
              type="button"
              onClick={() => void runSuite()}
              disabled={state === "running" || bank.length === 0}
              className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-900/30 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {state === "running" ? `Running… ${progressPct}%` : state === "done" ? "Run again" : "Start full test run"}
            </button>
          </div>
        </header>

        {(state === "running" || state === "done") && (
          <section className="mb-8 rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Progress</h2>
              <div className="text-sm text-white/60">
                {passedCount} passed · {failedCount} failed · {completedCount}/{totalQuestions}
              </div>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {activeSectionId && (
              <p className="mt-3 text-sm text-sky-200/80">
                Running: {bank.find((s) => s.id === activeSectionId)?.label ?? activeSectionId}
              </p>
            )}
            {summaryPdfUrl && (
              <div className="mt-4">
                <a
                  href={summaryPdfUrl}
                  download="northstar-ea-summary.pdf"
                  className="inline-flex rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/20"
                >
                  Download summary PDF
                </a>
              </div>
            )}
          </section>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-white/40">Nav order</p>
            <ul className="space-y-1">
              {progress.map((row) => {
                const done = row.status === "done";
                const running = row.status === "running";
                const fail = row.results.some((r) => r.status === "fail");
                return (
                  <li key={row.section.id}>
                    <button
                      type="button"
                      onClick={() => setExpanded((prev) => ({ ...prev, [row.section.id]: true }))}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                        running ? "bg-sky-500/15 text-sky-100" : "hover:bg-white/5 text-white/80"
                      }`}
                    >
                      <span className="truncate">{row.section.label}</span>
                      <span className="ml-2 shrink-0 text-xs text-white/45">
                        {done ? (fail ? "!" : "✓") : running ? "…" : "·"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <div className="space-y-4">
            {progress.map((row) => (
              <section
                key={row.section.id}
                className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => ({ ...prev, [row.section.id]: !prev[row.section.id] }))}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/[0.02]"
                >
                  <div>
                    <h3 className="font-semibold">{row.section.label}</h3>
                    <p className="mt-1 text-xs text-white/45">
                      {row.section.questions.length} questions
                      {row.results.length > 0 &&
                        ` · ${row.results.filter((r) => r.status === "pass").length}/${row.results.length} passed`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {row.modulePdfUrl && (
                      <a
                        href={row.modulePdfUrl}
                        download={`northstar-ea-${row.section.id}.pdf`}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-md border border-white/10 px-2 py-1 text-xs text-white/70 hover:bg-white/5"
                      >
                        Module PDF
                      </a>
                    )}
                    <span className="text-white/40">{expanded[row.section.id] ? "▾" : "▸"}</span>
                  </div>
                </button>
                {expanded[row.section.id] && (
                  <ul className="divide-y divide-white/5 border-t border-white/10">
                    {row.section.questions.map((question) => {
                      const result = row.results.find((r) => r.id === question.id);
                      return (
                        <li key={question.id} className="px-5 py-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                {question.subModuleLabel && (
                                  <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/45">
                                    {question.subModuleLabel}
                                  </span>
                                )}
                                <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/45">
                                  {question.kind}
                                </span>
                                {result && <StatusBadge ok={result.status === "pass"} />}
                              </div>
                              <p className="mt-2 text-sm text-white/90">{question.prompt}</p>
                              {result?.summary && (
                                <p className="mt-2 text-xs text-white/55 line-clamp-3">{result.summary}</p>
                              )}
                              {result?.error && (
                                <p className="mt-2 text-xs text-rose-300/90">{result.error}</p>
                              )}
                            </div>
                            {result?.tool && (
                              <span className="shrink-0 font-mono text-[10px] text-sky-300/70">{result.tool}</span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
