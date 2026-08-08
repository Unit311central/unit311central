"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { ABHI_EA_PHASE1_DEMO_CHECKS } from "@/lib/abhi/ea-phase1-demo-checks";
import type { EaTestSuiteReport } from "@/lib/abhi/ea-test-suite";

type RunState = "idle" | "running" | "done" | "error";
type DeckState = "idle" | "generating" | "ready" | "error";

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

export function AbhiEaTestingWorkspace() {
  const [state, setState] = useState<RunState>("idle");
  const [deckState, setDeckState] = useState<DeckState>("idle");
  const [report, setReport] = useState<EaTestSuiteReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deckError, setDeckError] = useState<string | null>(null);
  const [meetingDate, setMeetingDate] = useState("2026-09-15");
  const [deckMeta, setDeckMeta] = useState<{ packName: string; pageCount: number; build: string } | null>(null);
  const [deckPdfUrl, setDeckPdfUrl] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyPrompt = useCallback(async (id: string, prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 2000);
    } catch {
      setCopiedId(null);
    }
  }, []);

  const runSuite = useCallback(async () => {
    setState("running");
    setError(null);
    try {
      const response = await fetch("/api/abhi/ea-tests", { method: "POST", cache: "no-store" });
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

  const generateDeck = useCallback(async () => {
    setDeckState("generating");
    setDeckError(null);
    if (deckPdfUrl) URL.revokeObjectURL(deckPdfUrl);
    setDeckPdfUrl(null);
    setDeckMeta(null);
    try {
      const response = await fetch(`/api/abhi/board-deck?b=${Date.now()}`, {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ when: meetingDate.trim() || "2026-09-15" }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${response.status}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDeckPdfUrl(url);
      setDeckMeta({
        packName: response.headers.get("X-Abhi-Pack-Name") ?? "ABHI Board Pack",
        pageCount: Number(response.headers.get("X-Abhi-Page-Count") ?? 11),
        build: response.headers.get("X-Abhi-Deck-Build") ?? "unknown",
      });
      setDeckState("ready");
    } catch (err) {
      setDeckError(err instanceof Error ? err.message : "Failed to generate board deck.");
      setDeckState("error");
    }
  }, [deckPdfUrl, meetingDate]);

  return (
    <div className="relative h-full min-h-0 overflow-y-auto bg-[#070b10] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(194,24,91,0.1),_transparent_55%)]" />
      <div className="relative mx-auto max-w-5xl px-4 py-8 pb-12 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-300/90">
              ABHI
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Executive Assistant Test Suite
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Automated EA checks across all ABHI modules, natural-language routing, and board deck PDF
              generation from live membership, financial, and governance fixtures.
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
              className="rounded-lg bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-900/30 transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {state === "running" ? "Running…" : report ? "Run again" : "Run tests"}
            </button>
          </div>
        </header>

        <section className="mb-8 rounded-xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Phase 1 demo checklist</h2>
            <p className="mt-1 max-w-3xl text-sm text-white/55">
              Manual walkthrough prompts for client demos. Copy a prompt into the Executive Assistant, or open
              the linked module first for view-aware checks.
            </p>
          </div>
          <ul className="divide-y divide-white/5 rounded-lg border border-white/10">
            {ABHI_EA_PHASE1_DEMO_CHECKS.map((check) => (
              <li key={check.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm text-rose-200/90">{check.prompt}</p>
                  <p className="mt-2 text-sm text-white/70">
                    <span className="text-white/45">Expected: </span>
                    {check.expected}
                  </p>
                  {check.context && (
                    <p className="mt-1 text-xs text-white/45">
                      <span className="text-white/35">Context: </span>
                      {check.context}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                  {check.href && (
                    <Link
                      href={check.href}
                      className="rounded-md border border-white/10 px-3 py-1.5 text-xs font-medium text-white/75 transition hover:bg-white/5"
                    >
                      {check.hrefLabel ?? "Open"}
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => void copyPrompt(check.id, check.prompt)}
                    className="rounded-md border border-rose-500/25 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20"
                  >
                    {copiedId === check.id ? "Copied" : "Copy prompt"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-8 rounded-xl border border-white/10 bg-white/[0.02] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Board deck PDF preview</h2>
              <p className="mt-1 max-w-2xl text-sm text-white/55">
                Generate the ABHI board meeting pack — executive summary, actions, risk register, KPIs,
                financials, commercial performance, team, and strategic discussion.
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs text-white/50">
                Meeting date
                <input
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  placeholder="2026-09-15"
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none ring-rose-500/40 focus:ring-2"
                />
              </label>
              <button
                type="button"
                onClick={() => void generateDeck()}
                disabled={deckState === "generating"}
                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-60"
              >
                {deckState === "generating" ? "Generating…" : "Generate board deck"}
              </button>
            </div>
          </div>

          {deckState === "generating" && (
            <p className="mt-4 text-sm text-white/60">Building PDF with KPIs, financials, and governance data…</p>
          )}
          {deckError && <p className="mt-4 text-sm text-rose-300">{deckError}</p>}
          {deckMeta && deckPdfUrl && (
            <div className="mt-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm text-white/70">
                <span>
                  {deckMeta.packName} · {deckMeta.pageCount} slides · build{" "}
                  <span className="font-mono text-rose-300">{deckMeta.build}</span>
                </span>
                <a
                  href={deckPdfUrl}
                  download
                  className="rounded-md border border-white/10 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/5"
                >
                  Download PDF
                </a>
              </div>
              <iframe
                title="ABHI board deck preview"
                src={deckPdfUrl}
                className="h-[min(70vh,720px)] w-full rounded-lg border border-white/10 bg-white"
              />
            </div>
          )}
        </section>

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
            <p className="text-sm text-white/55">Click Run tests to execute the ABHI EA suite in the browser.</p>
          </div>
        )}
      </div>
    </div>
  );
}
