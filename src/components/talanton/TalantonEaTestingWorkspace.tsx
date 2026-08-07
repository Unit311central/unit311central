"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import type { EaTestSuiteReport } from "@/lib/talanton/ea-test-suite";

type RunState = "idle" | "running" | "done" | "error";

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        ok ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
      }`}
    >
      {ok ? "PASS" : "FAIL"}
    </span>
  );
}

export function TalantonEaTestingWorkspace() {
  const [state, setState] = useState<RunState>("idle");
  const [report, setReport] = useState<EaTestSuiteReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const runSuite = useCallback(async () => {
    setState("running");
    setError(null);
    try {
      const response = await fetch("/api/talanton/ea-tests", { method: "POST", cache: "no-store" });
      const body = (await response.json()) as EaTestSuiteReport | { error?: string };
      if (!response.ok) {
        throw new Error("error" in body && body.error ? body.error : `HTTP ${response.status}`);
      }
      setReport(body as EaTestSuiteReport);
      const open: Record<string, boolean> = {};
      for (const section of (body as EaTestSuiteReport).sections) {
        open[section.id] = section.failed > 0;
      }
      setExpanded(open);
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run test suite.");
      setState("error");
    }
  }, []);

  const toggleSection = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-[#070b10] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.08),_transparent_55%)]" />
      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400/80">
              Talanton Impact
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Executive Assistant Test Suite
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Intent routing, analysis outputs, board pack guards, org-state overlay, scoped PDF metrics,
              tool registry, and orchestration — same checks as{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 text-emerald-200/90">npm run prove:talanton-ea</code>.
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
              disabled={state === "running"}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {state === "running" ? "Running…" : report ? "Run again" : "Run tests"}
            </button>
          </div>
        </header>

        {state === "running" && (
          <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
            Executing suite…
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        {report && (
          <>
            <div
              className={`mb-6 grid gap-4 rounded-xl border p-5 sm:grid-cols-4 ${
                report.ok
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-rose-500/30 bg-rose-500/5"
              }`}
            >
              <div>
                <p className="text-xs uppercase tracking-wider text-white/50">Result</p>
                <p className="mt-1 text-lg font-semibold">{report.ok ? "All passed" : "Failures detected"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-white/50">Passed</p>
                <p className="mt-1 text-lg font-semibold text-emerald-300">{report.passed}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-white/50">Failed</p>
                <p className="mt-1 text-lg font-semibold text-rose-300">{report.failed}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-white/50">Duration</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{report.durationMs} ms</p>
              </div>
            </div>

            <div className="space-y-4">
              {report.sections.map((section) => {
                const isOpen = expanded[section.id] ?? section.failed > 0;
                const sectionOk = section.failed === 0;
                return (
                  <section
                    key={section.id}
                    className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-white/[0.03] sm:px-5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <StatusBadge ok={sectionOk} />
                        <h2 className="truncate font-medium">{section.title}</h2>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 text-xs text-white/50">
                        <span>
                          {section.passed}/{section.passed + section.failed}
                        </span>
                        <span className="text-white/40">{isOpen ? "▾" : "▸"}</span>
                      </div>
                    </button>
                    {isOpen && (
                      <ul className="divide-y divide-white/5 border-t border-white/10">
                        {section.cases.map((testCase) => (
                          <li
                            key={testCase.id}
                            className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-5"
                          >
                            <div className="min-w-0">
                              <p className="text-sm text-white/90">{testCase.label}</p>
                              {testCase.detail && (
                                <p className="mt-0.5 text-xs text-white/45">{testCase.detail}</p>
                              )}
                              {testCase.error && (
                                <p className="mt-1 text-xs text-rose-300">{testCase.error}</p>
                              )}
                            </div>
                            <StatusBadge ok={testCase.status === "pass"} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })}
            </div>

            <p className="mt-6 text-center text-xs text-white/35">
              {report.version} · finished {new Date(report.finishedAt).toLocaleString()}
            </p>
          </>
        )}

        {state === "idle" && !report && (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
            <p className="text-sm text-white/55">Click Run tests to execute the Talanton EA suite in the browser.</p>
          </div>
        )}
      </div>
    </div>
  );
}
