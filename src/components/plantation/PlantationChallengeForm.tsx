"use client";

import { useState, type FormEvent } from "react";

import { PLANTATION_DUPLICATE_MESSAGE } from "@/lib/plantation/plantation-challenge";

const FIELDS = [
  {
    name: "section1Hectares",
    label: "Enter estimated hectare size of section 1",
    step: "0.1",
    inputMode: "decimal" as const,
  },
  {
    name: "section2Hectares",
    label: "Enter estimated hectare size of section 2",
    step: "0.1",
    inputMode: "decimal" as const,
  },
  {
    name: "section1Trees",
    label: "Enter estimate number of palm oil trees in section 1",
    step: "1",
    inputMode: "numeric" as const,
  },
  {
    name: "section2Trees",
    label: "Enter estimate number of palm oil trees in section 2",
    step: "1",
    inputMode: "numeric" as const,
  },
];

export default function PlantationChallengeForm() {
  const [participantName, setParticipantName] = useState("");
  const [values, setValues] = useState<Record<string, string>>({
    section1Hectares: "",
    section2Hectares: "",
    section1Trees: "",
    section2Trees: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!participantName.trim()) {
      setError("Enter your name.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/plantation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantName,
          section1Hectares: values.section1Hectares,
          section2Hectares: values.section2Hectares,
          section1Trees: values.section1Trees,
          section2Trees: values.section2Trees,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (response.status === 409) {
        setError(payload?.error || PLANTATION_DUPLICATE_MESSAGE);
        return;
      }
      if (!response.ok) {
        setError(payload?.error || "We could not submit your estimates. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("We could not submit your estimates. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-slate-900">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1a4d3a]">
            WOLF course
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Plantation challenge
          </h1>
          <p className="mt-3 text-base text-slate-700">
            Enter your name and your estimates for the two outlined sections.
          </p>
        </header>

        {submitted ? (
          <section className="rounded-2xl border border-emerald-200 bg-white px-6 py-10 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-950">Thank you</h2>
            <p className="mt-3 text-base text-slate-700">Your estimates have been submitted.</p>
          </section>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6" noValidate>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <label htmlFor="participant-name" className="block text-base font-semibold text-slate-950">
                Enter your name
              </label>
              <input
                id="participant-name"
                name="participantName"
                type="text"
                required
                autoComplete="name"
                maxLength={120}
                value={participantName}
                onChange={(event) => setParticipantName(event.target.value)}
                className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none ring-emerald-700 focus:ring-2"
              />
            </section>

            {FIELDS.map((field) => (
              <section
                key={field.name}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <label htmlFor={field.name} className="block text-base font-semibold text-slate-950">
                  {field.label}
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  type="number"
                  required
                  min={0}
                  step={field.step}
                  inputMode={field.inputMode}
                  value={values[field.name]}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, [field.name]: event.target.value }))
                  }
                  className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none ring-emerald-700 focus:ring-2"
                />
              </section>
            ))}

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#1a4d3a] px-5 py-3 text-base font-semibold text-white hover:bg-[#143d2e] disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
