"use client";

import { FormEvent, useState } from "react";
import { CONTACT } from "@/lib/site";

type ContactFormProps = {
  variant?: "default" | "marketing";
  embedded?: boolean;
};

export default function ContactForm({ variant = "default", embedded = false }: ContactFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMarketing = variant === "marketing";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          company: formData.get("company"),
          email: formData.get("email"),
          subject: formData.get("subject"),
          message: formData.get("message"),
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to send enquiry");
      }

      setSubmitted(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We couldn't send your enquiry right now. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const cardClass = isMarketing
    ? embedded
      ? "rounded-2xl bg-white px-5 py-6 shadow-[0_8px_32px_rgba(11,45,99,0.14)] sm:px-7 sm:py-8"
      : "rounded-xl bg-white px-5 py-6 shadow-[0_4px_24px_rgba(11,45,99,0.12)] sm:px-8 sm:py-8"
    : "rounded-2xl border border-border bg-surface p-6 sm:p-8";

  const labelClass = isMarketing
    ? "mb-1.5 block text-sm font-medium text-[#1a2b4a]"
    : "mb-1.5 block text-sm font-medium text-foreground";

  const fieldClass = isMarketing
    ? "w-full rounded-lg border border-[#d7e3f4] bg-white px-4 py-2.5 text-sm text-[#1a2b4a] placeholder:text-[#1a2b4a]/45 focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] disabled:opacity-60"
    : "w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60";

  const textareaClass = `${fieldClass} resize-none`;

  const buttonClass = isMarketing
    ? "inline-flex items-center justify-center rounded-xl bg-[#2563eb] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_32px_rgba(37,99,235,0.35)] transition-colors hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
    : "inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60";

  if (submitted) {
    return (
      <div className={cardClass}>
        <div className="text-center">
          <p className={`text-lg font-semibold ${isMarketing ? "text-[#1a2b4a]" : "text-foreground"}`}>
            Thank you for reaching out
          </p>
          <p className={`mt-2 text-sm ${isMarketing ? "text-[#1a2b4a]/70" : "text-muted"}`}>
            We&apos;ve sent a confirmation to your email and will respond within one business day.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className={labelClass}>
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              disabled={submitting}
              className={fieldClass}
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="company" className={labelClass}>
              Company
            </label>
            <input
              id="company"
              name="company"
              type="text"
              disabled={submitting}
              className={fieldClass}
              placeholder="Company name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            disabled={submitting}
            className={fieldClass}
            placeholder={CONTACT.email}
          />
        </div>

        <div>
          <label htmlFor="subject" className={labelClass}>
            Subject
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            disabled={submitting}
            className={fieldClass}
            placeholder="What is your enquiry about?"
          />
        </div>

        <div>
          <label htmlFor="message" className={labelClass}>
            Project details
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            required
            disabled={submitting}
            className={textareaClass}
            placeholder="Tell us about your business, team size, timeline, and what you need from Unit311..."
          />
        </div>

        {error ? (
          <p className={`text-sm ${isMarketing ? "text-red-600" : "text-red-400"}`} role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className={buttonClass} disabled={submitting}>
          {submitting ? "Sending..." : "Send enquiry"}
        </button>
      </form>
    </div>
  );
}
