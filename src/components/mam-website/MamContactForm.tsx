"use client";

import { useState } from "react";

import { MAM_CONTACT_EMAIL, MAM_LOCATION_LABEL } from "@/lib/mam/mam-website";

const INDUSTRIES = [
  "Aerospace",
  "Automotive",
  "Medical",
  "Industrial",
  "Robotics",
  "Energy",
  "Consumer Products",
  "Architecture",
  "Research & Development",
  "Other",
] as const;

export default function MamContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        className="rounded-sm border border-[#8fa4b8]/40 bg-[#14181f] p-8 text-center"
        role="status"
      >
        <p className="text-lg font-semibold text-white">Thank you — your request has been recorded.</p>
        <p className="mt-3 text-sm text-[#b0b8c0]">
          This demo form does not send email yet. When backend delivery is configured, MAM will
          respond via{" "}
          <a href={`mailto:${MAM_CONTACT_EMAIL}`} className="text-[#8fa4b8] hover:underline">
            {MAM_CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-white/90">Name</span>
          <input
            required
            name="name"
            className="mt-1.5 w-full rounded-sm border border-white/15 bg-[#0c0e11] px-3 py-2.5 text-white outline-none focus:border-[#8fa4b8]"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-white/90">Company</span>
          <input
            required
            name="company"
            className="mt-1.5 w-full rounded-sm border border-white/15 bg-[#0c0e11] px-3 py-2.5 text-white outline-none focus:border-[#8fa4b8]"
          />
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-white/90">Email</span>
          <input
            required
            type="email"
            name="email"
            className="mt-1.5 w-full rounded-sm border border-white/15 bg-[#0c0e11] px-3 py-2.5 text-white outline-none focus:border-[#8fa4b8]"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-white/90">Phone</span>
          <input
            name="phone"
            type="tel"
            className="mt-1.5 w-full rounded-sm border border-white/15 bg-[#0c0e11] px-3 py-2.5 text-white outline-none focus:border-[#8fa4b8]"
          />
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-white/90">Industry</span>
          <select
            name="industry"
            className="mt-1.5 w-full rounded-sm border border-white/15 bg-[#0c0e11] px-3 py-2.5 text-white outline-none focus:border-[#8fa4b8]"
            defaultValue=""
          >
            <option value="" disabled>
              Select…
            </option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-white/90">Quantity</span>
          <input
            name="quantity"
            placeholder="e.g. 1 prototype, 50 units"
            className="mt-1.5 w-full rounded-sm border border-white/15 bg-[#0c0e11] px-3 py-2.5 text-white outline-none focus:border-[#8fa4b8]"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="font-medium text-white/90">Project / Component</span>
        <input
          name="project"
          className="mt-1.5 w-full rounded-sm border border-white/15 bg-[#0c0e11] px-3 py-2.5 text-white outline-none focus:border-[#8fa4b8]"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-white/90">Message</span>
        <textarea
          required
          name="message"
          rows={5}
          className="mt-1.5 w-full resize-y rounded-sm border border-white/15 bg-[#0c0e11] px-3 py-2.5 text-white outline-none focus:border-[#8fa4b8]"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-white/90">File upload</span>
        <input
          type="file"
          name="file"
          className="mt-1.5 w-full text-sm text-[#b0b8c0] file:mr-4 file:rounded-sm file:border-0 file:bg-[#8fa4b8] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#0c0e11]"
        />
        <span className="mt-1 block text-xs text-white/45">
          Attachments are not uploaded until backend storage is configured.
        </span>
      </label>
      <button
        type="submit"
        className="w-full rounded-sm bg-[#8fa4b8] px-5 py-3 text-sm font-semibold text-[#0c0e11] transition-colors hover:bg-[#a8bac9] sm:w-auto"
      >
        Request a Quote
      </button>
    </form>
  );
}

export function MamContactAside() {
  return (
    <aside className="border border-white/10 bg-[#14181f] p-6 sm:p-8">
      <p className="text-lg font-semibold text-white">MAM — Moroccan Advanced Manufacturing</p>
      <p className="mt-2 text-sm text-[#b0b8c0]">{MAM_LOCATION_LABEL}</p>
      <p className="mt-4 text-sm">
        <span className="text-white/50">Email </span>
        <a href={`mailto:${MAM_CONTACT_EMAIL}`} className="text-[#8fa4b8] hover:underline">
          {MAM_CONTACT_EMAIL}
        </a>
      </p>
    </aside>
  );
}
